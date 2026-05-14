import * as THREE from 'three';

export function createCamera(gameWindow) {
    const DEG2GRAD = Math.PI / 180;
    const LEFT_MOUSE_BUTTON = 0;
    const MIDDLE_MOUSE_BUTTON = 1;
    const RIGHT_MOUSE_BUTTON = 2;

    const MIN_CAMERA_RADIUS = 3;
    const MAX_CAMERA_RADIUS = 40;
    const MIN_CAMERA_ELEVATION = 30;
    const MAX_CAMERA_ELEVATION = 90;

    const ROTATION_SENSITIVITY = 0.5;
    const ZOOM_SENSITIVITY = 0.02;
    const PAN_SENSITIVITY = -0.01;
    const SCROLL_ZOOM_SENSITIVITY = 0.05;

    const Y_AXIS = new THREE.Vector3(0, 1, 0);

    const camera = new THREE.PerspectiveCamera(
        75,
        gameWindow.offsetWidth / gameWindow.offsetHeight,
        0.1,
        1000
    );
    let cameraOrigin = new THREE.Vector3(8, 0, 8);
    let cameraRadius = 16;
    let cameraAzimuth = 45;
    let cameraElevation = 45;
    let isLeftMouseDown = false;
    let isRightMouseDown = false;
    let preMouseX = 0;
    let preMouseY = 0;
    let cameraEnabled = true;
    updateCameraPosition();

    function setEnabled(enabled) {
        cameraEnabled = enabled;
    }

    function onMouseDown(event) {
        if (!cameraEnabled) return;
        if (event.button === LEFT_MOUSE_BUTTON) {
            isLeftMouseDown = true;
        } else if (event.button === RIGHT_MOUSE_BUTTON) {
            isRightMouseDown = true;
        }
    }

    function onMouseUp(event) {
        if (event.button === LEFT_MOUSE_BUTTON) {
            isLeftMouseDown = false;
        } else if (event.button === RIGHT_MOUSE_BUTTON) {
            isRightMouseDown = false;
        }
    }

    function onMouseMove(event) {
        if (!cameraEnabled) { preMouseX = event.clientX; preMouseY = event.clientY; return; }
        const deltaX = event.clientX - preMouseX;
        const deltaY = event.clientY - preMouseY;

        if (isLeftMouseDown) {
            cameraAzimuth += -(deltaX * ROTATION_SENSITIVITY);
            cameraElevation += (deltaY * ROTATION_SENSITIVITY);
            cameraElevation = Math.max(MIN_CAMERA_ELEVATION, Math.min(MAX_CAMERA_ELEVATION, cameraElevation));
            updateCameraPosition();
        }

        if (isRightMouseDown) {
            const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(Y_AXIS, cameraAzimuth * DEG2GRAD);
            const left = new THREE.Vector3(1, 0, 0).applyAxisAngle(Y_AXIS, cameraAzimuth * DEG2GRAD);
            cameraOrigin.add(forward.multiplyScalar(deltaY * PAN_SENSITIVITY));
            cameraOrigin.add(left.multiplyScalar(deltaX * PAN_SENSITIVITY));
            updateCameraPosition();
        }

        preMouseX = event.clientX;
        preMouseY = event.clientY;
    }

    function onWheel(event) {
        if (!cameraEnabled) return;
        event.preventDefault();
        cameraRadius += event.deltaY * SCROLL_ZOOM_SENSITIVITY;
        cameraRadius = Math.min(MAX_CAMERA_RADIUS, Math.max(MIN_CAMERA_RADIUS, cameraRadius));
        updateCameraPosition();
    }

    function onContextMenu(event) {
        event.preventDefault();
    }

    function updateCameraPosition() {
        camera.position.x = cameraRadius * Math.sin(cameraAzimuth * DEG2GRAD) * Math.cos(cameraElevation * DEG2GRAD);
        camera.position.z = cameraRadius * Math.cos(cameraAzimuth * DEG2GRAD) * Math.cos(cameraElevation * DEG2GRAD);
        camera.position.y = cameraRadius * Math.sin(cameraElevation * DEG2GRAD);
        camera.position.add(cameraOrigin);
        camera.lookAt(cameraOrigin);
        camera.updateMatrix();
    }

    return {
        camera,
        setEnabled,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onWheel,
        onContextMenu
    };
}