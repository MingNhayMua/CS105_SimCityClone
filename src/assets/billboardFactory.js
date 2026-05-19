import * as THREE from 'three'

export function createBillboard(texture) {
    const group = new THREE.Group();

    const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.7, 8),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    pole.position.y = 0.35;
    pole.castShadow = true;
    group.add(pole);

    // Backing frame — sits behind the board
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.54, 0.03),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    frame.position.y = 0.8;
    frame.position.z = 0;
    frame.castShadow = true;
    group.add(frame);

    // Front board — image facing front (+Z)
    const boardFront = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.5),
        new THREE.MeshLambertMaterial({ map: texture })
    );
    boardFront.position.y = 0.8;
    boardFront.position.z = 0.016;
    boardFront.castShadow = true;
    group.add(boardFront);

    // Back board — image facing back (-Z)
    const boardBack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.5),
        new THREE.MeshLambertMaterial({ map: texture })
    );
    boardBack.position.y = 0.8;
    boardBack.position.z = -0.016;
    boardBack.rotation.y = Math.PI; // Flip to face the other way
    boardBack.castShadow = true;
    group.add(boardBack);

    const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.05, 0.2),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    base.position.y = 0.025;
    group.add(base);

    return group;
}
