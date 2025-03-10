import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Ant } from './src/ant.js';

const grid_size = 10;
const initial_x = -44.5;
const initial_z = 44.5;
const decay_factor = 0.7;

// Scenario

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const ambient_light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambient_light);

const point_light = new THREE.PointLight(0xff0000, 10, 500, 0);
point_light.position.set(0, 10, 0);
scene.add(point_light);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// -- ground tiles
const plane_geometry = new THREE.PlaneGeometry(10, 10);
const edge_geometry = new THREE.EdgesGeometry(plane_geometry);
const edge_material = new THREE.LineBasicMaterial({ color: 0xffffff })

const plane = new THREE.Group()

for (let i = 0; i < grid_size; i++) {
    for (let j = 0; j < grid_size; j++) {
        const plane_material = new THREE.MeshPhongMaterial({ color: 'hsl(28, 100%, 100%)', side: THREE.DoubleSide, wireframe: false, shininess: 0 });
        const tile = new THREE.Mesh(plane_geometry, plane_material);
        tile.rotation.x = -Math.PI * 0.5;
        tile.position.x = 10 * (i - grid_size / 2) + 5;
        tile.position.z = 10 * (j - grid_size / 2) + 5;

        const edge = new THREE.LineSegments(edge_geometry, edge_material);
        edge.position.copy(tile.position);
        edge.position.y += 0.1;
        edge.rotation.copy(tile.rotation);

        const group = new THREE.Group();
        group.add(tile);
        group.add(edge);
        plane.add(group);
    }
}

scene.add(plane);

const gridHelper = new THREE.GridHelper(100, 10, 0xffffff, 0xffffff);
gridHelper.position.y += 0.1
// scene.add(gridHelper);

camera.position.set(-10, 50, 120);
new OrbitControls(camera, renderer.domElement);


const ants = [];
for (let i = 0; i < 10; i++) {
    ants.push(new Ant(scene, grid_size, initial_x, initial_z));
}

const food_geometry = new THREE.ConeGeometry(3, 6);
const foot_material = new THREE.MeshBasicMaterial({ color: 0x55AA00 })
const food = new THREE.Mesh(food_geometry, foot_material);
const food_i = 9, food_j = 9;
food.position.set(44.5, 3.1, -44.5);
scene.add(food);

let move_flag = true;

function move(i, j, ant) {
    ant.position.x = -44.5 + ant.i * 10;
    ant.position.z = 44.5 - ant.j * 10;

    ant.i = i;
    ant.j = j;
    ant.hist.push([i, j])
    ant.grid[i][j] = true;

    if (i == food_i && j == food_j) {
        ant.found_food = true;
    }
    move_flag = true;
}

const world = Array(10);
for (let i = 0; i < 10; i++) {
    const row = Array(10);
    for (let j = 0; j < 10; j++) {
        row[j] = 1;
    }
    world[i] = row;
}

const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
];


function choose(ant) {
    if (ant.found_food) {
        return;
    }

    const options_dirs = [];
    const options_weights = [];
    let sum = 0;

    for (const dir of directions) {
        let x = dir[0] + ant.i;
        let y = dir[1] + ant.j;

        if (x >= 0 && x < 10 && y >= 0 && y < 10 && !ant.grid[x][y]) {
            options_dirs.push([x, y]);
            sum += world[x][y];
            options_weights.push(sum);
        }
    }

    if (options_weights.length == 0) {
        return false;
    }

    let idx = 0;
    const ticket = Math.floor(Math.random() * sum);
    while (options_weights[idx] < ticket) {
        idx++;
    }

    const [chosen_x, chosen_y] = options_dirs[idx];
    move(chosen_x, chosen_y, ant);
}

function update() {
    let max = 1;

    for (let i = 1; i < ants.length; i++) {
        if (ants[i].found_food && ants[i].hist.length > max) {
            max = ants[i].hist.length;
        }
    }

    for (let i = 0; i < grid_size; i++) {
        for (let j = 0; j < grid_size; j++) {

            for (const ant of ants) {
                if (ant.grid[i][j]) {
                    if (ant.found_food) {
                        world[i][j] += 2 + 2 * (max / ant.hist.length);
                    }
                    // else {
                    //     world[i][j] *= decay_factor;
                    // }
                }

                ant.grid[i][j] = false;
                ant.position.x = initial_x;
                ant.position.z = initial_z;
                ant.i = 0;
                ant.j = 0;
            }

            world[i][j] *= decay_factor;
            let k = grid_size - 1 - j;
            plane.children[i * grid_size + k].children[0].material.color.set(`hsl(28, 100%, ${Math.min(100, Math.round(world[i][j]))}%)`)
        }
    }

    for (const ant of ants) {
        ant.found_food = false;
    }
}


function go(it, max_it) {
    move_flag = false;
    ants.forEach(ant => choose(ant));

    if (!move_flag) {
        update();
        it++;
    }

    if (it < max_it) {
        move_flag = true;

        setTimeout(() => {
            go(it, max_it)
        }, 1);
        ;
    }
}


addEventListener('keyup', (e) => {
    const key = e.key.toLocaleLowerCase();

    switch (key) {
        case ' ':
            go(0, 30)
            break;
        case 'r':
            console.log(world);
            break;

    }
})

const intersects = [];

addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    intersects.length = 0;
    raycaster.intersectObjects(plane.children, true, intersects);
})

addEventListener('pointerup', () => {
    console.log(intersects);
    for (let i = 0; i < intersects.length; i++) {
        intersects[i].object.parent.visible = false
    }
});

function animate() {


    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
