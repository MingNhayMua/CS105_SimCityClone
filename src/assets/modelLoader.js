import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { atlasTexture } from './textures.js';
import { BUILDING_CATALOG, TILE_CATALOG, VEHICLE_CATALOG, pickVehicleModel } from './assetCatalog.js';
import { LANDMARK_CATALOG } from './landmarkCatalog.js';

const gltfLoader = new GLTFLoader();
const modelCache = new Map();

export async function loadModel(path) {
    if (modelCache.has(path)) {
        return modelCache.get(path).clone();
    }
    const gltf = await gltfLoader.loadAsync(`/models/${path}`);
    const model = gltf.scene;

    model.traverse(child => {
        if (child.isMesh && child.material) {
            child.material = new THREE.MeshLambertMaterial({
                map: atlasTexture,
            });
            child.receiveShadow = true;
            child.castShadow = true;
        }
    });

    model.scale.set(1 / 30, 1 / 30, 1 / 30);

    modelCache.set(path, model);
    return model.clone();
}

export function getCachedModel(path) {
    return modelCache.get(path) || null;
}

function preloadPathList() {
    const paths = [];
    paths.push(TILE_CATALOG.grass.file);
    for (const r of TILE_CATALOG.road) {
        paths.push(r.file);
    }
    for (const zone of Object.values(BUILDING_CATALOG)) {
        for (const entry of zone) {
            paths.push(entry.file);
        }
    }
    for (const cat of Object.values(VEHICLE_CATALOG)) {
        for (const id of cat) {
            paths.push(`vehicles/${id}.glb`);
        }
    }
    for (const landmark of LANDMARK_CATALOG) {
        paths.push(landmark.file);
    }
    return [...new Set(paths)];
}

export async function preloadModels(onProgress) {
    const paths = preloadPathList();
    let loaded = 0;
    const batchSize = 4;
    for (let i = 0; i < paths.length; i += batchSize) {
        const batch = paths.slice(i, i + batchSize);
        await Promise.all(batch.map(async (path) => {
            try {
                await loadModel(path);
            } catch (e) {
                console.warn(`Failed to preload ${path}:`, e.message);
            }
        }));
        loaded += batch.length;
        if (onProgress) onProgress(loaded, paths.length);
    }
}

export function getVehicleModel() {
    const vehicleId = pickVehicleModel();
    const path = `vehicles/${vehicleId}.glb`;
    const cached = modelCache.get(path);
    if (!cached) return null;
    return cached.clone();
}