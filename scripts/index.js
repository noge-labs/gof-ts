"use strict";
const CANVAS_SIZE = 20 * 20;
const SQUARE_SIZE = 20;
const GRID_SIZE = CANVAS_SIZE / SQUARE_SIZE;
const createCell = (alive = false) => ({
    alive: alive ? 1 : 0,
});
const createWorld = () => ({
    cells: Array.from({ length: CANVAS_SIZE }, () => createCell()),
    size: SQUARE_SIZE,
});
const mapCells = (world, callback) => {
    return world.cells.map((cell, index) => {
        return callback(!!cell.alive, index);
    });
};
const step = (world) => ({
    ...world,
    cells: mapCells(world, (alive, index) => nextCell(world, alive, index)),
});
const nextCell = (world, alive, index) => {
    return createCell(shouldLive(world, alive, index));
};
const shouldLive = (world, alive, index) => {
    const liveNeibhbors = getNeighborhood(world, index);
    return liveNeibhbors === 3 ? true : liveNeibhbors === 2 ? alive : false;
};
const getCoordinatesForIndex = (world, index) => ({
    x: index % world.size,
    y: Math.floor(index / world.size),
});
const getNeighborhood = (world, index) => {
    return getNeighborsForIndex(world, index).reduce((acc, cell) => {
        return acc + (cell ? cell.alive : 0);
    }, 0);
};
const getNeighborsForIndex = (world, index) => {
    const { x, y } = getCoordinatesForIndex(world, index);
    const neighbors = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0)
                continue;
            const neighborX = wrapAround(x + i, world.size);
            const neighborY = wrapAround(y + j, world.size);
            const neighborIndex = neighborX + neighborY * world.size;
            neighbors.push(world.cells[neighborIndex]);
        }
    }
    return neighbors;
};
const getIndexForCoordinates = (world, x, y) => {
    const { size } = world;
    const wrappedX = wrapAround(x, size);
    const wrappedY = wrapAround(y, size);
    return wrappedX + wrappedY * size;
};
const wrapAround = (number, range) => {
    return ((number % range) + range) % range;
};
const drawWorld = (world, canvas) => {
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
        }
        else {
            canvas.fillStyle = "#000000";
            canvas.fillRect(newX, newY, SQUARE_SIZE, SQUARE_SIZE);
        }
    }
};
const tryGetElementById = (id) => {
    const element = document.getElementById(id);
    if (!element || element == null)
        throw new Error(`cannot access element ${id}`);
    return element;
};
window.onload = async () => {
    const start_btn = tryGetElementById("start_btn");
    const clear_btn = tryGetElementById("clear_btn");
    const canvas = tryGetElementById("app");
    const context = canvas.getContext("2d");
    context.canvas.height = CANVAS_SIZE;
    context.canvas.width = CANVAS_SIZE;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const state = {
        world: createWorld(),
        running: false,
    };
    start_btn.addEventListener("click", () => {
        if (!state.running) {
            state.running = true;
            const loop = (world) => {
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
    canvas.addEventListener("click", (event) => {
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
        }
        else {
            // cell is dead, make it alive and change color to white
            context.fillStyle = "#FFFFFF";
            context.fillRect(x * S, y * S, S, S);
            cell.alive = 1;
        }
    }, true);
};
