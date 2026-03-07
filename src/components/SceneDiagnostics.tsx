import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { debugError, debugInfo, debugWarn } from '../utils/debug';

export const SceneDiagnostics = () => {
  const { gl, scene, camera, size, viewport } = useThree();
  const blocks = useStore((state) => state.blocks);
  const frameCountRef = useRef(0);
  const blockCountRef = useRef(blocks.length);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      debugError('scene', 'WebGL context lost', {
        width: canvas.width,
        height: canvas.height,
      });
    };

    const handleContextRestored = () => {
      debugInfo('scene', 'WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    debugInfo('scene', 'Canvas renderer ready', {
      size,
      viewport: {
        width: viewport.width,
        height: viewport.height,
        dpr: viewport.dpr,
      },
      gl: {
        outputColorSpace: gl.outputColorSpace,
        toneMapping: gl.toneMapping,
        shadowMapEnabled: gl.shadowMap.enabled,
      },
      camera: {
        near: camera.near,
        far: camera.far,
        position: camera.position.toArray(),
      },
      sceneChildren: scene.children.length,
      blockCount: blocks.length,
    });

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [blocks.length, camera, gl, scene, size, viewport]);

  useEffect(() => {
    if (blockCountRef.current === blocks.length) {
      return;
    }

    debugInfo('scene', 'Block count changed', {
      previous: blockCountRef.current,
      next: blocks.length,
    });

    blockCountRef.current = blocks.length;
  }, [blocks.length]);

  useFrame(() => {
    frameCountRef.current += 1;

    if (frameCountRef.current > 5) {
      return;
    }

    let visibleMeshes = 0;

    scene.traverse((object) => {
      if ('isMesh' in object && object.visible) {
        visibleMeshes += 1;
      }
    });

    debugInfo('scene', `Frame ${frameCountRef.current}`, {
      cameraPosition: camera.position.toArray(),
      sceneChildren: scene.children.length,
      visibleMeshes,
      blockCount: blocks.length,
    });

    if (visibleMeshes === 0) {
      debugWarn('scene', 'No visible meshes detected on frame', {
        frame: frameCountRef.current,
      });
    }
  });

  return null;
};
