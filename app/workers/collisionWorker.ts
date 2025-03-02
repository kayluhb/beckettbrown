// Define the Ball interface in the worker
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

// Define a grid cell for spatial partitioning
interface GridCell {
  x: number;
  y: number;
  balls: Ball[];
}

// Listen for messages from the main thread
self.onmessage = (e) => {
  const { balls, windowWidth, windowHeight, gridCellSize } = e.data;

  if (!balls || balls.length <= 1) {
    self.postMessage(balls || []);
    return;
  }

  // Process collisions with spatial partitioning
  const processedBalls = processCollisionsWithGrid(balls, gridCellSize || 200);

  // Send the updated balls back to the main thread
  self.postMessage(processedBalls);
};

// Use spatial partitioning to reduce collision checks
function processCollisionsWithGrid(balls: Ball[], gridCellSize: number) {
  const grid = new Map<string, Ball[]>();
  // Step 1: Assign balls to grid cells
  for (const ball of balls) {
    // Calculate grid cell coordinates
    const cellX = Math.floor(ball.x / gridCellSize);
    const cellY = Math.floor(ball.y / gridCellSize);

    // Generate a key for this cell
    const key = `${cellX},${cellY}`;

    // Add this ball to the appropriate cell
    let cellBalls = grid.get(key);
    if (!cellBalls) {
      cellBalls = [];
      grid.set(key, cellBalls);
    }
    cellBalls.push(ball);
  }

  // Step 2: Process collisions within and between neighboring cells
  const processedBalls = [...balls];
  const checkedPairs = new Set<string>();

  // For each cell in the grid
  grid.forEach((cellBalls, key) => {
    const [cellX, cellY] = key.split(",").map(Number);

    // Check collisions within this cell
    for (let i = 0; i < cellBalls.length; i++) {
      for (let j = i + 1; j < cellBalls.length; j++) {
        const pairKey = `${cellBalls[i].id}-${cellBalls[j].id}`;
        if (checkedPairs.has(pairKey)) continue;

        checkAndResolveCollision(cellBalls[i], cellBalls[j], processedBalls);
        checkedPairs.add(pairKey);
      }
    }

    // Check collisions with neighboring cells
    for (let nx = -1; nx <= 1; nx++) {
      for (let ny = -1; ny <= 1; ny++) {
        // Skip the current cell (already processed)
        if (nx === 0 && ny === 0) continue;

        const neighborKey = `${cellX + nx},${cellY + ny}`;
        const neighborBalls = grid.get(neighborKey);

        // If neighbor cell exists
        if (neighborBalls) {
          // Check collisions between current cell and neighbor cell
          for (const ball1 of cellBalls) {
            for (const ball2 of neighborBalls) {
              const pairKey = `${ball1.id}-${ball2.id}`;
              const reversePairKey = `${ball2.id}-${ball1.id}`;

              if (checkedPairs.has(pairKey) || checkedPairs.has(reversePairKey))
                continue;

              checkAndResolveCollision(ball1, ball2, processedBalls);
              checkedPairs.add(pairKey);
            }
          }
        }
      }
    }
  });

  return processedBalls;
}

// Optimized collision detection and resolution
function checkAndResolveCollision(
  ball1: Ball,
  ball2: Ball,
  ballsArray: Ball[]
) {
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
    const idx1 = ballsArray.findIndex((b) => b.id === ball1.id);
    const idx2 = ballsArray.findIndex((b) => b.id === ball2.id);

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
    ballsArray[idx1].x -= moveX;
    ballsArray[idx1].y -= moveY;
    ballsArray[idx1].velocity = v1Final;

    ballsArray[idx2].x += moveX;
    ballsArray[idx2].y += moveY;
    ballsArray[idx2].velocity = v2Final;
  }
}
