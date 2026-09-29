import {
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { pointer } from "@/lib/loop";

/**
 * Rastro de luz "fluid-lite" (técnica descrita por Lusion):
 *  - Ping-pong de dos render targets de 8 bits a 1/4 de resolución
 *  - RG = velocidad codificada, B = densidad
 *  - Advección + difusión barata + disipación
 *  - La inyección sigue el SEGMENTO recorrido por el ratón (sin huecos a alta velocidad)
 * Coste: 2 pasadas de pantalla completa a baja resolución; se detiene sola cuando el ratón está quieto.
 */
const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const clearFrag = /* glsl */ `
void main() { gl_FragColor = vec4(0.5, 0.5, 0.0, 1.0); }
`;

const simFrag = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform vec2 uVel;
uniform float uForce;
uniform float uRadius;
uniform float uAspect;
uniform vec2 uTexel;
varying vec2 vUv;

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 vel = texture2D(uPrev, vUv).rg * 2.0 - 1.0;
  vec2 back = vUv - vel * uTexel * 5.0;
  vec4 s = texture2D(uPrev, back);
  vec2 v = s.rg * 2.0 - 1.0;
  float dens = s.b;

  float blur = texture2D(uPrev, back + vec2(uTexel.x, 0.0)).b + texture2D(uPrev, back - vec2(uTexel.x, 0.0)).b
             + texture2D(uPrev, back + vec2(0.0, uTexel.y)).b + texture2D(uPrev, back - vec2(0.0, uTexel.y)).b;
  dens = mix(dens, blur * 0.25, 0.4);

  // Disipación con resta mínima: garantiza que el buffer de 8 bits llegue a 0
  dens = max(dens * 0.972 - 0.0035, 0.0);
  v *= 0.95;
  v = sign(v) * max(abs(v) - 0.006, 0.0);

  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float d = segDist(p, vec2(uPrevMouse.x * uAspect, uPrevMouse.y), vec2(uMouse.x * uAspect, uMouse.y));
  float splat = exp(-(d * d) / (uRadius * uRadius)) * uForce;
  v = mix(v, clamp(uVel, -1.0, 1.0), clamp(splat * 1.5, 0.0, 1.0));
  dens = clamp(dens + splat, 0.0, 1.0);

  gl_FragColor = vec4(v * 0.5 + 0.5, dens, 1.0);
}
`;

const displayFrag = /* glsl */ `
uniform sampler2D uSim;
varying vec2 vUv;
void main() {
  vec4 s = texture2D(uSim, vUv);
  vec2 v = s.rg * 2.0 - 1.0;
  float dens = s.b;
  float speed = clamp(length(v) * 1.4, 0.0, 1.0);
  vec3 cyan = vec3(0.36, 0.95, 1.0);
  vec3 violet = vec3(0.55, 0.36, 1.0);
  vec3 volt = vec3(0.84, 1.0, 0.29);
  vec3 col = mix(violet, cyan, smoothstep(0.05, 0.7, dens));
  col = mix(col, volt, smoothstep(0.6, 1.0, speed) * 0.4);
  col += vec3(1.0) * smoothstep(0.75, 1.0, dens) * 0.3;
  float a = smoothstep(0.0, 0.55, dens) * 0.85;
  gl_FragColor = vec4(col * a, a);
}
`;

export class FluidTrail {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: Mesh;
  private simMat: ShaderMaterial;
  private displayMat: ShaderMaterial;
  private clearMat: ShaderMaterial;
  private rtA: WebGLRenderTarget | null = null;
  private rtB: WebGLRenderTarget | null = null;
  private mouse = new Vector2(0.5, 0.5);
  private prev = new Vector2(0.5, 0.5);
  private idle = 10;
  private burst = 0;
  private started = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);

    this.simMat = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: simFrag,
      uniforms: {
        uPrev: { value: null },
        uMouse: { value: new Vector2(0.5, 0.5) },
        uPrevMouse: { value: new Vector2(0.5, 0.5) },
        uVel: { value: new Vector2() },
        uForce: { value: 0 },
        uRadius: { value: 0.03 },
        uAspect: { value: 1 },
        uTexel: { value: new Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.displayMat = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: displayFrag,
      uniforms: { uSim: { value: null } },
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.clearMat = new ShaderMaterial({ vertexShader: vert, fragmentShader: clearFrag, depthTest: false, depthWrite: false, blending: NoBlending });

    this.quad = new Mesh(new PlaneGeometry(2, 2), this.simMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.resize();
  }

  private makeRT(w: number, h: number) {
    return new WebGLRenderTarget(w, h, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      type: UnsignedByteType,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // El canvas se dibuja a media resolución y el navegador lo escala (barato y suave)
    this.renderer.setSize(Math.ceil(w * 0.5), Math.ceil(h * 0.5), false);
    const sw = Math.max(64, Math.ceil(w / 4));
    const sh = Math.max(64, Math.ceil(h / 4));
    this.rtA?.dispose();
    this.rtB?.dispose();
    this.rtA = this.makeRT(sw, sh);
    this.rtB = this.makeRT(sw, sh);
    this.quad.material = this.clearMat;
    for (const rt of [this.rtA, this.rtB]) {
      this.renderer.setRenderTarget(rt);
      this.renderer.render(this.scene, this.camera);
    }
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    (this.simMat.uniforms.uTexel.value as Vector2).set(1 / sw, 1 / sh);
    this.simMat.uniforms.uAspect.value = w / h;
  }

  pulse() {
    this.burst = 1;
  }

  render(dt: number) {
    if (!pointer.moved || !this.rtA || !this.rtB) return;
    this.mouse.set(pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);
    let dx = this.mouse.x - this.prev.x;
    let dy = this.mouse.y - this.prev.y;
    // Evita "rayas" al entrar/salir de la ventana
    if (!this.started || Math.hypot(dx, dy) > 0.3) {
      this.prev.copy(this.mouse);
      dx = dy = 0;
      this.started = true;
    }
    const speed = Math.hypot(dx, dy);
    const force = Math.min(speed * 55, 1) * (pointer.inside ? 1 : 0);
    const active = force > 0.002 || this.burst > 0.01;
    this.idle = active ? 0 : this.idle + dt;
    if (this.idle > 3) {
      this.prev.copy(this.mouse);
      return; // Nada que simular → 0 coste de GPU
    }

    const su = this.simMat.uniforms;
    su.uPrev.value = this.rtA.texture;
    (su.uMouse.value as Vector2).copy(this.mouse);
    (su.uPrevMouse.value as Vector2).copy(this.prev);
    (su.uVel.value as Vector2).set(dx * 28, dy * 28);
    su.uForce.value = Math.max(force, this.burst);
    su.uRadius.value = 0.022 + this.burst * 0.05 + Math.min(speed * 0.8, 0.02);
    this.quad.material = this.simMat;
    this.renderer.setRenderTarget(this.rtB);
    this.renderer.render(this.scene, this.camera);
    const tmp = this.rtA;
    this.rtA = this.rtB;
    this.rtB = tmp;

    this.displayMat.uniforms.uSim.value = this.rtA.texture;
    this.quad.material = this.displayMat;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    this.prev.copy(this.mouse);
    this.burst *= 0.8;
  }

  dispose() {
    this.rtA?.dispose();
    this.rtB?.dispose();
    this.simMat.dispose();
    this.displayMat.dispose();
    this.clearMat.dispose();
    this.quad.geometry.dispose();
    this.renderer.dispose();
  }
}
