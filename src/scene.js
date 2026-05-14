import * as THREE from 'three'
import { createCamera } from './camera.js'
import { createAssetInstance } from './assets/assetFactory.js'
import { preloadModels, getCachedModel } from './assets/modelLoader.js'
import { getRoadConfig } from './assets/roadHelper.js'
import { VehicleGraph } from './vehicles/vehicleGraph.js'
import { createDayNightCycle } from './simulation/dayNightCycle.js'
import { LANDMARK_CATALOG } from './assets/landmarkCatalog.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'

export function createCityScene() {
    const gameWindow = document.getElementById("render-target")
    const scene = new THREE.Scene()

    scene.background = new THREE.Color(0xddeeff);

    const camera = createCamera(gameWindow);

    const renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(gameWindow.offsetWidth, gameWindow.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameWindow.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedObject = undefined;
    let hoverObject = null;
    let activeToolID = 'mouse';
    let isLeftMouseDown = false;

    let terrain = [];
    let buildings = [];
    let vehicleGraph = null;
    let landmarks = [];

    let onObjectSelected = undefined;

    let sun = null;
    let ambientLight = null;
    let vehiclesPaused = false;
    const dayNightCycle = createDayNightCycle();

    const hoverMaterial = new THREE.MeshLambertMaterial({
        color: 0xaaaaaa, transparent: true, opacity: 0.5
    });
    const hoverGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);

    // TransformControls
    const transformControls = new TransformControls(camera.camera, renderer.domElement);
    let transformTarget = null;

    transformControls.addEventListener('dragging-changed', (event) => {
        camera.setEnabled(!event.value);
    });

    transformControls.addEventListener('change', () => {
        if (transformTarget) {
            updateTransformUI(transformTarget);
        }
    });

    // ==========================================
    // City data sync
    // ==========================================

    function initialize(city) {
        scene.clear();
        setupLighting();
        terrain = [];
        buildings = [];
        landmarks = [];

        // TransformControls
        scene.add(transformControls);

        // Vehicle graph
        vehicleGraph = new VehicleGraph(city.size);
        vehicleGraph.traverse(obj => { obj.raycast = () => {}; });
        scene.add(vehicleGraph);

        for (let x = 0; x < city.size; x++) {
            const column = [];
            const buildingColumn = new Array(city.size).fill(null);
            for (let y = 0; y < city.size; y++) {
                const tile = city.data[x][y];
                const terrainID = tile.terrainID;

                const cube = createAssetInstance(terrainID, x, y, null, city);
                scene.add(cube);
                column.push(cube);

                if (tile.building) {
                    const building = createAssetInstance(tile.building.type, x, y, tile.building, city);
                    scene.add(building);
                    buildingColumn[y] = building;
                }
            }
            terrain.push(column);
            buildings.push(buildingColumn);
        }
    }

    function refreshAdjacentRoads(city, x, y) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < city.size && ny >= 0 && ny < city.size) {
                if (city.data[nx][ny].terrainID === 'road') {
                    scene.remove(terrain[nx][ny]);
                    const newRoad = createAssetInstance('road', nx, ny, null, city);
                    scene.add(newRoad);
                    terrain[nx][ny] = newRoad;

                    if (vehicleGraph) {
                        const cfg = getRoadConfig(nx, ny, city);
                        vehicleGraph.updateTile(nx, ny, { rotation: { y: cfg.rotation }, style: cfg.style });
                    }
                }
            }
        }
    }

    function update(city) {
        for (let x = 0; x < city.size; x++) {
            for (let y = 0; y < city.size; y++) {
                const tile = city.data[x][y];
                const existingBuildingMesh = buildings[x][y];
                const currentTerrainID = terrain[x][y]?.userData?.id;
                const newTerrainID = tile.terrainID;

                if (newTerrainID !== currentTerrainID) {
                    scene.remove(terrain[x][y]);
                    const newTerrain = createAssetInstance(newTerrainID, x, y, null, city);
                    scene.add(newTerrain);
                    terrain[x][y] = newTerrain;

                    refreshAdjacentRoads(city, x, y);

                    if (vehicleGraph) {
                        const roadConfig = getRoadConfig(x, y, city);
                        const road = (newTerrainID === 'road')
                            ? { rotation: { y: roadConfig.rotation }, style: roadConfig.style }
                            : null;
                        vehicleGraph.updateTile(x, y, road);
                    }
                }

                if (existingBuildingMesh && !tile.building) {
                    scene.remove(existingBuildingMesh);
                    buildings[x][y] = null;
                }

                if (tile.building && (tile.building.updated || !existingBuildingMesh)) {
                    if (existingBuildingMesh) {
                        scene.remove(existingBuildingMesh);
                    }
                    const buildingMesh = createAssetInstance(tile.building.type, x, y, tile.building, city);
                    scene.add(buildingMesh);
                    buildings[x][y] = buildingMesh;
                    tile.building.updated = false;
                }
            }
        }
    }

    // ==========================================
    // Lighting
    // ==========================================

    function setupLighting() {
        sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(20, 20, 20);
        sun.target.position.set(8, 0, 8);
        sun.castShadow = true;
        sun.shadow.camera.left = -40;
        sun.shadow.camera.right = 40;
        sun.shadow.camera.top = 40;
        sun.shadow.camera.bottom = -40;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 100;
        scene.add(sun);
        scene.add(sun.target);

        ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);
    }

    // ==========================================
    // Landmark placement
    // ==========================================

    function placeLandmark(landmarkId, x, y) {
        const entry = LANDMARK_CATALOG.find(l => l.id === landmarkId);
        if (!entry) return;

        const cached = getCachedModel(entry.file);
        if (!cached) return;

        const model = cached.clone();

        // Scale up landmarks to be bigger — landmark-specific scale
        const LANDMARK_SCALE = 1.5;
        model.scale.set(
            model.scale.x * LANDMARK_SCALE,
            model.scale.y * LANDMARK_SCALE,
            model.scale.z * LANDMARK_SCALE
        );

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.set(-center.x, -box.min.y, -center.z);

        const wrapper = new THREE.Group();
        wrapper.userData = {
            id: 'landmark',
            landmarkId: entry.id,
            landmarkName: entry.name,
            x, y
        };
        wrapper.add(model);
        wrapper.position.set(x, 0, y);

        // Landmarks should span ~3 tiles wide
        const LANDMARK_FOOTPRINT = 3.0;
        const newSize = new THREE.Vector3();
        const newBox = new THREE.Box3().setFromObject(model);
        newBox.getSize(newSize);
        const newMaxDim = Math.max(newSize.x, newSize.z);
        if (newMaxDim > LANDMARK_FOOTPRINT) {
            const clamp = LANDMARK_FOOTPRINT / newMaxDim;
            wrapper.scale.set(clamp, clamp, clamp);
        }

        scene.add(wrapper);
        landmarks.push(wrapper);
    }

    function findLandmarkAncestor(object) {
        while (object) {
            if (object.userData?.id === 'landmark') return object;
            object = object.parent;
        }
        return null;
    }

    // ==========================================
    // TransformControls
    // ==========================================

    function attachTransform(object) {
        transformTarget = object;
        transformControls.attach(object);
        updateTransformUI(object);
    }

    function detachTransform() {
        transformTarget = null;
        transformControls.detach();
    }

    function removeLandmark(object) {
        const idx = landmarks.indexOf(object);
        if (idx === -1) return;
        if (transformTarget === object) {
            detachTransform();
            document.getElementById('transform-bar')?.classList.add('hidden');
        }
        scene.remove(object);
        landmarks.splice(idx, 1);
    }

    function setTransformControlsMode(mode) {
        transformControls.setMode(mode);
    }

    function updateTransformUI(object) {
        const pos = object.position;
        const rot = object.rotation;
        const scl = object.scale;

        const posEl = document.getElementById('tf-pos');
        const rotEl = document.getElementById('tf-rot');
        const sclEl = document.getElementById('tf-scale');

        if (posEl) posEl.textContent = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        if (rotEl) rotEl.textContent = `${(rot.y * 180 / Math.PI).toFixed(0)}°`;
        if (sclEl) sclEl.textContent = `${scl.x.toFixed(2)}`;
    }

    // ==========================================
    // Render loop
    // ==========================================

    function draw() {
        if (sun && ambientLight) {
            dayNightCycle.update(scene, sun, ambientLight);
        }

        if (!vehiclesPaused && vehicleGraph) {
            vehicleGraph.updateVehicles();
        }
        renderer.render(scene, camera.camera);
    }

    function start() {
        renderer.setAnimationLoop(draw);
    }

    function stop() {
        renderer.setAnimationLoop(null);
    }

    // ==========================================
    // Raycasting helpers
    // ==========================================

    function updateRaycaster(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera.camera);
        return raycaster.intersectObjects(scene.children, true);
    }

    function findAncestorWithUserData(object, key) {
        while (object && object.userData?.[key] === undefined) {
            object = object.parent;
        }
        return object?.userData?.[key] !== undefined ? object : undefined;
    }

    function raycastObject(event) {
        const intersections = updateRaycaster(event);
        if (intersections.length > 0) {
            return findAncestorWithUserData(intersections[0].object, 'id');
        }
        return undefined;
    }

    function raycastTile(event) {
        const intersections = updateRaycaster(event);
        if (intersections.length > 0) {
            return findAncestorWithUserData(intersections[0].object, 'x');
        }
        return undefined;
    }

    function isPlacementTool() {
        return activeToolID !== 'mouse';
    }

    // ==========================================
    // Event handlers
    // ==========================================

    function onMouseDown(event) {
        if (transformControls.dragging) return;

        if (event.button === 0 && isPlacementTool()) {
            isLeftMouseDown = true;
        } else {
            camera.onMouseDown(event);
        }

        selectedObject = raycastObject(event) || null;

        if (activeToolID === 'mouse' && selectedObject) {
            const landmarkObj = findLandmarkAncestor(selectedObject);
            if (landmarkObj) {
                attachTransform(landmarkObj);
                document.getElementById('transform-bar')?.classList.remove('hidden');
            } else {
                detachTransform();
                document.getElementById('transform-bar')?.classList.add('hidden');
            }
        }

        if (onObjectSelected) {
            onObjectSelected(selectedObject);
        }
    }

    function onMouseUp(event) {
        if (event.button === 0 && isLeftMouseDown) {
            isLeftMouseDown = false;
        } else {
            camera.onMouseUp(event);
        }
    }

    function onMouseMove(event) {
        if (!isLeftMouseDown) {
            camera.onMouseMove(event);
        }

        if (hoverObject) {
            scene.remove(hoverObject);
            hoverObject = null;
        }

        const obj = raycastTile(event);
        if (obj) {
            const { x, y } = obj.userData;

            if (isLeftMouseDown && onObjectSelected) {
                onObjectSelected(obj);
            }

            if (activeToolID !== 'bulldoze' && activeToolID !== 'road' && activeToolID !== 'mouse') {
                const hasBuildingMesh = buildings[x] && buildings[x][y];
                if (!hasBuildingMesh) {
                    hoverObject = new THREE.Mesh(hoverGeometry, hoverMaterial);
                    hoverObject.position.set(x, 0.15, y);
                    scene.add(hoverObject);
                }
            }
        }
    }

    function setActiveToolID(toolID) {
        activeToolID = toolID;
        if (hoverObject) {
            scene.remove(hoverObject);
            hoverObject = null;
        }
        if (toolID !== 'mouse') {
            detachTransform();
            document.getElementById('transform-bar')?.classList.add('hidden');
        }
    }

    function onWheel(event) {
        camera.onWheel(event);
    }

    function onContextMenu(event) {
        camera.onContextMenu(event);
    }

    // ==========================================
    // Keyboard shortcuts for T/R/S/Escape
    // ==========================================

    document.addEventListener('keydown', (e) => {
        if (!transformTarget) return;
        switch (e.key.toLowerCase()) {
            case 't': setTransformControlsMode('translate'); updateTransformBtns('translate'); break;
            case 'r': setTransformControlsMode('rotate'); updateTransformBtns('rotate'); break;
            case 's': setTransformControlsMode('scale'); updateTransformBtns('scale'); break;
            case 'escape':
                detachTransform();
                document.getElementById('transform-bar')?.classList.add('hidden');
                break;
        }
    });

    function updateTransformBtns(mode) {
        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-tf-${mode}`)?.classList.add('active');
    }

    // ==========================================
    // Handle window resize
    // ==========================================

    window.addEventListener('resize', () => {
        camera.camera.aspect = gameWindow.offsetWidth / gameWindow.offsetHeight;
        camera.camera.updateProjectionMatrix();
        renderer.setSize(gameWindow.offsetWidth, gameWindow.offsetHeight);
    });

    // ==========================================
    // Public API
    // ==========================================

    return {
        initialize,
        get onObjectSelected() {
            return onObjectSelected;
        },
        set onObjectSelected(callback) {
            onObjectSelected = callback;
        },
        update,
        setActiveToolID,
        start,
        stop,
        onMouseDown,
        onMouseUp,
        onMouseMove,
        onWheel,
        onContextMenu,
        preloadModels,
        dayNightCycle,
        set vehiclesPaused(v) { vehiclesPaused = v; },
        placeLandmark,
        attachTransform,
        detachTransform,
        removeLandmark,
        findLandmarkAncestor,
        setTransformControlsMode,
    }
}