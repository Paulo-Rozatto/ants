import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const plane_geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
const plane_material = new THREE.MeshBasicMaterial({ color: 0xFF7700, side: THREE.DoubleSide, wireframe: false });
const plane = new THREE.Mesh(plane_geometry, plane_material);
plane.rotation.x = - Math.PI / 2;
scene.add(plane);

const gridHelper = new THREE.GridHelper(100, 10, 0xffffff, 0xffffff);
gridHelper.position.y += 0.1
scene.add(gridHelper);

camera.position.set(-10, 50, 120);
new OrbitControls(camera, renderer.domElement);

const ant_geomerty = new THREE.SphereGeometry(3)
const ant_material = new THREE.MeshBasicMaterial({ color: 0xAA2200 })
const ant = new THREE.Mesh(ant_geomerty, ant_material);
ant.position.set(-44.5, 3, 44.5);
scene.add(ant);

const food_geometry = new THREE.ConeGeometry(3, 6);
const foot_material = new THREE.MeshBasicMaterial({ color: 0x55AA00 })
const food = new THREE.Mesh(food_geometry, foot_material);
food.position.set(44.5, 3.1, -44.5);
scene.add(food);

function move(i, j, obj) {
    obj.position.x = -44.5 + i * 10;
    obj.position.z = 44.5 - j * 10;
}

function animate() {
    renderer.render(scene, camera);
}

const grid = Array(10);
for (let i = 0; i < 10; i++) {
    const row = Array(10);
    for (let j = 0; j < 10; j++) {
        row[j] = 1;
    }
    grid[i] = row;
}

const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1],  // Horizontal and Vertical
    [-1, -1], [-1, 1], [1, -1], [1, 1]  // Diagonal
];

function choose(_i, _j) {
    const options = [];
    const options_dirs = [];
    let sum = 0;

    for (const dir of directions) {
        let x = dir[0] + _i;
        let y = dir[1] + _j;

        if (x >= 0 && x < 10 && y >= 0 && y < 10) {
            options_dirs.push([x, y]);
            sum += grid[x][y];
            options.push(sum);
        }
    }
    let idx = 0;
    const ticket = Math.floor(Math.random() * sum);
    while (options[idx] < ticket) {
        idx++;
    }

    const [chosen_x, chosen_y] = options_dirs[idx];
    i = chosen_x;
    j = chosen_y;

    move(chosen_x, chosen_y, ant);
}

let i = 0, j = 0;
addEventListener('keydown', (e) => {
    const key = e.key.toLocaleLowerCase();
    console.log(key)

    switch (key) {
        case 'arrowright':
            i = Math.min(9, i + 1);
            break;
        case 'arrowleft':
            i = Math.max(0, i - 1);
            break;
        case 'arrowup':
            j = Math.min(9, j + 1);
            break;
        case 'arrowdown':
            j = Math.max(0, j - 1);
            break;
        case ' ':
            choose(i, j);

    }
    move(i, j, ant);
})
