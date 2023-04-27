const CANVAS_SIZE = 20 * 20;
const SQUARE_SIZE = 20;
const GRID_SIZE = CANVAS_SIZE / SQUARE_SIZE;

type Cell = {
  alive: 0 | 1;
};

type World = {
  cells: Array<Cell>;
  size: number;
};

type Coordinate = {
  x: number;
  y: number;
};

const createCell = (alive = false): Cell => ({
  alive: alive ? 1 : 0,
});

const createWorld = (): World => ({
  cells: Array.from({ length: CANVAS_SIZE }, () => createCell()),
  size: SQUARE_SIZE,
});

const mapCells = <T>(
  world: World,
  callback: (alive: boolean, index: number) => T
) => {
  return world.cells.map((cell, index) => {
    return callback(!!cell.alive, index);
  });
};

const step = (world: World): World => ({
  ...world,
  cells: mapCells(world, (alive, index) => nextCell(world, alive, index)),
});

const nextCell = (world: World, alive: boolean, index: number): Cell => {
  return createCell(shouldLive(world, alive, index));
};

const shouldLive = (world: World, alive: boolean, index: number): boolean => {
  const liveNeibhbors = getNeighborhood(world, index);
  return liveNeibhbors === 3 ? true : liveNeibhbors === 2 ? alive : false;
};

const getCoordinatesForIndex = (world: World, index: number): Coordinate => ({
  x: index % world.size,
  y: Math.floor(index / world.size),
});

const getNeighborhood = (world: World, index: number): number => {
  return getNeighborsForIndex(world, index).reduce((acc, cell) => {
    return acc + (cell ? cell.alive : 0);
  }, 0);
};

const getNeighborsForIndex = (world: World, index: number): Array<Cell> => {
  const { x, y } = getCoordinatesForIndex(world, index);
  const neighbors = [];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const neighborX = wrapAround(x + i, world.size);
      const neighborY = wrapAround(y + j, world.size);
      const neighborIndex = neighborX + neighborY * world.size;
      neighbors.push(world.cells[neighborIndex]);
    }
  }

  return neighbors;
};

const getIndexForCoordinates = (world: World, x: number, y: number): number => {
  const { size } = world;

  const wrappedX = wrapAround(x, size);
  const wrappedY = wrapAround(y, size);

  return wrappedX + wrappedY * size;
};

const wrapAround = (number: number, range: number): number => {
  return ((number % range) + range) % range;
};

const drawWorld = (world: World, canvas: CanvasRenderingContext2D) => {
  for (let i = 0; i < world.cells.length; i++) {
    const { alive } = world.cells[i];
    const { x, y } = getCoordinatesForIndex(world, i);

    const liveNeighbors = getNeighborhood(world, i);
    const intensity = Math.min(1, 0.2 + liveNeighbors / 8);

    const newX = x * SQUARE_SIZE;
    const newY = y * SQUARE_SIZE;

    if (alive) {
      canvas.fillStyle = `rgba(0, 255, 0, ${intensity})`;
      canvas.fillRect(newX, newY, SQUARE_SIZE, SQUARE_SIZE);
    } else {
      canvas.fillStyle = "#000000";
      canvas.fillRect(newX, newY, SQUARE_SIZE, SQUARE_SIZE);
    }
  }
};

const tryGetElementById = (id: string): HTMLElement => {
  const element = document.getElementById(id);

  if (!element || element == null)
    throw new Error(`cannot access element ${id}`);

  return element;
};

interface GOF {
  world: World;
  running: boolean;
}

window.onload = async () => {
  const start_btn = tryGetElementById("start_btn") as HTMLButtonElement;
  const clear_btn = tryGetElementById("clear_btn") as HTMLButtonElement;

  const canvas = tryGetElementById("app") as HTMLCanvasElement;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  context.canvas.height = CANVAS_SIZE;
  context.canvas.width = CANVAS_SIZE;
  context.fillStyle = "#000000"
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const state: GOF = {
    world: createWorld(),
    running: false,
  };

  start_btn.addEventListener("click", () => {
    if (!state.running) {
      state.running = true;

      const loop = (world: World) => {
        setTimeout(() => {
          const newWorld = step(world);
          drawWorld(newWorld, context);
  
          if (state.running) {
            loop(newWorld);
          }
        }, 100);
      };

      loop(state.world);
    }
  });

  clear_btn.addEventListener("click", () => {
    state.world = createWorld();
    state.running = false;

    drawWorld(state.world, context);
  });

  canvas.addEventListener(
    "click",
    (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();

      const S = SQUARE_SIZE;
      const x = Math.floor((event.clientX - rect.left) / SQUARE_SIZE);
      const y = Math.floor((event.clientY - rect.top) / SQUARE_SIZE);

      const cell = state.world.cells[y * S + x];

      if (cell.alive) {
        // cell is alive, make it dead and change color to black
        context.fillStyle = "#000000";
        context.fillRect(x * S, y * S, S, S);
        cell.alive = 0;
      } else {
        // cell is dead, make it alive and change color to white
        context.fillStyle = "#FFFFFF";
        context.fillRect(x * S, y * S, S, S);
        cell.alive = 1;
      }
    },
    true
  );
};
