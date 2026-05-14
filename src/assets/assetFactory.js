import * as THREE from 'three';
import { getCachedModel, loadModel } from './modelLoader.js';
import { grassTexture, zoneTextures, roadColor } from './textures.js';
import { getRoadConfig, getBuildingRotation } from './roadHelper.js';
import { createConstructionSite } from './constructionSite.js';
import { pickBuildingModel, pickVehicleModel } from './assetCatalog.js';
import { getVehicleModel } from './modelLoader.js';

const MODEL_SCALE = 1 / 30;
const MAX_FOOTPRINT = 0.95;
const SMALL_BUILDING_SCALE = 1.4;
const LARGE_BUILDING_SCALE = 2.0;
const VEHICLE_SCALE = 1.2;

const Geometry = new THREE.BoxGeometry(1, 1, 1);

function randomFromTextures(textures) {
    return textures[Math.floor(Math.random() * textures.length)];
}

function createTileMesh(modelPath, x, y, rotation, id) {
    const cached = getCachedModel(modelPath);
    if (!cached) return null;

    const mesh = cached.clone();
    mesh.userData = { id, x, y };
    mesh.position.set(x, 0, y);
    mesh.rotation.y = rotation || 0;
    return mesh;
}

function createZoneMeshFallback(x, y, data, city) {
    const textures = zoneTextures[data.type];
    const srcTexture = randomFromTextures(textures);
    const height = data?.height || 0;

    if (height === 0) {
        return createConstructionSite(x, y, data, city);
    }

    const group = new THREE.Group();
    group.userData = { id: data.type, x, y };

    const isAbandoned = data.abandoned === true;

    const baseMaterial = new THREE.MeshLambertMaterial({
        color: isAbandoned ? 0x1a1a1a : 0x222222
    });
    const base = new THREE.Mesh(Geometry, baseMaterial);
    base.scale.set(0.8, 0.1, 0.8);
    base.position.set(0, 0.05, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    if (height > 0) {
        const sideTexture = srcTexture.clone();
        sideTexture.needsUpdate = true;
        sideTexture.repeat.set(1, height);
        sideTexture.wrapS = THREE.RepeatWrapping;
        sideTexture.wrapT = THREE.RepeatWrapping;

        const tint = isAbandoned ? 0x555555 : 0xffffff;
        const sideMaterial = new THREE.MeshLambertMaterial({ map: sideTexture, color: tint });

        const topMaterial = new THREE.MeshLambertMaterial({
            color: isAbandoned ? 0x333333 : 0x555555
        });
        const materialArray = [
            sideMaterial,
            sideMaterial,
            topMaterial,
            topMaterial,
            sideMaterial,
            sideMaterial,
        ];
        const building = new THREE.Mesh(Geometry, materialArray);
        building.scale.set(0.8, height, 0.8);
        building.position.set(0, 0.1 + height / 2, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
    }

    group.position.set(x, 0, y);
    group.rotation.y = getBuildingRotation(x, y, city);
    return group;
}

function createZoneMesh(x, y, data, city) {
    const height = data?.height || 0;

    if (height === 0) {
        return createConstructionSite(x, y, data, city);
    }

    const modelInfo = pickBuildingModel(data.type, height);
    if (modelInfo) {
        const cached = getCachedModel(modelInfo.file);
        if (cached) {
            return createBuildingMeshFromModel(cached, modelInfo.file, x, y, data, city);
        }

        loadModel(modelInfo.file).then(() => {
            data.updated = true;
        }).catch(() => {});
    }

    return createZoneMeshFallback(x, y, data, city);
}

function createBuildingMeshFromModel(cachedModel, modelFile, x, y, data, city) {
    const inner = cachedModel.clone();

    const tier = data?.height || 1;
    const DESIRED_SCALE = tier <= 1 ? SMALL_BUILDING_SCALE : LARGE_BUILDING_SCALE;
    const MAX_FP = MAX_FOOTPRINT;

    const s = inner.scale;
    inner.scale.set(s.x * DESIRED_SCALE, s.y * DESIRED_SCALE, s.z * DESIRED_SCALE);

    const box = new THREE.Box3().setFromObject(inner);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxHoriz = Math.max(size.x, size.z);
    if (maxHoriz > MAX_FP) {
        const clamp = MAX_FP / maxHoriz;
        inner.scale.multiplyScalar(clamp);
        box.setFromObject(inner);
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    inner.position.set(-center.x, -box.min.y, -center.z);

    inner.traverse(child => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            child.userData = { id: data.type, x, y };
        }
    });

    if (data.abandoned) {
        inner.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.color = new THREE.Color(0x555555);
            }
        });
    }

    const wrapper = new THREE.Group();
    wrapper.userData = { id: data.type, x, y, modelFile };
    wrapper.add(inner);
    wrapper.position.set(x, 0, y);
    wrapper.rotation.y = getBuildingRotation(x, y, city);

    return wrapper;
}

