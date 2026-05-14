import { createCityScene } from './scene.js';
import { createCity } from './city.js';
import { typeLabels } from './utils.js';
import { hideInfoOverlay, showInfoOverlay } from './ui/infoPanel.js';

export async function createGame() {
    let activeToolID = 'mouse';
    let paused = false;
    let intervalId = null;
    let selectedLandmarkId = null;
    const scene = createCityScene();

    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.getElementById('loading-text');

    await scene.preloadModels((loaded, total) => {
        const pct = Math.round((loaded / total) * 100);
        if (loadingBar) loadingBar.style.width = pct + '%';
        if (loadingText) loadingText.textContent = `Loading models... ${loaded}/${total}`;
    });

    if (loadingOverlay) loadingOverlay.classList.add('hidden');

    const city = createCity(16);
    scene.initialize(city);

    // ==========================================
    // Tool Actions
    // ==========================================

    /**
     * Applies the currently active tool on the selected object's tile.
     * @param {THREE.Object3D|undefined} selectedObject - The raycasted object
     */
    function useActiveTool(selectedObject) {
        if (!selectedObject) return;

        // Check if clicking on a landmark first
        const landmarkObj = scene.findLandmarkAncestor(selectedObject);
        if (activeToolID === 'bulldoze' && landmarkObj) {
            scene.removeLandmark(landmarkObj);
            hideInfoOverlay();
            return;
        }

        const { x, y } = selectedObject.userData;
        const tile = city.data[x][y];

        if (activeToolID === 'bulldoze') {
            tile.removeBuilding(city);
            tile.terrainID = 'grass';
            scene.update(city);
        } else if (activeToolID === 'road') {
            tile.removeBuilding(city);
            tile.terrainID = 'road';
            scene.update(city);
        } else if (activeToolID === 'landmark') {
            if (selectedLandmarkId) {
                scene.placeLandmark(selectedLandmarkId, x, y);
            }
        } else if (activeToolID.startsWith('zone-')) {
            const zoneType = activeToolID.replace('zone-', '');
            tile.placeBuilding(zoneType);
            scene.update(city);
        }

        if (activeToolID !== 'mouse') {
            hideInfoOverlay();
        }
    }

    /**
     * Sets the active tool and syncs with the scene.
     * @param {string} toolID - The tool identifier (e.g. 'mouse', 'bulldoze', 'zone-residential')
     */
    function setActiveToolID(toolID) {
        activeToolID = toolID;
        scene.setActiveToolID(toolID);
    }

    // ==========================================
    // Event Handlers
    // ==========================================

    /**
     * Handles mouse down — raycasts and applies tool on left click.
     * @param {MouseEvent} event
     */
    scene.onObjectSelected = function (object) {
        useActiveTool(object);

        if (activeToolID === 'mouse') {
            if (object) {
                const { x, y } = object.userData;
                const tile = city.data[x][y];
                showInfoOverlay(tile);
            } else {
hideInfoOverlay();
            }
        }
    }

    document.addEventListener('mousedown', scene.onMouseDown, false);
    document.addEventListener('mouseup', scene.onMouseUp, false);
    document.addEventListener('mousemove', scene.onMouseMove, false);
    document.addEventListener('wheel', scene.onWheel, { passive: false });
    document.addEventListener('contextmenu', scene.onContextMenu, false);

    // ==========================================
    // Game Loop
    // ==========================================

    /**
     * Runs a single game update tick: advances city state and syncs the scene.
     */
    function update() {
        city.update();
        scene.update(city);
        updateTitleBar();
    }

    /**
     * Starts the game loop interval (1 tick per second).
     */
    function startLoop() {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(update, 1000);
    }

    /**
     * Toggles the game between paused and running states.
     */
    function togglePause() {
        paused = !paused;
        if (paused) {
            clearInterval(intervalId);
            intervalId = null;
            scene.dayNightCycle.pause();
            scene.vehiclesPaused = true;
        } else {
            startLoop();
            scene.dayNightCycle.resume();
            scene.vehiclesPaused = false;
        }
    }

    /**
     * Returns whether the game is currently paused.
     * @returns {boolean}
     */
    function isPaused() {
        return paused;
    }

    function updateTitleBar() {
        document.getElementById('balance-value').innerHTML = city.getBalance();
        document.getElementById('population-value').innerHTML = city.getPopulation();

        const timeEl = document.getElementById('time-value');
        const iconEl = document.getElementById('time-icon');
        if (timeEl) timeEl.textContent = scene.dayNightCycle.getTimeString();
        if (iconEl) iconEl.textContent = scene.dayNightCycle.getTimeIcon();
    }

    function showInfoOverlay(tile) {
        const html = tile.toHTML();
        if (!html) {
            hideInfoOverlay();
            return;
        }

        showInfoOverlay({
            title: typeLabels[tile.building.type] || tile.building.type,
            html
        });
    }

    // ==========================================
    // Initialize & Return Public API
    // ==========================================

    startLoop();
    scene.start();

    return {
        update,
        setActiveToolID,
        togglePause,
        isPaused,
        timeSpeed: 1,
        setTimeSpeed(speed) {
            this.timeSpeed = speed;
            scene.dayNightCycle.timeScale = speed;
        },
        setSelectedLandmark(id) { selectedLandmarkId = id; },
        setTransformMode(mode) { scene.setTransformControlsMode(mode); },
    }
}