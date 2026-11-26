// @ts-nocheck
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';

export const RIG_CONFIG = {
  transforms: {
    hairBack: { x: 0, y: 0, scale: 1, visible: true },
    body: { x: 0, y: 0, scale: 1, visible: true },
    hands: { x: 0, y: 0, scale: 1, visible: true },
    stringLeft: { x: 0, y: 0, scale: 1, visible: true },
    stringRight: { x: -0.01, y: 0, scale: 1, visible: true },
    eyesVideo: { x: 0, y: 0, scale: 1, visible: true },
    hairFront: { x: 0, y: 0, scale: 1, visible: true },
  },
  atlasVideo: {
    playbackRate: 1.0,
  },
  hairVideo: {
    chromaKey: true,
    chromaColor: '#ffffff',
    keyLow: 0.72,
    keyHigh: 0.95,
    // Lebih tipis & rapat ke garis rambut, dengan opacity lebih tegas
    shadowOffset: [-0.0016, 0.0020] as [number, number],
    shadowOpacity: 0.70,
  },
  stringLeft: {
    wave: { speed: 0.85, angle: 90, spacing: 5.05, magnitude: 4.44, warpAngle: 0 },
    dampingMag: 100,
    dampingSpacing: 100,
    anchorTop: 0.82,
    screenSpace: false,
  },
  stringRight: {
    wave: { speed: 1, angle: 90, spacing: 5.11, magnitude: 4.44, warpAngle: 0 },
    dampingMag: 100,
    dampingSpacing: 100,
    anchorTop: 0.82,
    screenSpace: false,
  },
  bodyFractal: {
    speedX: -1.62,
    speedY: -0.47,
    parallaxX: 0,
    parallaxY: 0,
    magnitude: 0.2,
    detail: 0.81,
    lacunarity: 0.5,
    octaves: 5,
    shoePinEnd: 0.21,
    collarPinStart: 0.82,
    wristLeftX: 0.38,
    wristLeftY: 0.51,
    wristRightX: 0.62,
    wristRightY: 0.51,
    wristPinRadius: 0.05,
    wristPinStrength: 0.95,
  },
  eyeVideo: {
    chromaKey: true,
    chromaColor: '#ffbe50',
    chromaTolerance: 0.44,
  },
} as const;

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BODY_VERTEX_SHADER = /* glsl */ `
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

const BODY_FRAGMENT_SHADER = /* glsl */ `
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

// Shader rambut bersih tanpa pinggiran putih + bayangan kontak tipis 0-lag
const HAIR_ATLAS_SHADER = /* glsl */ `
  uniform sampler2D uMap;
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

    // Hilangkan sisa halo putih pada 1px tepi anti-aliasing rambut
    vec3 hairEdgeTone = vec3(0.22, 0.20, 0.20);
    vec3 decontam = clamp((c.rgb - (1.0 - alpha) * uChromaColor) / max(alpha, 0.25), 0.0, 1.0);
    vec3 cleanRgb = mix(hairEdgeTone, decontam, smoothstep(0.15, 0.95, alpha));
    return vec4(cleanRgb, alpha);
  }

  void main() {
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

const EYES_ATLAS_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uPanelOffset;
  uniform float uChromaKey;
  uniform vec3 uChromaColor;
  uniform float uChromaTolerance;

  varying vec2 vUv;

  void main() {
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

const STRING_WAVE_SHADER = /* glsl */ `
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

const DEG2RAD = Math.PI / 180;
const PLANE_W = 1.8;
const PLANE_H = 3.2;

export interface IshaqMascotProps {
  className?: string;
  active?: boolean;
  onReady?: () => void;
  atlasVideo?: string;
  body?: string;
  hands?: string;
  stringLeft?: string;
  stringRight?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1];
}

function prepTex(tex: THREE.Texture) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
}

