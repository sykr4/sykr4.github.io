/**
 * Formas abstractas que cuentan la historia de SYKR4 (del caos al control):
 *  0 · Nube      → cloud computing (hero)
 *  1 · Red       → malla de datos / conectividad (manifiesto)
 *  2 · Infra     → pila de servidores (servicios)
 *  3 · IA        → nudo toroidal: bucles de automatización (casos)
 *  4 · Órbita    → galaxia: optimización y eficiencia (resultados/nosotros)
 *  5 · Portal    → anillo que enmarca la llamada a la acción (contacto)
 *
 * Cada forma se genera UNA vez en CPU y vive como atributo en la GPU.
 * Todas en orden aleatorio → setDrawRange() reduce densidad de forma uniforme (LOD).
 */
type Rng = () => number;

export function mulberry32(seed: number): Rng {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr: Float32Array, rng: Rng) {
  const n = arr.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    for (let k = 0; k < 3; k++) {
      const tmp = arr[i * 3 + k];
      arr[i * 3 + k] = arr[j * 3 + k];
      arr[j * 3 + k] = tmp;
    }
  }
  return arr;
}

function gauss(rng: Rng) {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function sphere(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const shell = Math.floor(n * 0.8);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const R = 1.55;
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number;
    if (i < shell) {
      const yy = 1 - (i / (shell - 1)) * 2;
      const r = Math.sqrt(1 - yy * yy);
      const th = golden * i;
      const j = 1 + (rng() - 0.5) * 0.05;
      x = Math.cos(th) * r * R * j;
      y = yy * R * j;
      z = Math.sin(th) * r * R * j;
    } else {
      const r = R * Math.cbrt(rng()) * 0.85;
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      x = Math.cos(th) * s * r;
      y = u * r;
      z = Math.sin(th) * s * r;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return shuffle(out, rng);
}

function grid(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const W = 10;
  const D = 6;
  const cols = Math.ceil(Math.sqrt(n * (W / D)));
  const rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = (c / (cols - 1) - 0.5) * W;
    const z = (r / Math.max(rows - 1, 1) - 0.5) * D;
    const y = Math.sin(x * 0.9) * Math.cos(z * 1.2) * 0.25 + Math.sin((x + z) * 1.8) * 0.08 + (rng() - 0.5) * 0.02;
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return shuffle(out, rng);
}

function serverStack(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const slabs = 6;
  const w = 3.0;
  const h = 0.26;
  const d = 1.7;
  const gap = 0.17;
  const total = slabs * h + (slabs - 1) * gap;
  for (let i = 0; i < n; i++) {
    const r = rng();
    let x = 0;
    let y = 0;
    let z = 0;
    if (r < 0.06) {
      // Postes del rack
      x = (rng() < 0.5 ? -0.5 : 0.5) * w * 1.05;
      z = (rng() < 0.5 ? -0.5 : 0.5) * d * 1.05;
      y = (rng() - 0.5) * total * 1.1;
    } else {
      const k = i % slabs;
      const cy = -total / 2 + h / 2 + k * (h + gap);
      if (r < 0.52) {
        // Aristas de cada bandeja
        const e = Math.floor(rng() * 12);
        const t = rng() - 0.5;
        const sa = e & 1 ? 0.5 : -0.5;
        const sb = e & 2 ? 0.5 : -0.5;
        if (e < 4) {
          x = t * w;
          y = sa * h;
          z = sb * d;
        } else if (e < 8) {
          x = sa * w;
          y = t * h;
          z = sb * d;
        } else {
          x = sa * w;
          y = sb * h;
          z = t * d;
        }
      } else if (r < 0.9) {
        // Caras (frontal y superior más densas)
        const f = rng();
        if (f < 0.45) {
          x = (rng() - 0.5) * w;
          y = (rng() - 0.5) * h;
          z = d / 2;
        } else if (f < 0.8) {
          x = (rng() - 0.5) * w;
          y = h / 2;
          z = (rng() - 0.5) * d;
        } else {
          x = (rng() < 0.5 ? -0.5 : 0.5) * w;
          y = (rng() - 0.5) * h;
          z = (rng() - 0.5) * d;
        }
      } else {
        // LEDs frontales
        const led = Math.floor(rng() * 5);
        x = w / 2 - 0.25 - led * 0.12 + (rng() - 0.5) * 0.02;
        y = (rng() - 0.5) * 0.05;
        z = d / 2 + 0.01;
      }
      y += cy;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

function torusKnot(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const p = 2;
  const q = 3;
  const R = 1.25;
  const tube = 0.3;
  const pos = (u: number): [number, number, number] => {
    const cu = Math.cos(u);
    const su = Math.sin(u);
    const qp = (q / p) * u;
    const cs = Math.cos(qp);
    return [R * (2 + cs) * 0.5 * cu, R * (2 + cs) * su * 0.5, R * Math.sin(qp) * 0.5];
  };
  for (let i = 0; i < n; i++) {
    const u = rng() * p * Math.PI * 2;
    const a = pos(u);
    const b = pos(u + 0.01);
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    let tz = b[2] - a[2];
    let l = Math.hypot(tx, ty, tz) || 1;
    tx /= l;
    ty /= l;
    tz /= l;
    let nx = a[0] + b[0];
    let ny = a[1] + b[1];
    let nz = a[2] + b[2];
    let bx = ty * nz - tz * ny;
    let by = tz * nx - tx * nz;
    let bz = tx * ny - ty * nx;
    l = Math.hypot(bx, by, bz) || 1;
    bx /= l;
    by /= l;
    bz /= l;
    nx = by * tz - bz * ty;
    ny = bz * tx - bx * tz;
    nz = bx * ty - by * tx;
    const ang = rng() * Math.PI * 2;
    const rr = tube * (rng() < 0.72 ? 0.92 + rng() * 0.16 : Math.sqrt(rng()) * 0.9);
    const c = Math.cos(ang) * rr;
    const s = Math.sin(ang) * rr;
    out[i * 3] = a[0] + c * nx + s * bx;
    out[i * 3 + 1] = a[1] + c * ny + s * by;
    out[i * 3 + 2] = a[2] + c * nz + s * bz;
  }
  return out;
}

function galaxy(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const arms = 3;
  const radius = 3.0;
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number;
    if (rng() < 0.12) {
      x = gauss(rng) * 0.28;
      y = gauss(rng) * 0.16;
      z = gauss(rng) * 0.28;
    } else {
      const r = Math.pow(rng(), 0.75) * radius + 0.15;
      const branch = ((i % arms) / arms) * Math.PI * 2;
      const spin = r * 1.25;
      const spread = 0.12 * r + 0.05;
      const sgn = () => (rng() < 0.5 ? 1 : -1);
      const rx = Math.pow(rng(), 2.2) * sgn() * spread * 2.2;
      const ry = Math.pow(rng(), 2.2) * sgn() * spread * 0.5;
      const rz = Math.pow(rng(), 2.2) * sgn() * spread * 2.2;
      x = Math.cos(branch + spin) * r + rx;
      y = ry;
      z = Math.sin(branch + spin) * r + rz;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

function portal(n: number, rng: Rng) {
  const out = new Float32Array(n * 3);
  const R = 2.35;
  for (let i = 0; i < n; i++) {
    let x: number, y: number, z: number;
    if (rng() < 0.93) {
      const a = rng() * Math.PI * 2;
      const b = rng() * Math.PI * 2;
      const tr = 0.04 + Math.pow(rng(), 3) * 0.42;
      x = (R + tr * Math.cos(b)) * Math.cos(a);
      y = (R + tr * Math.cos(b)) * Math.sin(a);
      z = tr * Math.sin(b);
    } else {
      const a = rng() * Math.PI * 2;
      const r = R * (0.35 + rng() * 0.55);
      x = Math.cos(a) * r;
      y = Math.sin(a) * r;
      z = -0.5 - rng();
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

export function buildShapes(n: number) {
  const rng = mulberry32(0x5ca1ab1e);
  const shapes = [sphere(n, rng), grid(n, rng), serverStack(n, rng), torusKnot(n, rng), galaxy(n, rng), portal(n, rng)];
  const rnd = new Float32Array(n * 4);
  for (let i = 0; i < rnd.length; i++) rnd[i] = rng();
  return { shapes, rnd };
}

export function buildDust(n: number) {
  const rng = mulberry32(0xd057);
  const positions = new Float32Array(n * 3);
  const rnd = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    positions[i * 3] = (rng() - 0.5) * 18;
    positions[i * 3 + 1] = (rng() - 0.5) * 12;
    positions[i * 3 + 2] = -8 + rng() * 9;
    for (let k = 0; k < 4; k++) rnd[i * 4 + k] = rng();
  }
  return { positions, rnd };
}
