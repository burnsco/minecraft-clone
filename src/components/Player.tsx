import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';
import { useKeyboard } from '../hooks/useKeyboard';

const MOVE_SPEED = 7;
const AIR_CONTROL_SPEED = 4.5;
const JUMP_FORCE = 7.5;
const EYE_HEIGHT = 0.6;
const RESPAWN_HEIGHT = -25;
const SPAWN_POINT: [number, number, number] = [0, 8, 0];

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();

export const Player = () => {
  const { camera } = useThree();
  const { moveForward, moveBackward, moveLeft, moveRight, jump } = useKeyboard();
  const { rapier, world } = useRapier();
  const bodyRef = useRef<RapierRigidBody>(null);
  const prevJumpRef = useRef(false);

  useFrame(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    const position = body.translation();
    const velocity = body.linvel();
    const ray = new rapier.Ray(
      { x: position.x, y: position.y - 0.9, z: position.z },
      { x: 0, y: -1, z: 0 }
    );
    const groundHit = world.castRay(ray, 0.2, true, undefined, undefined, undefined, body);
    const isGrounded = groundHit !== null && velocity.y <= 0.5;

    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() === 0) {
      forward.set(0, 0, -1);
    }

    forward.normalize();
    right.crossVectors(forward, up).normalize();
    movement.set(0, 0, 0);

    if (moveForward) movement.add(forward);
    if (moveBackward) movement.sub(forward);
    if (moveRight) movement.add(right);
    if (moveLeft) movement.sub(right);

    const hasMovement = movement.lengthSq() > 0;
    const speed = isGrounded ? MOVE_SPEED : AIR_CONTROL_SPEED;

    if (hasMovement) {
      movement.normalize().multiplyScalar(speed);
    }

    const nextVelocity = {
      x: hasMovement ? movement.x : isGrounded ? 0 : velocity.x * 0.92,
      y: velocity.y,
      z: hasMovement ? movement.z : isGrounded ? 0 : velocity.z * 0.92,
    };

    const wantsJump = jump && !prevJumpRef.current;

    if (wantsJump && isGrounded) {
      nextVelocity.y = JUMP_FORCE;
    }

    prevJumpRef.current = jump;
    body.setLinvel(nextVelocity, true);

    if (position.y < RESPAWN_HEIGHT) {
      body.setTranslation(
        { x: SPAWN_POINT[0], y: SPAWN_POINT[1], z: SPAWN_POINT[2] },
        true
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      camera.position.set(SPAWN_POINT[0], SPAWN_POINT[1] + EYE_HEIGHT, SPAWN_POINT[2]);
      return;
    }

    camera.position.set(position.x, position.y + EYE_HEIGHT, position.z);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={SPAWN_POINT}
      type="dynamic"
      colliders={false}
      canSleep={false}
      friction={0}
      mass={1}
      lockRotations
    >
      <CapsuleCollider args={[0.45, 0.35]} />
    </RigidBody>
  );
};