function CharacterRigMesh({ active = true, onReady, ...urls }: IshaqMascotProps) {
  const textures = useTexture({
    body: urls.body ?? '/mascot/body.webp',
    hands: urls.hands ?? '/mascot/hands.webp',
    stringLeft: urls.stringLeft ?? '/mascot/string-left.webp',
    stringRight: urls.stringRight ?? '/mascot/string-right.webp',
  });

  const mats = useMemo(() => {
    prepTex(textures.body);
    prepTex(textures.hands);
    prepTex(textures.stringLeft);
    prepTex(textures.stringRight);

    const hv = RIG_CONFIG.hairVideo;
    const hRgb = hexToRgb(hv.chromaColor);
    const ev = RIG_CONFIG.eyeVideo;
    const eRgb = hexToRgb(ev.chromaColor);

    const makeHairMat = (panelOffset: number, enableShadow: boolean) =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: HAIR_ATLAS_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: null },
          uPanelOffset: { value: panelOffset },
          uChromaColor: { value: new THREE.Vector3(hRgb[0], hRgb[1], hRgb[2]) },
          uKeyLow: { value: hv.keyLow },
          uKeyHigh: { value: hv.keyHigh },
          uEnableShadow: { value: enableShadow ? 1.0 : 0.0 },
          uShadowOffset: { value: new THREE.Vector2(hv.shadowOffset[0], hv.shadowOffset[1]) },
          uShadowOpacity: { value: hv.shadowOpacity },
        },
      });

    return {
      hairFrontMat: makeHairMat(0.0, true),
      hairBackMat: makeHairMat(1.0 / 3.0, false),
      eyesMat: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: EYES_ATLAS_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: null },
          uPanelOffset: { value: 2.0 / 3.0 },
          uChromaKey: { value: ev.chromaKey ? 1.0 : 0.0 },
          uChromaColor: { value: new THREE.Vector3(eRgb[0], eRgb[1], eRgb[2]) },
          uChromaTolerance: { value: ev.chromaTolerance },
        },
      }),
      bodyMat: new THREE.ShaderMaterial({
        vertexShader: BODY_VERTEX_SHADER,
        fragmentShader: BODY_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: textures.body },
          uPosOffset: { value: new THREE.Vector2(0, 0) },
          uParallax: { value: new THREE.Vector2(RIG_CONFIG.bodyFractal.parallaxX, RIG_CONFIG.bodyFractal.parallaxY) },
          uMagnitude: { value: RIG_CONFIG.bodyFractal.magnitude },
          uDetail: { value: RIG_CONFIG.bodyFractal.detail },
          uLacunarity: { value: RIG_CONFIG.bodyFractal.lacunarity },
          uOctaves: { value: Math.round(RIG_CONFIG.bodyFractal.octaves) },
          uShoePinEnd: { value: RIG_CONFIG.bodyFractal.shoePinEnd },
          uCollarPinStart: { value: RIG_CONFIG.bodyFractal.collarPinStart },
          uWristLeft: { value: new THREE.Vector2(RIG_CONFIG.bodyFractal.wristLeftX, RIG_CONFIG.bodyFractal.wristLeftY) },
          uWristRight: { value: new THREE.Vector2(RIG_CONFIG.bodyFractal.wristRightX, RIG_CONFIG.bodyFractal.wristRightY) },
          uWristRadius: { value: RIG_CONFIG.bodyFractal.wristPinRadius },
          uWristStrength: { value: RIG_CONFIG.bodyFractal.wristPinStrength },
        },
      }),
      stringLeftMat: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: STRING_WAVE_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: textures.stringLeft },
          uPhase: { value: 0 },
          uAngle: { value: RIG_CONFIG.stringLeft.wave.angle * DEG2RAD },
          uSpacing: { value: RIG_CONFIG.stringLeft.wave.spacing },
          uMag: { value: RIG_CONFIG.stringLeft.wave.magnitude },
          uWarpAngle: { value: RIG_CONFIG.stringLeft.wave.warpAngle * DEG2RAD },
          uDampingMag: { value: RIG_CONFIG.stringLeft.dampingMag / 100 },
          uDampingSpacing: { value: Math.max(0.01, RIG_CONFIG.stringLeft.dampingSpacing / 100) },
          uAnchorTop: { value: RIG_CONFIG.stringLeft.anchorTop },
          uScreenSpace: { value: RIG_CONFIG.stringLeft.screenSpace ? 1.0 : 0.0 },
        },
      }),
      stringRightMat: new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: STRING_WAVE_SHADER,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uMap: { value: textures.stringRight },
          uPhase: { value: 0 },
          uAngle: { value: RIG_CONFIG.stringRight.wave.angle * DEG2RAD },
          uSpacing: { value: RIG_CONFIG.stringRight.wave.spacing },
          uMag: { value: RIG_CONFIG.stringRight.wave.magnitude },
          uWarpAngle: { value: RIG_CONFIG.stringRight.wave.warpAngle * DEG2RAD },
          uDampingMag: { value: RIG_CONFIG.stringRight.dampingMag / 100 },
          uDampingSpacing: { value: Math.max(0.01, RIG_CONFIG.stringRight.dampingSpacing / 100) },
          uAnchorTop: { value: RIG_CONFIG.stringRight.anchorTop },
          uScreenSpace: { value: RIG_CONFIG.stringRight.screenSpace ? 1.0 : 0.0 },
        },
      }),
    };
  }, [textures]);

  const atlasVidRef = useRef<HTMLVideoElement | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const signalFramePainted = useMemo(() => {
    return (vid: HTMLVideoElement) => {
      const done = () => {
        requestAnimationFrame(() => {
          onReadyRef.current?.();
        });
      };
      if ('requestVideoFrameCallback' in vid) {
        (
          vid as HTMLVideoElement & {
            requestVideoFrameCallback: (cb: () => void) => number;
          }
        ).requestVideoFrameCallback(done);
      } else {
        requestAnimationFrame(done);
      }
    };
  }, []);

  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = urls.atlasVideo ?? '/mascot/mascot-atlas.mp4';
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.crossOrigin = 'anonymous';
    vid.playbackRate = RIG_CONFIG.atlasVideo.playbackRate;

    let vTex: THREE.VideoTexture | null = null;
    vid.onloadeddata = () => {
      vTex = new THREE.VideoTexture(vid);
      prepTex(vTex);
      mats.hairFrontMat.uniforms.uMap.value = vTex;
      mats.hairBackMat.uniforms.uMap.value = vTex;
      mats.eyesMat.uniforms.uMap.value = vTex;
      vid
        .play()
        .then(() => signalFramePainted(vid))
        .catch(() => {});
    };

    atlasVidRef.current = vid;
    return () => {
      vid.pause();
      vid.src = '';
      vTex?.dispose();
    };
  }, [urls.atlasVideo, mats, signalFramePainted]);

  useEffect(() => {
    const vid = atlasVidRef.current;
    if (!vid) return;
    if (!active) {
      vid.pause();
    } else if (vid.readyState >= 2) {
      vid
        .play()
        .then(() => signalFramePainted(vid))
        .catch(() => {});
    }
  }, [active, signalFramePainted]);

  const accumRef = useRef({ stringLeftP: 0, stringRightP: 0, fractalX: 0, fractalY: 0 });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const vid = atlasVidRef.current;
    if (vid && vid.readyState >= 2) {
      if (vid.paused) {
        vid.play().catch(() => {});
      }
      if (!vid.seeking && vid.duration > 0 && vid.duration - vid.currentTime <= 0.025) {
        vid.currentTime = 0.001;
      }
    }

    const a = accumRef.current;
    a.stringLeftP += dt * RIG_CONFIG.stringLeft.wave.speed * 3.2;
    a.stringRightP += dt * RIG_CONFIG.stringRight.wave.speed * 3.2;
    a.fractalX += dt * RIG_CONFIG.bodyFractal.speedX;
    a.fractalY += dt * RIG_CONFIG.bodyFractal.speedY;

    mats.stringLeftMat.uniforms.uPhase.value = a.stringLeftP;
    mats.stringRightMat.uniforms.uPhase.value = a.stringRightP;
    mats.bodyMat.uniforms.uPosOffset.value.set(a.fractalX, a.fractalY);
  });

  const tr = RIG_CONFIG.transforms;
  return (
    <>
      <mesh frustumCulled={false} renderOrder={0} position={[tr.hairBack.x, tr.hairBack.y, -0.02]} scale={[tr.hairBack.scale, tr.hairBack.scale, 1]} material={mats.hairBackMat}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={1} position={[tr.body.x, tr.body.y, 0]} scale={[tr.body.scale, tr.body.scale, 1]} material={mats.bodyMat}>
        <planeGeometry args={[PLANE_W, PLANE_H, 28, 50]} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={2} position={[tr.hands.x, tr.hands.y, 0.005]} scale={[tr.hands.scale, tr.hands.scale, 1]}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <meshBasicMaterial map={textures.hands} transparent depthWrite={false} depthTest={false} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={3} position={[tr.stringLeft.x, tr.stringLeft.y, 0.01]} scale={[tr.stringLeft.scale, tr.stringLeft.scale, 1]} material={mats.stringLeftMat}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={4} position={[tr.stringRight.x, tr.stringRight.y, 0.012]} scale={[tr.stringRight.scale, tr.stringRight.scale, 1]} material={mats.stringRightMat}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={5} position={[tr.eyesVideo.x, tr.eyesVideo.y, 0.016]} scale={[tr.eyesVideo.scale, tr.eyesVideo.scale, 1]} material={mats.eyesMat}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh frustumCulled={false} renderOrder={6} position={[tr.hairFront.x, tr.hairFront.y, 0.025]} scale={[tr.hairFront.scale, tr.hairFront.scale, 1]} material={mats.hairFrontMat}>
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
    </>
  );
}

