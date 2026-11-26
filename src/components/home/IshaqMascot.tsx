import { Suspense } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { type IshaqMascotProps, PLANE_H, PLANE_W } from '../../logics/mascot/mascot.config';
import { useMascotRig } from '../../logics/mascot/useMascotRig';
import { useMascotViewport } from '../../logics/mascot/useMascotViewport';

function CharacterRigMesh(props: Omit<IshaqMascotProps, 'className'>) {
  const { textures, mats, transforms: tr } = useMascotRig(props);

  return (
    <>
      <mesh
        frustumCulled={false}
        renderOrder={0}
        position={[tr.hairBack.x, tr.hairBack.y, -0.02]}
        scale={[tr.hairBack.scale, tr.hairBack.scale, 1]}
        material={mats.hairBackMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={1}
        position={[tr.body.x, tr.body.y, 0]}
        scale={[tr.body.scale, tr.body.scale, 1]}
        material={mats.bodyMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H, 28, 50]} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={2}
        position={[tr.hands.x, tr.hands.y, 0.005]}
        scale={[tr.hands.scale, tr.hands.scale, 1]}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
        <meshBasicMaterial map={textures.hands} transparent depthWrite={false} depthTest={false} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={3}
        position={[tr.stringLeft.x, tr.stringLeft.y, 0.01]}
        scale={[tr.stringLeft.scale, tr.stringLeft.scale, 1]}
        material={mats.stringLeftMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={4}
        position={[tr.stringRight.x, tr.stringRight.y, 0.012]}
        scale={[tr.stringRight.scale, tr.stringRight.scale, 1]}
        material={mats.stringRightMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={5}
        position={[tr.eyesVideo.x, tr.eyesVideo.y, 0.016]}
        scale={[tr.eyesVideo.scale, tr.eyesVideo.scale, 1]}
        material={mats.eyesMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
      <mesh
        frustumCulled={false}
        renderOrder={6}
        position={[tr.hairFront.x, tr.hairFront.y, 0.025]}
        scale={[tr.hairFront.scale, tr.hairFront.scale, 1]}
        material={mats.hairFrontMat}
      >
        <planeGeometry args={[PLANE_W, PLANE_H]} />
      </mesh>
    </>
  );
}

export default function IshaqMascot({ className = '', ...urls }: IshaqMascotProps) {
  const { containerRef, inView, canvasReady, targetDpr, markCanvasReady } = useMascotViewport();

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
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        <Suspense fallback={null}>
          <CharacterRigMesh active={inView} onReady={markCanvasReady} {...urls} />
        </Suspense>
      </Canvas>
    </div>
  );
}
