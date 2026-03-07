import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useEffect, useState } from 'react';
import { Cubes } from './components/Cubes';
import { FPV } from './components/FPV';
import { Ground } from './components/Ground';
import { Player } from './components/Player';
import { SceneDiagnostics } from './components/SceneDiagnostics';
import { TextureSelector } from './components/TextureSelector';
import { inventoryItemLabels, useStore } from './hooks/useStore';
import { debugInfo } from './utils/debug';

function App() {
  const saveWorld = useStore((state) => state.saveWorld);
  const resetWorld = useStore((state) => state.resetWorld);
  const craftWoodFromLog = useStore((state) => state.craftWoodFromLog);
  const selectedItem = useStore((state) => state.selectedItem);
  const inventory = useStore((state) => state.inventory);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();

    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  useEffect(() => {
    const handleCraftKey = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== 'KeyF') {
        return;
      }

      craftWoodFromLog();
    };

    document.addEventListener('keydown', handleCraftKey);
    return () => document.removeEventListener('keydown', handleCraftKey);
  }, [craftWoodFromLog]);

  useEffect(() => {
    debugInfo('app', 'Pointer lock state changed', { isPointerLocked });
  }, [isPointerLocked]);

  return (
    <div className="game-shell">
      <Canvas
        dpr={[1, 1]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 75, near: 0.1, far: 220, position: [0, 8, 0] }}
        onCreated={({ gl, scene, camera, size }) => {
          debugInfo('app', 'Canvas created', {
            size,
            sceneChildren: scene.children.length,
            cameraPosition: camera.position.toArray(),
            gl: {
              antialias: gl.getContextAttributes()?.antialias ?? null,
              alpha: gl.getContextAttributes()?.alpha ?? null,
              powerPreference: gl.getContextAttributes()?.powerPreference ?? null,
            },
          });
        }}
      >
        <color attach="background" args={['#8fd0ff']} />
        <fog attach="fog" args={['#8fd0ff', 20, 140]} />
        <Sky
          distance={450000}
          sunPosition={[100, 80, 40]}
          inclination={0.49}
          azimuth={0.2}
        />
        <hemisphereLight args={['#fff4d6', '#6f8db3', 1.2]} />
        <ambientLight intensity={0.65} />
        <directionalLight
          intensity={1.6}
          position={[24, 34, 18]}
        />
        <Physics gravity={[0, -20, 0]}>
          <Player />
          <Cubes />
          <Ground />
        </Physics>
        <SceneDiagnostics />
        <FPV onLockChange={setIsPointerLocked} />
      </Canvas>
      <button
        id="pointer-lock-target"
        className={`play-overlay ${isPointerLocked ? 'hidden' : ''}`}
        type="button"
      >
        Click To Play
      </button>
      <div className={`crosshair ${isPointerLocked ? 'visible' : ''}`}>+</div>
      <div className={`hand-overlay ${isPointerLocked ? 'visible' : ''}`}>
        <div className="hand-palm" />
        <div className="hand-thumb" />
      </div>
      <TextureSelector />
      <div className="controls-menu">
        <button onClick={saveWorld} className="btn btn-save">Save World</button>
        <button onClick={resetWorld} className="btn btn-reset">Reset World</button>
      </div>
      <div className="help-text">
        Left Click: Punch / harvest
        <br />
        Right Click: Place selected block
        <br />
        WASD: Move | Space: Jump | 1-7: Hotbar
        <br />
        F: Craft 4 planks from 1 log
      </div>
      <div className="survival-panel">
        <div>Selected: {inventoryItemLabels[selectedItem]}</div>
        <div>Logs: {inventory.log}</div>
        <div>Planks: {inventory.wood}</div>
        <div>Wheat: {inventory.wheat}</div>
      </div>
    </div>
  );
}

export default App;
