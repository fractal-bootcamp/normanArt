import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Sphere } from "@react-three/drei";

const COUNT = 50;
const SPAWN_RANGE_XZ = 100;
const SPAWN_RANGE_Y = 70;
const MOVEMENT_RANGE = 5;

interface Enemy {
  id: number;
  position: [number, number, number];
  isPopping: boolean;
  popStartTime: number;
}

export const Enemies: React.FC = () => {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const initialPositions = useRef<THREE.Vector3[]>([]);

  const spawnEnemies = useCallback(() => {
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < COUNT; i++) {
      newEnemies.push(createEnemy());
    }
    setEnemies(newEnemies);
  }, []);

  useEffect(() => {
    spawnEnemies();
  }, [spawnEnemies]);

  const createEnemy = (): Enemy => {
    const x = (Math.random() - 0.5) * SPAWN_RANGE_XZ;
    const y = Math.random() * SPAWN_RANGE_Y - 10;
    const z = (Math.random() - 0.5) * SPAWN_RANGE_XZ;
    initialPositions.current.push(new THREE.Vector3(x, y, z));
    return {
      id: Math.random(),
      position: [x, y, z],
      isPopping: false,
      popStartTime: 0,
    };
  };

  const handleCollision = (enemyId: number) => {
    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy) =>
        enemy.id === enemyId
          ? { ...enemy, isPopping: true, popStartTime: Date.now() }
          : enemy
      )
    );
  };

  useFrame((state) => {
    setEnemies((prevEnemies) =>
      prevEnemies.map((enemy, index) => {
        if (enemy.isPopping) {
          const popDuration = 500;
          if (Date.now() - enemy.popStartTime > popDuration) {
            return createEnemy();
          }
          return enemy;
        }

        const initialPos = initialPositions.current[index];
        const time = state.clock.elapsedTime + index;
        const x = initialPos.x + Math.sin(time) * MOVEMENT_RANGE;
        const y = initialPos.y + Math.cos(time * 0.5) * MOVEMENT_RANGE;
        const z = initialPos.z + Math.sin(time * 0.7) * MOVEMENT_RANGE;

        return { ...enemy, position: [x, y, z] };
      })
    );
  });

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          {...enemy}
          onCollision={() => handleCollision(enemy.id)}
        />
      ))}
    </>
  );
};

interface EnemyProps {
  id: number;
  position: [number, number, number];
  isPopping: boolean;
  onCollision: () => void;
}

const Enemy: React.FC<EnemyProps> = ({
  id,
  position,
  isPopping,
  onCollision,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scale, setScale] = useState<number>(1);
  const [opacity, setOpacity] = useState<number>(0.7);

  useEffect(() => {
    if (isPopping) {
      let startTime = Date.now();
      const popDuration = 500; // 500ms for the entire pop animation

      const popAnimation = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / popDuration, 1);

        // Easing function for smoother animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);

        // Scale up to 1.5 times the original size
        setScale(1 + 0.5 * easedProgress);

        // Fade out
        setOpacity(0.7 * (1 - easedProgress));

        if (progress < 1) {
          requestAnimationFrame(popAnimation);
        }
      };

      requestAnimationFrame(popAnimation);
    } else {
      setScale(1);
      setOpacity(0.7);
    }
  }, [isPopping]);

  return (
    <RigidBody position={position} type="fixed">
      <CuboidCollider
        args={[0.5, 0.5, 0.5]}
        sensor
        onIntersectionEnter={onCollision}
      />
      <Sphere ref={meshRef} args={[0.5, 32, 32]} scale={scale}>
        <meshStandardMaterial
          color={isPopping ? "red" : "lightblue"}
          transparent
          opacity={opacity}
        />
      </Sphere>
    </RigidBody>
  );
};
