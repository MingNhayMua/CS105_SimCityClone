import * as THREE from 'three';
import config from '../config.js';

const SKY_TABLE = [
    { time: 0.0,  sky: new THREE.Color(0x0c1445), sun: new THREE.Color(0x1a2255), ambient: new THREE.Color(0x1a1a3a) },
    { time: 0.2,  sky: new THREE.Color(0x0e1850), sun: new THREE.Color(0x1a2255), ambient: new THREE.Color(0x1a1a3a) },
    { time: 0.25, sky: new THREE.Color(0x2a4070), sun: new THREE.Color(0x5577aa), ambient: new THREE.Color(0x334466) },
    { time: 0.3,  sky: new THREE.Color(0x6699cc), sun: new THREE.Color(0x99bbdd), ambient: new THREE.Color(0x6688aa) },
    { time: 0.35, sky: new THREE.Color(0xaaccee), sun: new THREE.Color(0xddeeff), ambient: new THREE.Color(0xbbccdd) },
    { time: 0.5,  sky: new THREE.Color(0xddeeff), sun: new THREE.Color(0xffffff), ambient: new THREE.Color(0xffffff) },
    { time: 0.65, sky: new THREE.Color(0xddeeff), sun: new THREE.Color(0xffffff), ambient: new THREE.Color(0xffffff) },
    { time: 0.7,  sky: new THREE.Color(0x8899bb), sun: new THREE.Color(0x99aacc), ambient: new THREE.Color(0x7788aa) },
    { time: 0.75, sky: new THREE.Color(0x445577), sun: new THREE.Color(0x667799), ambient: new THREE.Color(0x445577) },
    { time: 0.8,  sky: new THREE.Color(0x1a2555), sun: new THREE.Color(0x2a3366), ambient: new THREE.Color(0x222244) },
    { time: 1.0,  sky: new THREE.Color(0x0c1445), sun: new THREE.Color(0x1a2255), ambient: new THREE.Color(0x1a1a3a) },
];

export function createDayNightCycle() {
    const cfg = config.dayNight;
    let startTime = Date.now();
    let timeScale = 1.0;
    let enabled = cfg.enabled;
    let paused = false;
    let pausedTimeProgress = 0;

    const _skyColor = new THREE.Color();
    const _sunColor = new THREE.Color();
    const _ambientColor = new THREE.Color();

    function getTimeOfDay() {
        if (paused) return pausedTimeProgress;
        const elapsed = (Date.now() - startTime) * timeScale;
        return (elapsed % cfg.dayDurationMs) / cfg.dayDurationMs;
    }

    function interpolateColors(t) {
        let a = SKY_TABLE[0], b = SKY_TABLE[1];
        for (let i = 0; i < SKY_TABLE.length - 1; i++) {
            if (t >= SKY_TABLE[i].time && t < SKY_TABLE[i + 1].time) {
                a = SKY_TABLE[i];
                b = SKY_TABLE[i + 1];
                break;
            }
        }
        const range = b.time - a.time;
        const factor = range > 0 ? (t - a.time) / range : 0;

        _skyColor.copy(a.sky).lerp(b.sky, factor);
        _sunColor.copy(a.sun).lerp(b.sun, factor);
        _ambientColor.copy(a.ambient).lerp(b.ambient, factor);
    }

    function update(scene, sun, ambientLight) {
        if (!enabled) return;

        const t = getTimeOfDay();
        interpolateColors(t);

        scene.background.copy(_skyColor);

        const sunAngle = (t - 0.25) * Math.PI * 2;
        const cx = cfg.cityCenter.x;
        const cz = cfg.cityCenter.z;

        sun.position.x = cx + cfg.sunOrbitRadius * Math.cos(sunAngle);
        sun.position.y = cfg.sunOrbitRadius * Math.sin(sunAngle);
        sun.position.z = cz + cfg.sunOrbitRadius * 0.3 * Math.sin(sunAngle * 0.5);
        sun.target.position.set(cx, 0, cz);

        const sunHeight = Math.sin(sunAngle);
        const sunFactor = Math.max(0, sunHeight);
        sun.intensity = THREE.MathUtils.lerp(cfg.sunIntensityNight, cfg.sunIntensityDay, sunFactor);
        sun.color.copy(_sunColor);

        ambientLight.intensity = THREE.MathUtils.lerp(cfg.ambientIntensityNight, cfg.ambientIntensityDay, sunFactor * 0.8 + 0.2);
        ambientLight.color.copy(_ambientColor);

        sun.castShadow = sunFactor > 0.05;

        if (sunFactor < 0.3) {
            const fogDensity = (1 - sunFactor / 0.3) * 0.015;
            scene.fog = new THREE.FogExp2(_skyColor, fogDensity);
        } else {
            scene.fog = null;
        }
    }

    function getTimeString() {
        const t = getTimeOfDay();
        const totalMinutes = Math.floor(t * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    function getTimeIcon() {
        const t = getTimeOfDay();
        if (t >= 0.25 && t < 0.75) return '\u2600\uFE0F';
        if (t >= 0.2 && t < 0.25) return '\uD83C\uDF05';
        if (t >= 0.75 && t < 0.8) return '\uD83C\uDF07';
        return '\uD83C\uDF19';
    }

    function getPhaseName() {
        const t = getTimeOfDay();
        if (t >= 0.3 && t < 0.7) return 'Day';
        if (t >= 0.25 && t < 0.3) return 'Dawn';
        if (t >= 0.7 && t < 0.8) return 'Dusk';
        return 'Night';
    }

    return {
        update,
        getTimeString,
        getTimeIcon,
        getPhaseName,
        getTimeOfDay,

        get enabled() { return enabled; },
        set enabled(v) { enabled = v; },

        get timeScale() { return timeScale; },
        set timeScale(v) { timeScale = v; },

        pause() {
            pausedTimeProgress = getTimeOfDay();
            paused = true;
        },
        resume() {
            startTime = Date.now() - (pausedTimeProgress * cfg.dayDurationMs / timeScale);
            paused = false;
        },
        get paused() { return paused; },

        setTimeOfDay(t) {
            startTime = Date.now() - (t * cfg.dayDurationMs / timeScale);
            if (paused) pausedTimeProgress = t;
        }
    };
}