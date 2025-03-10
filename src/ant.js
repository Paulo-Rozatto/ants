import { SphereGeometry, MeshBasicMaterial, Mesh } from 'three';

export class Ant {
    constructor(scene, ant_model, grid_size, initial_x, initial_y) {
        this.i = 0;
        this.j = 0;
        this.last_i = 0;
        this.last_j = 0;
        this.found_food = false;
        this.hist = [];

        this.grid = Array(grid_size);
        for (let i = 0; i < grid_size; i++) {
            const row = Array(grid_size);
            for (let j = 0; j < grid_size; j++) {
                row[j] = false;
            }
            this.grid[i] = row;
        }
        this.grid[0][0] = true;

        // const ant_geomerty = new SphereGeometry(3)
        // const ant_material = new MeshBasicMaterial({ color: Math.round(0xffffff * Math.random()) })
        // this.mesh = new Mesh(ant_geomerty, ant_material);
        this.mesh = ant_model.clone()
        this.mesh.position.set(initial_x, 3, initial_y);
        this.mesh.scale.set(3, 3, 3)
        scene.add(this.mesh);
    }

    get position() {
        return this.mesh.position;
    }
}