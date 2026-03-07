import { RigidBody } from '@react-three/rapier';
import { groundTexture } from '../images/textures';
import { useStore } from '../hooks/useStore';

export const Ground = () => {
  const placeSelectedBlock = useStore((state) => state.placeSelectedBlock);

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh
        position={[0, -1.5, 0]}
        receiveShadow
        onPointerDown={(event) => {
          event.stopPropagation();

          if (event.button !== 2) {
            return;
          }

          placeSelectedBlock(
            Math.round(event.point.x),
            0,
            Math.round(event.point.z)
          );
        }}
      >
        <boxGeometry args={[200, 2, 200]} />
        <meshStandardMaterial attach="material" map={groundTexture} />
      </mesh>
    </RigidBody>
  );
};
