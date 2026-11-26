// @ts-nocheck
import * as THREE from 'three';

export const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const BODY_VERTEX_SHADER = /* glsl */ `
  uniform vec2 uPosOffset;
  uniform vec2 uParallax;
  uniform float uMagnitude;
  uniform float uDetail;
  uniform float uLacunarity;
  uniform int uOctaves;
  uniform float uShoePinEnd;
  uniform float uCollarPinStart;
  uniform vec2 uWristLeft;
  uniform vec2 uWristRight;
  uniform float uWristRadius;
  uniform float uWristStrength;

  varying vec2 vUv;

  vec2 gradHash(vec2 p) {
    vec2 q = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    float angle = fract(sin(q.x + q.y) * 43758.5453123) * 6.2831853;
    return vec2(cos(angle), sin(angle));
  }

  float gradNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float n00 = dot(gradHash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float n10 = dot(gradHash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float n01 = dot(gradHash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float n11 = dot(gradHash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
    return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y);
  }

  vec2 fractalFbm(vec2 p) {
    vec2 total = vec2(0.0);
    float amp = 1.0;
    float totalAmp = 0.0;
    float freq = 1.0;
    float lac = max(0.35, uLacunarity * 3.4);
    float gain = clamp(0.35 + uDetail * 0.22, 0.15, 0.85);
    mat2 rot45 = mat2(0.70710678, -0.70710678, 0.70710678, 0.70710678);
    vec2 dirCoord = p;

    for (int i = 0; i < 6; i++) {
      if (i >= uOctaves) break;
      vec2 layerShift = uParallax * float(i) * 0.35;
      vec2 samplePos = dirCoord * freq + layerShift;
      float nx = gradNoise(samplePos + vec2(13.1, 7.7));
      float ny = gradNoise(samplePos + vec2(29.3, 19.5));
      total += vec2(nx, ny) * amp;
      totalAmp += amp;
      dirCoord = rot45 * dirCoord;
      freq *= lac;
      amp *= gain;
    }
    return total / max(0.001, totalAmp);
  }

  void main() {
    float bottomLock = smoothstep(0.03, max(0.04, uShoePinEnd), uv.y);
    float collarStart = max(0.08, uCollarPinStart - 0.055);
    float topLock = 1.0 - smoothstep(collarStart, uCollarPinStart, uv.y);
    float dLeft = distance(uv, uWristLeft);
    float dRight = distance(uv, uWristRight);
    float lockL = smoothstep(uWristRadius * 0.35, max(uWristRadius, 0.015), dLeft);
    float lockR = smoothstep(uWristRadius * 0.35, max(uWristRadius, 0.015), dRight);
    float wristLock = mix(1.0, min(lockL, lockR), uWristStrength);
    float clothMask = bottomLock * topLock * wristLock;

    vec2 baseCoord = uv * vec2(6.5, 10.5) + uPosOffset;
    vec2 fVal = fractalFbm(baseCoord);
    vec2 offset = fVal * (uMagnitude * 0.085) * clothMask;

    vUv = uv + offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const BODY_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;

  void main() {
    if (vUv.x < 0.001 || vUv.x > 0.999 || vUv.y < 0.001 || vUv.y > 0.999) {
      discard;
    }
    vec4 texColor = texture2D(uMap, vUv);
    if (texColor.a < 0.01) discard;

    gl_FragColor = texColor;
    #include <colorspace_fragment>
  }
`;

