/* ------------------------------------------------------------------
   Shaders GLSL del campo de partículas SYKR4
   - 6 formas pre-calculadas (atributos) → morph en GPU sin tocar la CPU
   - Repulsión del ratón proporcional a su velocidad
   - Turbulencia ligada a la velocidad del scroll
   - "Bloom falso": sprites con caída suave + blending aditivo
     (sin post-procesado → 1 draw call para todo el campo)
------------------------------------------------------------------- */

// Simplex noise 3D (Ashima Arts / Ian McEwan, MIT)
const noise3D = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uFromW[6];
uniform float uToW[6];
uniform vec3 uMouse;
uniform float uMouseStrength;
uniform float uTurb;
uniform float uSize;
uniform float uPixelRatio;
uniform float uIntensity;
uniform float uWave;

attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute vec3 aS5;
attribute vec4 aRnd;

varying vec3 vColor;
varying float vAlpha;

${noise3D}

void main() {
  // Mezcla ponderada: "desde" y "hacia" pueden ser cualquier combinación de formas
  vec3 pFrom = position * uFromW[0] + aS1 * uFromW[1] + aS2 * uFromW[2] + aS3 * uFromW[3] + aS4 * uFromW[4] + aS5 * uFromW[5];
  vec3 pTo   = position * uToW[0]   + aS1 * uToW[1]   + aS2 * uToW[2]   + aS3 * uToW[3]   + aS4 * uToW[4]   + aS5 * uToW[5];

  // Morph escalonado: cada partícula arranca con un pequeño retraso
  float delay = aRnd.x * 0.35;
  float t = clamp((uProgress - delay) / 0.65, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(pFrom, pTo, t);

  // Arco: a mitad del viaje las partículas se abren hacia fuera
  float arc = sin(t * 3.14159265);
  p += normalize(p + vec3(0.0001)) * arc * (0.25 + aRnd.y * 0.55);

  // Respiración orgánica
  float n = snoise(p * 0.55 + vec3(0.0, 0.0, uTime * 0.12));
  p += normalize(p + vec3(0.0001)) * n * 0.07;

  // Ola (estado "Red")
  p.y += sin(p.x * 1.3 + uTime * 0.9) * cos(p.z * 1.1 + uTime * 0.6) * 0.16 * uWave;

  // Turbulencia: velocidad del scroll + ensamblado inicial
  if (uTurb > 0.001) {
    vec3 q = p * 0.9 + vec3(uTime * 0.25);
    vec3 turb = vec3(snoise(q), snoise(q + vec3(19.1, 3.3, 7.7)), snoise(q + vec3(5.2, 11.4, 2.9)));
    p += turb * uTurb * (0.35 + aRnd.z * 0.65);
  }

  vec4 world = modelMatrix * vec4(p, 1.0);

  // Repulsión del ratón en espacio mundo
  vec2 toP = world.xy - uMouse.xy;
  float d = length(toP);
  float f = smoothstep(1.25, 0.0, d) * uMouseStrength;
  world.xy += normalize(toP + vec2(0.0001)) * f * 0.85;
  world.z += f * 0.7;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.35 + aRnd.y * 1.1) * (1.0 + f * 1.2);
  gl_PointSize = size * uPixelRatio / max(-mv.z, 0.5);

  // Color: cian → violeta + algunos "LEDs" volt que parpadean
  vec3 cyan = vec3(0.36, 0.95, 1.0);
  vec3 violet = vec3(0.55, 0.36, 1.0);
  vec3 volt = vec3(0.84, 1.0, 0.29);
  float g = clamp(0.5 + p.y * 0.22 + n * 0.6, 0.0, 1.0);
  vec3 col = mix(cyan, violet, g);
  float led = step(0.968, aRnd.w);
  float blink = 0.5 + 0.5 * sin(uTime * (1.5 + aRnd.z * 3.5) + aRnd.x * 40.0);
  col = mix(col, volt, led * blink);
  col += vec3(f * 0.55);

  vColor = col;
  vAlpha = uIntensity * (0.3 + aRnd.z * 0.7) * (1.0 + led * blink * 0.8);
}
`;

export const particleFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.8);
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

/* Polvo de fondo con parallax infinito ligado al scroll */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uScroll;
uniform float uOpacity;
attribute vec4 aRnd;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uScroll * (0.4 + aRnd.x * 0.8) + uTime * 0.03 * aRnd.y + 6.0, 12.0) - 6.0;
  p.x += sin(uTime * 0.2 + aRnd.z * 6.2831) * 0.15;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (4.0 + aRnd.w * 10.0) * uPixelRatio / max(-mv.z, 0.5);
  vAlpha = uOpacity * (0.2 + aRnd.w * 0.6) * (0.6 + 0.4 * sin(uTime * (0.5 + aRnd.x) + aRnd.y * 10.0));
}
`;

export const dustFragment = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.0, d), 2.0);
  gl_FragColor = vec4(vec3(0.72, 0.84, 1.0), a * vAlpha);
}
`;
