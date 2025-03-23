import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { config, grid2world, load_model, build_plane } from "./src/utils";
import * as ACO from "./src/aco";

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-20, 65, -40);

const controls = new OrbitControls(camera, renderer.domElement);
grid2world(config.grid_size / 2, config.grid_size / 2, controls.target)
controls.update();


const axesHelper = new THREE.AxesHelper(100);
axesHelper.position.y = 0.1
scene.add(axesHelper);

const ambient_light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambient_light);

const point_light = new THREE.PointLight(0xffffff, 20, 500, 0);
point_light.position.set(0, 30, 0);
scene.add(point_light);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const intersects = [];


const plane = new THREE.Group();
build_plane(plane, config.grid_size);
scene.add(plane);

const ant_model = await load_model("public/ant.glb");
const _food = new THREE.Mesh(
    new THREE.ConeGeometry(3, 6),
    new THREE.MeshBasicMaterial({ color: 0x55AA00 })
);

ACO.set(scene, ant_model, _food, plane);


function animate() {
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();

    if (key == 'enter') {
        ACO.step();
    }
});

addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    intersects.length = 0;
    raycaster.intersectObjects(plane.children, true, intersects);
})

addEventListener('pointerup', () => {
    for (let i = 0; i < intersects.length; i++) {
        intersects[i].object.parent.visible = !intersects[i].object.parent.visible;
    }
});
