import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import gsap from "gsap";
import { buildDust, buildShapes } from "./shapes";
import { dustFragment, dustVertex, particleFragment, particleVertex } from "./shaders";
import { pointer, scrollState } from "@/lib/loop";

/**
 * Campo de partículas persistente (un único canvas fijo para toda la web,
 * patrón Lusion / Active Theory): las secciones no crean escenas nuevas,
 * solo cambian el "estado" → sin recrear contextos WebGL ni recompilar shaders.
 */
export interface FieldState {
  x: number;
  y: number;
  z: number;
  scale: number;
  tilt: number;
  spin: number;
  intensity: number;
  wave: number;
}

const DESKTOP: FieldState[] = [
  { x: 2.2, y: 0.05, z: 0, scale: 1, tilt: 0.25, spin: 0.09, intensity: 1, wave: 0 }, // 0 · Nube
  { x: 0, y: -1.05, z: 0, scale: 1.05, tilt: 0.62, spin: 0, intensity: 0.62, wave: 1 }, // 1 · Red
  { x: 0, y: 0.1, z: -0.6, scale: 1.05, tilt: 0.42, spin: 0.16, intensity: 0.5, wave: 0 }, // 2 · Infra
  { x: -1.9, y: 0, z: -0.8, scale: 1, tilt: 0.2, spin: 0.12, intensity: 0.42, wave: 0 }, // 3 · IA
  { x: 0, y: -0.25, z: -0.6, scale: 1.08, tilt: 1.08, spin: 0.07, intensity: 0.72, wave: 0 }, // 4 · Órbita
  { x: 0, y: 0.25, z: 0, scale: 1, tilt: 0, spin: 0, intensity: 0.85, wave: 0 }, // 5 · Portal
];
const MOBILE: Partial<FieldState>[] = [{ x: 0, y: 1.05 }, { x: 0, y: -1.6 }, { x: 0, y: 0.3 }, { x: 0, y: 0.6 }, { x: 0, y: 0 }, { x: 0, y: 0.5 }];

/** Info pública para el HUD de rendimiento */
export const glInfo = { count: 0, drawn: 0, dpr: 1, renderer: "WebGL2", state: 0 };

export interface FieldOptions {
  count: number;
  maxDpr: number;
  touch: boolean;
  reducedMotion: boolean;
}

export class ParticleField {
  covered = false;
  private opts: FieldOptions;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(45, 1, 0.1, 60);
  private group = new Group();
  private points: Points;
  private geometry: BufferGeometry;
  private material: ShaderMaterial;
  private dustGeometry: BufferGeometry;
  private dustMaterial: ShaderMaterial;
  private layout: FieldState;
  private morph = { t: 1 };
  private rot = { y: 0 };
  private intro = { turb: 2.8, fade: 0 };
  private fromW = [1, 0, 0, 0, 0, 0];
  private toW = [1, 0, 0, 0, 0, 0];
  private mouse = new Vector3(50, 50, 0);
  private ray = new Vector3();
  private strength = 0;
  private turb = 0;
  private tapBoost = 0;
  private dpr: number;
  private state = 0;
  private elapsed = 0;
  private fpsSmooth = 60;
  private slowFrames = 0;
  private lastWidth = 0;
  private eco = false;

  constructor(canvas: HTMLCanvasElement, opts: FieldOptions) {
    this.opts = opts;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x05060a, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.maxDpr);
    this.renderer.setPixelRatio(this.dpr);

    // --- Geometría: 6 formas como atributos ---
    const { shapes, rnd } = buildShapes(opts.count);
    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", new BufferAttribute(shapes[0], 3));
    for (let i = 1; i < shapes.length; i++) this.geometry.setAttribute(`aS${i}`, new BufferAttribute(shapes[i], 3));
    this.geometry.setAttribute("aRnd", new BufferAttribute(rnd, 4));

