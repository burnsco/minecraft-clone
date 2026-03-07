import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { type ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  dirtTexture,
  grassTopTexture,
  leavesTexture,
  logTexture,
  woodTexture,
} from '../images/textures';
import { BLOCK_KINDS, type Block, type BlockKind, useStore } from '../hooks/useStore';

interface ColliderRun {
  key: string;
  position: [number, number, number];
  args: [number, number, number];
}

const textureByKind: Record<BlockKind, THREE.Texture> = {
  dirt: dirtTexture,
  grass: grassTopTexture,
  log: logTexture,
  wood: woodTexture,
  leaves: leavesTexture,
};

const dummy = new THREE.Object3D();

const buildColliderRuns = (blocks: Block[]) => {
  const columns = new Map<string, { x: number; z: number; ys: number[] }>();

  blocks.forEach((block) => {
    const [x, y, z] = block.pos;
    const key = `${x}:${z}`;
    const column = columns.get(key);

    if (column) {
      column.ys.push(y);
      return;
    }

    columns.set(key, { x, z, ys: [y] });
  });

  const runs: ColliderRun[] = [];

  columns.forEach(({ x, z, ys }) => {
    ys.sort((a, b) => a - b);

    let runStart = ys[0];
    let previous = ys[0];

    for (let index = 1; index <= ys.length; index += 1) {
      const current = ys[index];

      if (current === previous + 1) {
        previous = current;
        continue;
      }

      const height = previous - runStart + 1;

      runs.push({
        key: `${x}:${runStart}:${z}:${height}`,
        position: [x, runStart + (height - 1) / 2, z],
        args: [0.5, height / 2, 0.5],
      });

      runStart = current;
      previous = current;
    }
  });

  return runs;
};

const BlockInstances = ({
  kind,
  blocks,
}: {
  kind: BlockKind;
  blocks: Block[];
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const placeSelectedBlock = useStore((state) => state.placeSelectedBlock);
  const harvestBlock = useStore((state) => state.harvestBlock);

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    blocks.forEach((block, index) => {
      dummy.position.set(...block.pos);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.count = blocks.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [blocks]);

  if (blocks.length === 0) {
    return null;
  }

  const handlePointerDown = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (event.instanceId === undefined || !event.face) {
      return;
    }

    const block = blocks[event.instanceId];

    if (!block) {
      return;
    }

    const [x, y, z] = block.pos;

    if (event.button === 0) {
      harvestBlock(x, y, z);
      return;
    }

    if (event.button !== 2) {
      return;
    }

    const normal = event.face.normal.clone().round();

    placeSelectedBlock(x + normal.x, y + normal.y, z + normal.z);
  };

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, blocks.length]} onPointerDown={handlePointerDown}>
      <boxGeometry />
      <meshLambertMaterial
        map={textureByKind[kind]}
        transparent={kind === 'leaves'}
        opacity={kind === 'leaves' ? 0.92 : 1}
        alphaTest={kind === 'leaves' ? 0.15 : 0}
      />
    </instancedMesh>
  );
};

export const Cubes = () => {
  const blocks = useStore((state) => state.blocks);

  const blocksByKind = useMemo(() => {
    const groups = Object.fromEntries(
      BLOCK_KINDS.map((kind) => [kind, [] as Block[]])
    ) as Record<BlockKind, Block[]>;

    blocks.forEach((block) => {
      groups[block.kind].push(block);
    });

    return groups;
  }, [blocks]);

  const colliderRuns = useMemo(() => buildColliderRuns(blocks), [blocks]);

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        {colliderRuns.map((run) => (
          <CuboidCollider key={run.key} position={run.position} args={run.args} />
        ))}
      </RigidBody>
      {BLOCK_KINDS.map((kind) => (
        <BlockInstances key={kind} kind={kind} blocks={blocksByKind[kind]} />
      ))}
    </>
  );
};
