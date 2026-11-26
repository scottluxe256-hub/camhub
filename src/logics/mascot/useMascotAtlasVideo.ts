import { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RIG_CONFIG } from './mascot.config';
import { prepTex } from './mascot.shaders';

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback: (cb: () => void) => number;
};

interface UseMascotAtlasVideoParams {
  atlasVideoUrl?: string;
  active: boolean;
  onTextureReady: (tex: THREE.VideoTexture) => void;
  onFramePainted: () => void;
}

export function useMascotAtlasVideo({
  atlasVideoUrl,
  active,
  onTextureReady,
  onFramePainted,
}: UseMascotAtlasVideoParams) {
  const atlasVidRef = useRef<HTMLVideoElement | null>(null);

  const onTextureReadyRef = useRef(onTextureReady);
  onTextureReadyRef.current = onTextureReady;

  const onFramePaintedRef = useRef(onFramePainted);
  onFramePaintedRef.current = onFramePainted;

  const signalFramePainted = useMemo(() => {
    return (vid: HTMLVideoElement) => {
      const done = () => {
        requestAnimationFrame(() => {
          onFramePaintedRef.current();
        });
      };
      if ('requestVideoFrameCallback' in vid) {
        (vid as VideoWithFrameCallback).requestVideoFrameCallback(done);
      } else {
        requestAnimationFrame(done);
      }
    };
  }, []);

  useEffect(() => {
    const vid = document.createElement('video');
    vid.src = atlasVideoUrl ?? '/mascot/mascot-atlas.mp4';
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
      onTextureReadyRef.current(vTex);
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
  }, [atlasVideoUrl, signalFramePainted]);

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

  const syncVideoLoop = useCallback(() => {
    const vid = atlasVidRef.current;
    if (vid && vid.readyState >= 2) {
      if (vid.paused) {
        vid.play().catch(() => {});
      }
      if (!vid.seeking && vid.duration > 0 && vid.duration - vid.currentTime <= 0.025) {
        vid.currentTime = 0.001;
      }
    }
  }, []);

  return { syncVideoLoop };
}
