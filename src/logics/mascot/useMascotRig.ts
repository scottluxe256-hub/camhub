import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { DEG2RAD, type IshaqMascotProps, RIG_CONFIG } from './mascot.config';
import {
  BODY_FRAGMENT_SHADER,
  BODY_VERTEX_SHADER,
  EYES_ATLAS_SHADER,
  HAIR_ATLAS_SHADER,
  STRING_WAVE_SHADER,
  VERTEX_SHADER,
  hexToRgb,
  prepTex,
} from './mascot.shaders';
import { useMascotAtlasVideo } from './useMascotAtlasVideo';

export function useMascotRig({
  active = true,
  onReady,
  ...urls
}: Omit<IshaqMascotProps, 'className'>) {
  const videoTexRef = useRef<THREE.VideoTexture | null>(null);
  const accumRef = useRef({ stringLeftP: 0, stringRightP: 0, fractalX: 0, fractalY: 0 });

  const textures = useTexture({
    body: urls.body ?? '/mascot/body.webp',
    hands: urls.hands ?? '/mascot/hands.webp',
    stringLeft: urls.stringLeft ?? '/mascot/string-left.webp',
    stringRight: urls.stringRight ?? '/mascot/string-right.webp',
  });

  const { body, hands, stringLeft, stringRight } = textures;

  const mats = useMemo(() => {
    prepTex(body);
    prepTex(hands);
    prepTex(stringLeft);
    prepTex(stringRight);

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
          uHasVideo: { value: 0.0 },
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
          uHasVideo: { value: 0.0 },
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
          uMap: { value: body },
          uPosOffset: { value: new THREE.Vector2(0, 0) },
          uParallax: {
            value: new THREE.Vector2(RIG_CONFIG.bodyFractal.parallaxX, RIG_CONFIG.bodyFractal.parallaxY),
          },
          uMagnitude: { value: RIG_CONFIG.bodyFractal.magnitude },
          uDetail: { value: RIG_CONFIG.bodyFractal.detail },
          uLacunarity: { value: RIG_CONFIG.bodyFractal.lacunarity },
          uOctaves: { value: Math.round(RIG_CONFIG.bodyFractal.octaves) },
          uShoePinEnd: { value: RIG_CONFIG.bodyFractal.shoePinEnd },
          uCollarPinStart: { value: RIG_CONFIG.bodyFractal.collarPinStart },
          uWristLeft: {
            value: new THREE.Vector2(RIG_CONFIG.bodyFractal.wristLeftX, RIG_CONFIG.bodyFractal.wristLeftY),
          },
          uWristRight: {
            value: new THREE.Vector2(RIG_CONFIG.bodyFractal.wristRightX, RIG_CONFIG.bodyFractal.wristRightY),
          },
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
          uMap: { value: stringLeft },
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
          uMap: { value: stringRight },
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
  }, [body, hands, stringLeft, stringRight]);

  const applyVideoTexture = useCallback(
    (vTex: THREE.VideoTexture) => {
      mats.hairFrontMat.uniforms.uMap.value = vTex;
      mats.hairBackMat.uniforms.uMap.value = vTex;
      mats.eyesMat.uniforms.uMap.value = vTex;

      mats.hairFrontMat.uniforms.uHasVideo.value = 1.0;
      mats.hairBackMat.uniforms.uHasVideo.value = 1.0;
      mats.eyesMat.uniforms.uHasVideo.value = 1.0;
    },
    [mats]
  );

  useEffect(() => {
    if (videoTexRef.current) {
      applyVideoTexture(videoTexRef.current);
    }
  }, [applyVideoTexture]);

  const handleTextureReady = useCallback(
    (vTex: THREE.VideoTexture) => {
      videoTexRef.current = vTex;
      applyVideoTexture(vTex);
    },
    [applyVideoTexture]
  );

  const { syncVideoLoop } = useMascotAtlasVideo({
    atlasVideoUrl: urls.atlasVideo,
    active,
    onTextureReady: handleTextureReady,
    onFramePainted: () => onReady?.(),
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    syncVideoLoop();

    const a = accumRef.current;
    a.stringLeftP += dt * RIG_CONFIG.stringLeft.wave.speed * 3.2;
    a.stringRightP += dt * RIG_CONFIG.stringRight.wave.speed * 3.2;
    a.fractalX += dt * RIG_CONFIG.bodyFractal.speedX;
    a.fractalY += dt * RIG_CONFIG.bodyFractal.speedY;

    mats.stringLeftMat.uniforms.uPhase.value = a.stringLeftP;
    mats.stringRightMat.uniforms.uPhase.value = a.stringRightP;
    mats.bodyMat.uniforms.uPosOffset.value.set(a.fractalX, a.fractalY);
  });

  return {
    textures,
    mats,
    transforms: RIG_CONFIG.transforms,
  };
}