export default function IshaqMascot({ className = '', ...urls }: IshaqMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);

  const [targetDpr, setTargetDpr] = useState(() => {
    if (typeof window === 'undefined') return 3.5;
    const isWide = window.innerWidth >= 768;
    // Portrait dikembalikan ke 3.5 agar tajam, Landscape dibatasi 1.5 agar 60fps mulus
    return isWide ? 1.5 : 3.5;
  });

  useEffect(() => {
    const updateDpr = () => {
      const isWide = window.innerWidth >= 768;
      setTargetDpr(isWide ? 2.0 : 3.5);
    };
    window.addEventListener('resize', updateDpr);
    return () => window.removeEventListener('resize', updateDpr);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInView(visible);
        if (!visible) setCanvasReady(false);
      },
      {
        // Bangunkan kanvas & video 900px (~1 layar penuh) SEBELUM masuk layar saat fast scroll
        rootMargin: '900px 0px',
        threshold: 0,
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none select-none transition-opacity duration-150 ${
        canvasReady ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <Canvas
        dpr={targetDpr}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 0, 4.17], fov: 42 }}
        gl={{
          alpha: true,
          antialias: false,
          // Simpan frame terakhir di buffer agar tidak berkedip hitam saat bangun dari pause
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        <Suspense fallback={null}>
          <CharacterRigMesh
            active={inView}
            onReady={() => setCanvasReady(true)}
            {...urls}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
