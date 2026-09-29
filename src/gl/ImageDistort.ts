import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from "three";
import gsap from "gsap";

/**
 * Imagen reactiva WebGL para los casos:
 *  - Transición líquida entre imágenes (fbm + frente luminoso)
 *  - Lente + onda alrededor del cursor
 *  - Separación RGB proporcional a la velocidad del ratón
 *  - Grading: scanlines, viñeta y grano
 * Se instancia solo en desktop, cuando la sección se acerca al viewport.
 */
const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform vec2 uRes;
uniform float uProgress;
uniform vec2 uMouse;
uniform float uHover;
uniform vec2 uVel;
uniform float uTime;
uniform float uReveal;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

vec2 cover(vec2 uv, vec2 img) {
  float rs = uRes.x / uRes.y; float ri = img.x / img.y;
  vec2 s = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}
vec3 samp(sampler2D t, vec2 uv, vec2 img, vec2 shift) {
  vec2 c = cover(uv, img);
  return vec3(texture2D(t, c + shift).r, texture2D(t, c).g, texture2D(t, c - shift).b);
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 uv = vUv;
  vec2 d = uv - uMouse; d.x *= aspect;
  float dist = length(d);
  vec2 dir = d / max(dist, 1e-4); dir.x /= aspect;

  // Lente de aumento + onda alrededor del cursor
  float lens = smoothstep(0.42, 0.0, dist) * uHover;
  uv -= dir * lens * dist * 0.35;
  uv += dir * sin(dist * 40.0 - uTime * 5.0) * exp(-dist * 6.0) * 0.006 * uHover;

  // Zoom de seguridad + ligero parallax con el ratón
  uv = (uv - 0.5) * 0.92 + 0.5 + (uMouse - 0.5) * 0.02 * uHover;

  // Transición líquida
  float n = fbm(vUv * 3.2 + uTime * 0.04);
  float q = n * 0.55 + vUv.x * 0.45;
  float edge = uProgress * 1.3 - 0.15;
  float mask = smoothstep(q - 0.12, q + 0.12, edge);
  vec2 off = vec2(n - 0.5) * 0.35;
  vec2 shift = uVel * 0.012 + dir * 0.003 * uHover;
  vec3 a = samp(uTexA, uv + off * uProgress, uSizeA, shift);
  vec3 b = samp(uTexB, uv - off * (1.0 - uProgress), uSizeB, shift);
  vec3 col = mix(a, b, mask);

  float front = smoothstep(0.1, 0.0, abs(edge - q)) * sin(uProgress * 3.14159);
  col += vec3(0.36, 0.95, 1.0) * front * 0.7;

  // Grading
  col += vec3(0.36, 0.95, 1.0) * smoothstep(0.3, 0.0, dist) * 0.07 * uHover;
  col *= 0.97 + 0.03 * sin(vUv.y * uRes.y * 1.4);
  float vig = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(aspect * 0.8, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col += (hash(vUv * uRes + fract(uTime) * 100.0) - 0.5) * 0.04;

  // Revelado inicial con ruido
  float rev = smoothstep(0.0, 0.08, uReveal * 1.3 - (1.0 - vUv.y) * 0.9 - n * 0.3);
  gl_FragColor = vec4(col * rev, 1.0);
}
`;

export class ImageDistort {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mat: ShaderMaterial;
  private quad: Mesh;
  private canvas: HTMLCanvasElement;
  private textures: Texture[] = [];
  private sizes: Vector2[] = [];
  private current = 0;
  private queued: number | null = null;
  private anim = { p: 0 };
  private transitioning = false;
  private loaded = false;
  private disposed = false;
  private mouse = new Vector2(0.5, 0.5);
  private target = new Vector2(0.5, 0.5);
  private vel = new Vector2();
  private hover = 0;
  private hoverTarget = 0;

  constructor(canvas: HTMLCanvasElement, urls: string[], maxDpr = 1.5) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setClearColor(0x0a0c13, 1);
    this.mat = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTexA: { value: null },
        uTexB: { value: null },
        uSizeA: { value: new Vector2(1, 1) },
        uSizeB: { value: new Vector2(1, 1) },
        uRes: { value: new Vector2(1, 1) },
        uProgress: { value: 0 },
        uMouse: { value: this.mouse },
        uHover: { value: 0 },
        uVel: { value: this.vel },
        uTime: { value: 0 },
        uReveal: { value: 0 },
      },
    });
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.mat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.resize();

    const loader = new TextureLoader();
    Promise.all(urls.map((u) => loader.loadAsync(u)))
      .then((texs) => {
        if (this.disposed) {
          texs.forEach((t) => t.dispose());
          return;
        }
        texs.forEach((t) => {
          t.minFilter = LinearFilter;
          t.generateMipmaps = false;
          t.needsUpdate = true;
        });
        this.textures = texs;
        this.sizes = texs.map((t) => {
          const img = t.image as { width: number; height: number };
          return new Vector2(img.width, img.height);
        });
        this.setTex("A", this.current);
        this.setTex("B", this.current);
        this.loaded = true;
        gsap.to(this.mat.uniforms.uReveal, { value: 1, duration: 1.6, ease: "power3.out" });
      })
      .catch(() => {
        /* si falla la carga, el panel queda con el color de fondo */
      });
  }

  private setTex(slot: "A" | "B", i: number) {
    this.mat.uniforms[`uTex${slot}`].value = this.textures[i];
    (this.mat.uniforms[`uSize${slot}`].value as Vector2).copy(this.sizes[i]);
  }

  show(i: number) {
    if (!this.loaded) {
      this.current = i;
      return;
    }
    if (this.transitioning) {
      this.queued = i;
      return;
    }
    if (i === this.current) return;
    this.transitioning = true;
    this.setTex("B", i);
    gsap.fromTo(
      this.anim,
      { p: 0 },
      {
        p: 1,
        duration: 1.3,
        ease: "power2.inOut",
        onComplete: () => {
          this.current = i;
          this.setTex("A", i);
          this.anim.p = 0;
          this.transitioning = false;
          const q = this.queued;
          this.queued = null;
          if (q !== null && q !== i) this.show(q);
        },
      },
    );
  }

  setPointer(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    this.target.set((clientX - r.left) / r.width, 1 - (clientY - r.top) / r.height);
  }

  setHover(v: number) {
    this.hoverTarget = v;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    (this.mat.uniforms.uRes.value as Vector2).set(w, h);
  }

  render(time: number) {
    const px = this.mouse.x;
    const py = this.mouse.y;
    this.mouse.lerp(this.target, 0.12);
    this.vel.x += ((this.mouse.x - px) * 30 - this.vel.x) * 0.2;
    this.vel.y += ((this.mouse.y - py) * 30 - this.vel.y) * 0.2;
    this.hover += (this.hoverTarget - this.hover) * 0.08;
    const u = this.mat.uniforms;
    u.uTime.value = time;
    u.uProgress.value = this.anim.p;
    u.uHover.value = this.hover;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    gsap.killTweensOf([this.anim, this.mat.uniforms.uReveal]);
    this.textures.forEach((t) => t.dispose());
    this.mat.dispose();
    this.quad.geometry.dispose();
    this.renderer.dispose();
  }
}
