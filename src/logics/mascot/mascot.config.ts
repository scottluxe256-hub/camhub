// @ts-nocheck
export const DEG2RAD = Math.PI / 180;
export const PLANE_W = 1.8;
export const PLANE_H = 3.2;

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
