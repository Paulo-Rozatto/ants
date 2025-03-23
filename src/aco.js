import { config, grid2world } from "./utils";

const DIRECTIONS = [
    [-1, 0],  // Left
    [1, 0],   // Right
    [0, -1],  // Up
    [0, 1],   // Down
    [-1, -1], // Up-left
    [-1, 1],  // Down-left
    [1, -1],  // Up-right
    [1, 1]    // Down-right
];

const ants = [];
let _world, _food_pos, _anthill_pos, _plane;



class Ant {
    constructor(antModel) {
        this.i = 0;
        this.j = 0;
        this.foundFood = false;
        this.history = [];
        this.visitedGrid = Array.from({ length: config.grid_size }, () =>
            Array(config.grid_size).fill(false)
        );
        this.visitedGrid[0][0] = true;
        this.mesh = antModel.clone();
        this.mesh.scale.set(3, 3, 3);
    }

    walk() {
        if (this.foundFood) return false;

        const availableTiles = [];
        const pheromoneSums = [];
        let totalPheromones = 0;

        for (const [dx, dy] of DIRECTIONS) {
            const nextI = this.i + dx;
            const nextJ = this.j + dy;
            if (
                nextI >= 0 && nextI < config.grid_size &&
                nextJ >= 0 && nextJ < config.grid_size &&
                !this.visitedGrid[nextI][nextJ]
            ) {
                availableTiles.push([nextI, nextJ]);
                totalPheromones += _world[nextI][nextJ];
                pheromoneSums.push(totalPheromones);
            }
        }

        if (availableTiles.length === 0) return false;

        const randomTicket = Math.floor(Math.random() * totalPheromones);
        let selectedIndex = 0;
        while (pheromoneSums[selectedIndex] < randomTicket) {
            selectedIndex++;
        }

        const [nextI, nextJ] = availableTiles[selectedIndex];
        this.history.push([nextI, nextJ]);
        this.visitedGrid[nextI][nextJ] = true;

        const dx = nextI - this.i;
        const dz = nextJ - this.j;
        const angle = Math.atan2(dz, dx);
        this.mesh.rotation.y = angle - Math.PI / 2;


        this.i = nextI;
        this.j = nextJ;

        if (nextI === _food_pos.i && nextJ === _food_pos.j) {
            this.foundFood = true;
        }

        grid2world(nextI, nextJ, this.mesh.position);

        return true;
    }
}

function disposeAnts(scene) {
    ants.forEach(ant => {
        if (ant.mesh) {
            if (ant.mesh.geometry) ant.mesh.geometry.dispose();
            if (ant.mesh.material) {
                if (Array.isArray(ant.mesh.material)) {
                    ant.mesh.material.forEach(mat => mat.dispose());
                } else {
                    ant.mesh.material.dispose();
                }
            }
            scene.remove(ant.mesh);
        }
    });
    ants.length = 0;
}

export function set(scene, ant_model, food, plane) {
    // Initialize world as a matrix GRID_SIZExGRID_SIZE
    _world = Array.from({ length: config.grid_size }, () =>
        Array(10).fill(1)
    );
    _anthill_pos = config.anthill_pos;
    _food_pos = config.food_pos;
    _plane = plane;

    if (ants.length > 0) {
        disposeAnts(scene);
    }

    for (let i = 0; i < config.ants_number; i++) {
        const ant = new Ant(ant_model);
        grid2world(_anthill_pos.i, _anthill_pos.j, ant.mesh.position);
        ant.mesh.position.y = 2;
        ants.push(ant);
        scene.add(ant.mesh);
    }

    grid2world(_food_pos.i, _food_pos.j, food.position);
    food.position.y = 3.1
    console.log(food.position)
    scene.add(food);
}

export async function step() {
    // Let ants walk until none move or one finds food.
    let continueWalking = true;
    let foundFood = false;
    while (continueWalking && !foundFood) {
        continueWalking = false;
        for (const ant of ants) {
            if (ant.walk()) {
                continueWalking = true;
                if (ant.foundFood) {
                    foundFood = true;
                    break;
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // 100ms delay
    }

    const evaporationFactor = 0.9;
    for (let i = 0; i < _world.length; i++) {
        for (let j = 0; j < _world[i].length; j++) {
            _world[i][j] *= evaporationFactor;
        }
    }

    if (foundFood) {
        for (const ant of ants) {
            if (ant.foundFood) {
                const pathLength = ant.history.length;
                const depositValue = pathLength > 0 ? 10 / pathLength : 1;
                for (const [i, j] of ant.history) {
                    _world[i][j] += depositValue;
                }
                break;
            }
        }
    }

    for (let i = 0; i < config.grid_size; i++) {
        for (let j = 0; j < config.grid_size; j++) {
            const index = i * config.grid_size + j;
            const group = _plane.children[index];
            if (group && group.children.length > 0) {
                const tile = group.children[0];
                let pheromoneValue = _world[i][j];
                const newLightness = pheromoneValue <= 0 ? 65 : Math.min(65, 30 / pheromoneValue);

                tile.material.color.set(`hsl(28, 100%, ${newLightness}%)`);
            }
        }
    }

    // Reset each ant to the anthill.
    for (const ant of ants) {
        ant.i = _anthill_pos.i;
        ant.j = _anthill_pos.j;
        ant.foundFood = false;
        ant.history = [];
        ant.mesh.rotation.y = 0;
        ant.visitedGrid = Array.from({ length: config.grid_size }, () =>
            Array(config.grid_size).fill(false)
        );
        ant.visitedGrid[_anthill_pos.i][_anthill_pos.j] = true;
        grid2world(_anthill_pos.i, _anthill_pos.j, ant.mesh.position);
    }
}