function createVehicleMesh(x, y, rotation, vehicleModel, city) {
    const modelPath = `vehicles/${vehicleModel}.glb`;
    const cached = getCachedModel(modelPath);
    if (cached) {
        const inner = cached.clone();
        inner.scale.set(
            inner.scale.x * VEHICLE_SCALE,
            inner.scale.y * VEHICLE_SCALE,
            inner.scale.z * VEHICLE_SCALE
        );
        const box = new THREE.Box3().setFromObject(inner);
        const center = new THREE.Vector3();
        box.getCenter(center);
        inner.position.set(-center.x, -box.min.y, -center.z);
        inner.traverse(child => {
            if (child.isMesh && child.material) {
                child.material = child.material.clone();
                child.userData = { id: 'vehicle', x, y };
            }
        });
        const wrapper = new THREE.Group();
        wrapper.userData = { id: 'vehicle', x, y };
        wrapper.add(inner);
        wrapper.position.set(x, 0, y);
        wrapper.rotation.y = Math.PI / 2;
        return wrapper;
    }
    loadModel(modelPath).then(() => {}).catch(() => {});
    const vehicleMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const placeholder = new THREE.Mesh(Geometry, vehicleMaterial);
    placeholder.userData = { id: 'vehicle', x, y };
    placeholder.position.set(x, 0.15, y);
    placeholder.scale.set(0.3, 0.15, 0.5);
    placeholder.castShadow = true;
    return placeholder;
}

const assets = {
    'grass': (x, y) => {
        const mesh = createTileMesh('tiles/tile-plain_grass.glb', x, y, 0, 'grass');
        if (mesh) return mesh;

        const material = new THREE.MeshLambertMaterial({ map: grassTexture });
        const cube = new THREE.Mesh(Geometry, material);
        cube.userData = { id: 'grass', x, y };
        cube.position.set(x, -0.5, y);
        cube.receiveShadow = true;
        return cube;
    },

    'residential': (x, y, data, city) => createZoneMesh(x, y, data, city),
    'commercial': (x, y, data, city) => createZoneMesh(x, y, data, city),
    'industrial': (x, y, data, city) => createZoneMesh(x, y, data, city),

    'road': (x, y, data, city) => {
        const config = getRoadConfig(x, y, city);
        const mesh = createTileMesh(config.path, x, y, config.rotation, 'road');
        if (mesh) return mesh;

        const material = new THREE.MeshLambertMaterial({ color: roadColor });
        const cube = new THREE.Mesh(Geometry, material);
        cube.userData = { id: 'road', x, y };
        cube.position.set(x, 0.01, y);
        cube.scale.set(1, 0.02, 1);
        cube.receiveShadow = true;
        return cube;
    },

    'water': (x, y) => {
        const material = new THREE.MeshLambertMaterial({ color: 0x2389da, transparent: true, opacity: 0.8 });
        const cube = new THREE.Mesh(Geometry, material);
        cube.userData = { id: 'water', x, y };
        cube.position.set(x, -0.3, y);
        cube.scale.set(1, 0.1, 1);
        cube.receiveShadow = true;
        return cube;
    },

    'park': (x, y) => {
        const material = new THREE.MeshLambertMaterial({ color: 0x2d7a2d });
        const cube = new THREE.Mesh(Geometry, material);
        cube.userData = { id: 'park', x, y };
        cube.position.set(x, -0.4, y);
        cube.receiveShadow = true;
        return cube;
    },

    'sidewalk': (x, y) => {
        const material = new THREE.MeshLambertMaterial({ color: 0x999999 });
        const cube = new THREE.Mesh(Geometry, material);
        cube.userData = { id: 'sidewalk', x, y };
        cube.position.set(x, 0.0, y);
        cube.scale.set(1, 0.05, 1);
        cube.receiveShadow = true;
        return cube;
    },

    'vehicle': (x, y, data, city) => {
        const model = data?.model || pickVehicleModel();
        return createVehicleMesh(x, y, Math.PI / 2, model, city);
    }
};

export function createAssetInstance(assetID, x, y, data, city) {
    if (assetID in assets) {
        return assets[assetID](x, y, data, city);
    } else {
        console.warn(`Asset not found: ${assetID}`);
        return undefined;
    }
}

export { getRoadConfig };