    const sizeBoost = Math.min(1.8, Math.max(1, Math.sqrt(32000 / opts.count)));
    this.material = new ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 1 },
        uFromW: { value: [...this.fromW] },
        uToW: { value: [...this.toW] },
        uMouse: { value: this.mouse },
        uMouseStrength: { value: 0 },
        uTurb: { value: this.intro.turb },
        uSize: { value: 26 * sizeBoost },
        uPixelRatio: { value: this.dpr },
        uIntensity: { value: 0 },
        uWave: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);
    this.scene.add(this.group);

    // --- Polvo de fondo (profundidad + parallax de scroll) ---
    const dust = buildDust(opts.count >= 20000 ? 1600 : 700);
    this.dustGeometry = new BufferGeometry();
    this.dustGeometry.setAttribute("position", new BufferAttribute(dust.positions, 3));
    this.dustGeometry.setAttribute("aRnd", new BufferAttribute(dust.rnd, 4));
    this.dustMaterial = new ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: this.dpr }, uScroll: { value: 0 }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    const dustPoints = new Points(this.dustGeometry, this.dustMaterial);
    dustPoints.frustumCulled = false;
    this.scene.add(dustPoints);

    this.layout = { ...this.cfg(0), scale: this.cfg(0).scale * 0.6 };
    glInfo.count = glInfo.drawn = opts.count;
    glInfo.dpr = this.dpr;
    this.resize(true);
    // Warm-up: compila los shaders mientras el preloader está visible
    this.renderer.compile(this.scene, this.camera);
  }

  /** Estado adaptado al viewport (desktop vs vertical/móvil) */
  private cfg(i: number): FieldState {
    const base = DESKTOP[i];
    const aspect = window.innerWidth / window.innerHeight;
    if (aspect >= 1.05) {
      const fit = Math.min(1, aspect / 1.6);
      return { ...base, x: base.x * fit, scale: base.scale * (0.85 + 0.15 * fit) };
    }
    const fit = Math.max(0.5, Math.min(0.85, aspect * 1.3));
    const m = MOBILE[i];
    return { ...base, ...m, scale: (m.scale ?? base.scale) * fit, intensity: base.intensity * 0.85 };
  }

  setState(i: number) {
    if (i === this.state) return;
    this.state = i;
    glInfo.state = i;
    const t = this.morph.t;
    // La mezcla visible actual pasa a ser el nuevo "desde" (sin saltos al interrumpir)
    this.fromW = this.fromW.map((w, k) => w * (1 - t) + this.toW[k] * t);
    this.toW = this.toW.map((_, k) => (k === i ? 1 : 0));
    this.material.uniforms.uFromW.value = this.fromW;
    this.material.uniforms.uToW.value = this.toW;
    this.morph.t = 0;
    const dur = this.opts.reducedMotion ? 0.01 : 2.4;
    gsap.to(this.morph, { t: 1, duration: dur, ease: "power2.inOut", overwrite: true });
    const target = this.cfg(i);
    gsap.to(this.layout, { ...target, duration: dur * 0.9, ease: "power3.inOut", overwrite: true });
    if (target.spin === 0) {
      const full = Math.PI * 2;
      gsap.to(this.rot, { y: Math.round(this.rot.y / full) * full, duration: dur, ease: "power3.inOut", overwrite: true });
    }
  }

  /** Ensamblado inicial: de nube caótica a esfera */
  playIntro() {
    const d = this.opts.reducedMotion ? 0.01 : 2.8;
    gsap.to(this.intro, { turb: 0, fade: 1, duration: d, ease: "power3.out" });
    gsap.to(this.layout, { scale: this.cfg(this.state).scale, duration: d, ease: "expo.out" });
  }

  setEco(eco: boolean) {
    this.eco = eco;
    // En dispositivos que ya parten de pocas partículas, el modo eco recorta menos
    const drawn = eco ? Math.floor(this.opts.count * (this.opts.count > 10000 ? 0.4 : 0.75)) : this.opts.count;
    this.geometry.setDrawRange(0, drawn);
    glInfo.drawn = drawn;
    this.dpr = eco ? 1 : Math.min(window.devicePixelRatio || 1, this.opts.maxDpr);
    this.renderer.setPixelRatio(this.dpr);
    glInfo.dpr = this.dpr;
    this.resize(true);
  }

  /** Toque / clic: onda expansiva en las partículas */
  tap(x: number, y: number) {
    this.project((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.mouse.x = this.ray.x;
    this.mouse.y = this.ray.y;
    this.tapBoost = this.opts.touch ? 1.4 : 0.7;
  }

  /** NDC → punto en el plano z = layout.z (resultado en this.ray) */
  private project(nx: number, ny: number) {
    const cam = this.camera.position;
    this.ray.set(nx, ny, 0.5).unproject(this.camera).sub(cam).normalize();
    const dist = (this.layout.z - cam.z) / this.ray.z;
    this.ray.set(cam.x + this.ray.x * dist, cam.y + this.ray.y * dist, this.layout.z);
  }

  resize(force = false) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = w / h < 1 ? 8.4 : 7;
    this.camera.updateProjectionMatrix();
    this.material.uniforms.uPixelRatio.value = this.dpr;
    this.dustMaterial.uniforms.uPixelRatio.value = this.dpr;
    // En móvil la altura cambia con la barra de URL: solo recolocamos si cambia el ancho
    if (force || Math.abs(w - this.lastWidth) > 40) {
      this.lastWidth = w;
      const c = this.cfg(this.state);
      this.layout.x = c.x;
      this.layout.y = c.y;
      this.layout.z = c.z;
      this.layout.tilt = c.tilt;
    }
  }

  render(time: number, dt: number) {
    // Pausa total cuando el vídeo cubre la pantalla (0 coste de GPU)
    if (this.covered) return;
    this.elapsed += dt;
    const u = this.material.uniforms;

    // Ratón → mundo, con inercia
    if (pointer.moved) {
      this.project(pointer.nx, pointer.ny);
      this.mouse.x += (this.ray.x - this.mouse.x) * 0.25;
      this.mouse.y += (this.ray.y - this.mouse.y) * 0.25;
    }
    const recent = performance.now() - pointer.lastMove < 2500 && pointer.inside;
    const base = this.opts.touch ? 0 : recent ? 0.35 : 0;
    const target = Math.min(1.35, base + Math.min(pointer.speed / 35, 1) * 0.9 + this.tapBoost);
    this.strength += (target - this.strength) * 0.08;
    this.tapBoost *= 0.93;
    u.uMouseStrength.value = this.strength;

    // Turbulencia por velocidad de scroll
    const turbTarget = Math.min(Math.abs(scrollState.smooth) / 55, 1) * 0.75;
    this.turb += (turbTarget - this.turb) * 0.08;
    u.uTurb.value = this.turb + this.intro.turb;

    // Cámara con parallax suave
    const cam = this.camera.position;
    cam.x += (pointer.nx * 0.35 - cam.x) * 0.035;
    cam.y += (pointer.ny * 0.22 - cam.y) * 0.035;
    this.camera.lookAt(0, 0, 0);

    this.rot.y += this.layout.spin * dt * (1 + Math.min(Math.abs(scrollState.smooth) * 0.03, 2));
    this.points.rotation.y = this.rot.y;
    this.group.position.set(this.layout.x, this.layout.y, this.layout.z);
    this.group.scale.setScalar(this.layout.scale);
    this.group.rotation.x = this.layout.tilt;

    u.uTime.value = time;
    u.uProgress.value = this.morph.t;
    u.uWave.value = this.layout.wave;
    u.uIntensity.value = this.layout.intensity * this.intro.fade * (this.eco ? 0.9 : 1);

    const du = this.dustMaterial.uniforms;
    du.uTime.value = time;
    du.uScroll.value = scrollState.y * 0.0022;
    du.uOpacity.value = this.intro.fade;

    this.renderer.render(this.scene, this.camera);
    this.adapt(dt);
  }

  /** Calidad adaptativa: si el FPS cae, baja DPR y luego densidad (LOD) */
  private adapt(dt: number) {
    if (this.elapsed < 4 || dt <= 0) return;
    this.fpsSmooth += (1 / dt - this.fpsSmooth) * 0.05;
    if (this.fpsSmooth < 45) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 2);
    if (this.slowFrames < 150) return;
    this.slowFrames = 0;
    if (this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    } else {
      const drawn = Math.max(Math.floor(this.opts.count * 0.3), Math.floor(glInfo.drawn * 0.75));
      this.geometry.setDrawRange(0, drawn);
      glInfo.drawn = drawn;
    }
    glInfo.dpr = this.dpr;
  }

  dispose() {
    gsap.killTweensOf([this.morph, this.layout, this.intro, this.rot]);
    this.geometry.dispose();
    this.material.dispose();
    this.dustGeometry.dispose();
    this.dustMaterial.dispose();
    this.renderer.dispose();
  }
}
