import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

const _default_size = 10;

const tile_size = 10;
const half_tile = 5;
const _plane_geomety = new THREE.PlaneGeometry(10, 10);
const _edge_geometry = new THREE.EdgesGeometry(_plane_geomety);
const _edge_material = new THREE.LineBasicMaterial({ color: 0xffffff })
const _loader = new GLTFLoader();

export const config = {
    grid_size: _default_size,
    anthill_pos: { i: 0, j: 0 },
    food_pos: { i: _default_size - 1, j: _default_size - 1 },
    ants_number: 30,
}

export function grid2world(i, j, position) {
    position.x = -(half_tile + i * tile_size);
    position.z = half_tile + j * tile_size;
}

export function load_model(url) {
    return new Promise((resolve, reject) => {
        _loader.load(
            url,
            function (gltf) {
                resolve(gltf.scene);
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.log('An error happened', error);
                reject(error);
            }
        );
    });
}



export function build_plane(plane) {
    if (!(plane instanceof THREE.Group)) {
        throw new Error("Plane expected to be THREE.Group, got " + typeof plane);
    }

    if (plane.children?.length > 0) {
        plane.children.forEach(group => {
            group.children.forEach(mesh => {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) mesh.material.dispose();
            });
        });
    }

    for (let i = 0; i < config.grid_size; i++) {
        for (let j = 0; j < config.grid_size; j++) {
            const _plane_material = new THREE.MeshPhongMaterial({
                color: 'hsl(28, 100.0%, 30.00%)',
                side: THREE.DoubleSide,
                shininess: 0
            });

            const tile = new THREE.Mesh(_plane_geomety, _plane_material);
            tile.rotation.x = -Math.PI * 0.5;
            grid2world(i, j, tile.position);


            const edge = new THREE.LineSegments(_edge_geometry, _edge_material);
            edge.position.copy(tile.position);
            edge.position.y += 0.01;
            edge.rotation.copy(tile.rotation);

            const group = new THREE.Group();
            group.add(tile);
            group.add(edge);
            plane.add(group);
        }
    }

    return plane;
}