export const HAIR_ATLAS_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasVideo;
  uniform float uPanelOffset;
  uniform vec3 uChromaColor;
  uniform float uKeyLow;
  uniform float uKeyHigh;
  uniform float uEnableShadow;
  uniform vec2 uShadowOffset;
  uniform float uShadowOpacity;

  varying vec2 vUv;

  vec2 toAtlasUv(vec2 uv) {
    return vec2(
      uPanelOffset + clamp(uv.x, 0.005, 0.995) / 3.0,
      clamp(uv.y, 0.002, 0.998)
    );
  }

  vec4 sampleCleanHair(vec2 uv) {
    vec4 c = texture2D(uMap, toAtlasUv(uv));
    float diff = distance(c.rgb, uChromaColor);
    float alpha = smoothstep(uKeyLow, uKeyHigh, diff);

    vec3 hairEdgeTone = vec3(0.22, 0.20, 0.20);
    vec3 decontam = clamp((c.rgb - (1.0 - alpha) * uChromaColor) / max(alpha, 0.25), 0.0, 1.0);
    vec3 cleanRgb = mix(hairEdgeTone, decontam, smoothstep(0.15, 0.95, alpha));
    return vec4(cleanRgb, alpha);
  }

  void main() {
    if (uHasVideo < 0.5) discard;

    vec4 hair = sampleCleanHair(vUv);

    if (uEnableShadow > 0.5) {
      vec2 shUv = vUv + uShadowOffset;
      float shAlpha = 0.0;
      if (shUv.x > 0.005 && shUv.x < 0.995 && shUv.y > 0.002 && shUv.y < 0.998) {
        vec4 shSample = texture2D(uMap, toAtlasUv(shUv));
        float shDiff = distance(shSample.rgb, uChromaColor);
        shAlpha = smoothstep(uKeyLow - 0.14, uKeyHigh + 0.05, shDiff) * uShadowOpacity;
      }

      float outAlpha = hair.a + shAlpha * (1.0 - hair.a);
      if (outAlpha < 0.01) discard;

      vec3 shadowColor = vec3(0.18, 0.10, 0.06);
      vec3 outRgb = (hair.rgb * hair.a + shadowColor * shAlpha * (1.0 - hair.a)) / max(outAlpha, 0.001);
      gl_FragColor = vec4(outRgb, outAlpha);
    } else {
      if (hair.a < 0.01) discard;
      gl_FragColor = hair;
    }
  }
`;

export const EYES_ATLAS_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uHasVideo;
  uniform float uPanelOffset;
  uniform float uChromaKey;
  uniform vec3 uChromaColor;
  uniform float uChromaTolerance;

  varying vec2 vUv;

  void main() {
    if (uHasVideo < 0.5) discard;

    vec2 atlasUv = vec2(uPanelOffset + clamp(vUv.x, 0.005, 0.995) / 3.0, vUv.y);
    vec4 c = texture2D(uMap, atlasUv);
    if (uChromaKey > 0.5) {
      float diff = distance(c.rgb, uChromaColor);
      float keyAlpha = smoothstep(uChromaTolerance * 0.78, uChromaTolerance + 0.001, diff);
      c.a *= keyAlpha;
    }

    if (c.a < 0.01) discard;
    gl_FragColor = c;
  }
`;

export const STRING_WAVE_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uPhase;
  uniform float uAngle;
  uniform float uSpacing;
  uniform float uMag;
  uniform float uWarpAngle;
  uniform float uDampingMag;
  uniform float uDampingSpacing;
  uniform float uAnchorTop;
  uniform float uScreenSpace;

  varying vec2 vUv;

  void main() {
    float distDown = max(0.0, uAnchorTop - vUv.y);
    float transition = max(0.005, uDampingSpacing * 0.15);
    float rawMask = smoothstep(0.0, transition, distDown);
    float dampingMask = mix(1.0, rawMask, uDampingMag);

    vec2 relCoord = uScreenSpace > 0.5 ? vUv : vec2(vUv.x - 0.5, distDown);
    vec2 propDir = vec2(cos(uAngle), sin(uAngle));
    vec2 warpDir = vec2(cos(uWarpAngle), sin(uWarpAngle));

    float freq = uSpacing * 8.5;
    float val = sin(dot(relCoord, propDir) * freq - uPhase);

    vec2 offset = warpDir * val * (uMag * 0.012) * dampingMask;
    vec2 finalUv = vUv + offset;

    if (finalUv.x < 0.001 || finalUv.x > 0.999 || finalUv.y < 0.001 || finalUv.y > 0.999) {
      discard;
    }

    vec4 texColor = texture2D(uMap, finalUv);
    if (texColor.a < 0.01) discard;

    gl_FragColor = texColor;
    #include <colorspace_fragment>
  }
`;

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1];
}

export function prepTex(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
}
