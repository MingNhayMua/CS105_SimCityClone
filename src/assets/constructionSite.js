import * as THREE from 'three';
import { constructionTexture } from './textures.js';
import { getBuildingRotation } from './roadHelper.js';

const Geometry = new THREE.BoxGeometry(1, 1, 1);

export function createConstructionSite(x, y, data, city) {
    const group = new THREE.Group();
    group.userData = { id: data.type, x, y };

    const groundMat = new THREE.MeshLambertMaterial({ map: constructionTexture });
    const ground = new THREE.Mesh(Geometry, groundMat);
    ground.scale.set(0.85, 0.04, 0.85);
    ground.position.set(0, 0.02, 0);
    ground.receiveShadow = true;
    group.add(ground);

    const yellowMat = new THREE.MeshLambertMaterial({ color: 0xCC8800 });
    const poleH = 2.2;

    const mast = new THREE.Mesh(Geometry, yellowMat);
    mast.scale.set(0.045, poleH, 0.045);
    mast.position.set(0.3, poleH / 2, 0.3);
    mast.castShadow = true;
    group.add(mast);

    const arm = new THREE.Mesh(Geometry, yellowMat);
    arm.scale.set(0.8, 0.035, 0.035);
    arm.position.set(0.3 - 0.36, poleH - 0.02, 0.3);
    arm.castShadow = true;
    group.add(arm);

    const counterWeight = new THREE.Mesh(Geometry, new THREE.MeshLambertMaterial({ color: 0x555555 }));
    counterWeight.scale.set(0.1, 0.12, 0.08);
    counterWeight.position.set(0.3 + 0.13, poleH - 0.08, 0.3);
    counterWeight.castShadow = true;
    group.add(counterWeight);

    const cableMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const cable = new THREE.Mesh(Geometry, cableMat);
    cable.scale.set(0.012, 0.9, 0.012);
    cable.position.set(0.3 - 0.72, poleH - 0.5, 0.3);
    group.add(cable);

    const hook = new THREE.Mesh(Geometry, new THREE.MeshLambertMaterial({ color: 0x888888 }));
    hook.scale.set(0.045, 0.045, 0.045);
    hook.position.set(0.3 - 0.72, poleH - 0.95, 0.3);
    group.add(hook);

    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
    const blockPositions = [
        [-0.15, 0.06, -0.25],
        [0.05, 0.06, -0.25],
        [0.25, 0.06, -0.25],
        [-0.05, 0.13, -0.22],
        [0.15, 0.13, -0.22],
    ];
    blockPositions.forEach(([bx, by, bz]) => {
        const block = new THREE.Mesh(Geometry, concreteMat);
        block.scale.set(0.14, 0.07, 0.1);
        block.position.set(bx, by, bz);
        block.castShadow = true;
        group.add(block);
    });

    const barrierMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
    const barrierPositions = [
        { x: 0, z: -0.38, rotY: 0, sx: 0.55, sz: 0.03 },
        { x: 0, z: 0.38, rotY: 0, sx: 0.55, sz: 0.03 },
        { x: -0.38, z: 0, rotY: Math.PI / 2, sx: 0.55, sz: 0.03 },
        { x: 0.38, z: 0, rotY: Math.PI / 2, sx: 0.55, sz: 0.03 },
    ];
    barrierPositions.forEach(b => {
        const barrier = new THREE.Mesh(Geometry, barrierMat);
        barrier.scale.set(b.sx, 0.04, b.sz);
        barrier.position.set(b.x, 0.06, b.z);
        barrier.rotation.y = b.rotY;
        group.add(barrier);
    });

    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    barrierPositions.forEach(b => {
        const stripe = new THREE.Mesh(Geometry, stripeMat);
        stripe.scale.set(0.08, 0.042, 0.032);
        stripe.position.set(b.x, 0.063, b.z);
        stripe.rotation.y = b.rotY;
        group.add(stripe);
    });

    const containerMat = new THREE.MeshLambertMaterial({ color: 0xCC3333 });
    const container = new THREE.Mesh(Geometry, containerMat);
    container.scale.set(0.22, 0.12, 0.14);
    container.position.set(-0.2, 0.1, 0.2);
    container.castShadow = true;
    group.add(container);

    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    for (let i = 0; i < 3; i++) {
        const pipe = new THREE.Mesh(Geometry, pipeMat);
        pipe.scale.set(0.03, 0.03, 0.3);
        pipe.position.set(0.28, 0.04, -0.15 + i * 0.08);
        group.add(pipe);
    }

    group.position.set(x, 0, y);
    group.rotation.y = getBuildingRotation(x, y, city);
    return group;
}