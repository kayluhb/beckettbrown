import type { MetaFunction } from 'react-router';
import { useState, useEffect, useRef, useCallback } from 'react';

export const meta: MetaFunction = () => {
  return [{ title: 'Beckett Brown' }, { name: 'description', content: `Welcome to Beckett's site` }];
};

interface Ball {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  velocity: number;
  rotation: number;
  bounceCount: number;
}

// Grid cell size for spatial partitioning
const GRID_CELL_SIZE = 200;

export default function Index() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const nextIdRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Use refs to avoid recreating functions on every render
  const ballsRef = useRef<Ball[]>([]);
  ballsRef.current = balls;

  const generateRandomGreen = useCallback(() => {
    const hue = 120; // Green hue
    const saturation = Math.random() * 30 + 70; // 70-100%
    const lightness = Math.random() * 20 + 40; // 40-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const numBalls = 15; // Number of balls to generate per click
      const newBalls: Ball[] = [];
      const currentId = nextIdRef.current;

      for (let i = 0; i < numBalls; i++) {
        const angle = (Math.PI * 2 * i) / numBalls; // Distribute balls in a circle
        const radius = 20; // Initial spread radius
        const newBall: Ball = {
          id: currentId + i,
          x: e.clientX + Math.cos(angle) * radius,
          y: e.clientY + Math.sin(angle) * radius,
          size: Math.random() * 100 + 50, // 50-150px
          color: generateRandomGreen(),
          velocity: Math.random() * 2 + 1, // Random initial velocity
          rotation: Math.random() * 360, // Random rotation
          bounceCount: 0,
        };
        newBalls.push(newBall);
      }

      nextIdRef.current = currentId + numBalls;
      setBalls((prev) => [...prev, ...newBalls]);
    },
    [generateRandomGreen],
  );

  useEffect(() => {
    try {
      // Create worker with error handling
      // Use Vite's built-in worker import syntax
      workerRef.current = new Worker(new URL('../workers/collisionWorker.ts', import.meta.url), {
        type: 'module',
      });

      // Set up worker message handler
      workerRef.current.onmessage = (e) => {
        if (e.data && Array.isArray(e.data)) {
          setBalls(e.data);
        }
      };

      // Set up worker error handler
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        // Fall back to main thread if worker fails
        workerRef.current = null;
      };
    } catch (error) {
      console.error('Failed to create worker:', error);
      workerRef.current = null;
    }

    const gravity = 0.3;
    const friction = 0.995;
    const bounceEnergy = 0.7;
    const maxBounces = 5;

    const updateBalls = () => {
      const updateFn = (prevBalls: Ball[]) => {
        // Handle ball updates in the main thread
        const updatedBalls = prevBalls
          .map((ball) => {
            const newVelocity = ball.velocity + gravity;
            let newY = ball.y + newVelocity;

            // Check if ball is off screen
            if (ball.x < -ball.size || ball.x > window.innerWidth + ball.size || ball.y < -ball.size) {
              return null;
            }

            let newVelocityAfterBounce = newVelocity;
            let newBounceCount = ball.bounceCount;

            // Ground collision
            if (newY > window.innerHeight - ball.size / 2) {
              newY = window.innerHeight - ball.size / 2;
              newVelocityAfterBounce = -newVelocity * bounceEnergy;
              newBounceCount = ball.bounceCount + 1;
            }

            // Stop the ball if it has bounced too many times or has very low velocity
            if (
              newBounceCount >= maxBounces ||
              (Math.abs(newVelocityAfterBounce) < 0.1 && newY >= window.innerHeight - ball.size / 2)
            ) {
              return {
                ...ball,
                y: window.innerHeight - ball.size / 2,
                velocity: 0,
                rotation: ball.rotation,
                bounceCount: newBounceCount,
              };
            }

            return {
              ...ball,
              y: newY,
              velocity: newVelocityAfterBounce * friction,
              rotation: ball.rotation + newVelocityAfterBounce * 0.5,
              bounceCount: newBounceCount,
            };
          })
          .filter((ball): ball is Ball => ball !== null);

        // If we have a worker and multiple balls, use it for collision detection
        if (workerRef.current && updatedBalls.length > 1) {
          workerRef.current.postMessage({
            balls: updatedBalls,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            gridCellSize: GRID_CELL_SIZE,
          });

          // Return current state, worker will update
          return prevBalls;
        }

        return updatedBalls;
      };

      setBalls(updateFn);
      rafIdRef.current = requestAnimationFrame(updateBalls);
    };

    // Fallback collision detection in main thread
    const handleCollisionsInMainThread = (balls: Ball[]) => {
      const grid: Map<string, Ball[]> = new Map();
      // Place balls into grid cells
      for (const ball of balls) {
        const cellX = Math.floor(ball.x / GRID_CELL_SIZE);
        const cellY = Math.floor(ball.y / GRID_CELL_SIZE);

        // Check the current cell and neighboring cells
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const key = `${cellX + i},${cellY + j}`;
            const cellBalls = grid.get(key) || [];

            // Check collisions with balls in this cell
            for (const otherBall of cellBalls) {
              checkAndResolveCollision(ball, otherBall, balls);
            }
          }
        }

        // Add ball to its cell
        const key = `${cellX},${cellY}`;
        const cellBalls = grid.get(key) ?? [];
        grid.set(key, [...cellBalls, ball]);
      }

      return balls;
    };

    // Helper function for collision resolution
    const checkAndResolveCollision = (ball1: Ball, ball2: Ball, balls: Ball[]) => {
      const dx = ball2.x - ball1.x;
      const dy = ball2.y - ball1.y;
      const distanceSquared = dx * dx + dy * dy;
      const minDistance = (ball1.size + ball2.size) / 2;

      // Early exit using squared distance (avoids expensive sqrt)
      if (distanceSquared >= minDistance * minDistance) {
        return;
      }

      const distance = Math.sqrt(distanceSquared);

      if (distance < minDistance) {
        // Find indices of the balls
        const idx1 = balls.findIndex((b) => b.id === ball1.id);
        const idx2 = balls.findIndex((b) => b.id === ball2.id);

        if (idx1 === -1 || idx2 === -1) return;

        // Calculate collision response
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        // Use size as mass - bigger balls are heavier
        const mass1 = ball1.size * ball1.size; // Mass proportional to area
        const mass2 = ball2.size * ball2.size;

        // Conservation of momentum formula
        const v1 = ball1.velocity;
        const v2 = ball2.velocity;

        // Calculate new velocities using conservation of momentum and energy
        const v1Final = ((mass1 - mass2) * v1 + 2 * mass2 * v2) / (mass1 + mass2);
        const v2Final = ((mass2 - mass1) * v2 + 2 * mass1 * v1) / (mass1 + mass2);

        // Move balls apart
        const overlap = (minDistance - distance) / 2;
        const moveX = overlap * cos;
        const moveY = overlap * sin;

        // Apply changes directly to the balls array
        balls[idx1].x -= moveX;
        balls[idx1].y -= moveY;
        balls[idx1].velocity = v1Final;

        balls[idx2].x += moveX;
        balls[idx2].y += moveY;
        balls[idx2].velocity = v2Final;
      }
    };

    rafIdRef.current = requestAnimationFrame(updateBalls);

    // Cleanup
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return (
    <main className="absolute inset-0 w-full h-[100dvh] overflow-hidden" onPointerDown={handlePointerDown}>
      {balls.map((ball) => (
        <div
          key={ball.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ball.x,
            top: ball.y,
            width: ball.size,
            height: ball.size,
            backgroundColor: ball.color,
            transform: `translate(-50%, -50%) rotate(${ball.rotation}deg)`,
            willChange: 'transform',
          }}
        />
      ))}
      {balls.length === 0 && (
        <div className="flex flex-col items-center justify-center h-screen pointer-events-none">
          <h1 className="text-4xl font-bold">Click Me</h1>
        </div>
      )}
    </main>
  );
}
