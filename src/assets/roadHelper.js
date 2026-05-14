export function getRoadConfig(x, y, city) {
    if (!city) return { path: 'tiles/tile-road-straight.glb', rotation: 0, style: 'straight' };

    const top = y > 0 && city.data[x][y - 1]?.terrainID === 'road';
    const bottom = y < city.size - 1 && city.data[x][y + 1]?.terrainID === 'road';
    const left = x > 0 && city.data[x - 1][y]?.terrainID === 'road';
    const right = x < city.size - 1 && city.data[x + 1][y]?.terrainID === 'road';

    const DEG = Math.PI / 180;

    if (top && bottom && left && right) {
        return { path: 'tiles/tile-road-intersection.glb', rotation: 0, style: 'four-way' };
    }

    if (!top && bottom && left && right) {
        return { path: 'tiles/tile-road-intersection-t.glb', rotation: 0, style: 'three-way' };
    }
    if (top && !bottom && left && right) {
        return { path: 'tiles/tile-road-intersection-t.glb', rotation: 180 * DEG, style: 'three-way' };
    }
    if (top && bottom && !left && right) {
        return { path: 'tiles/tile-road-intersection-t.glb', rotation: 90 * DEG, style: 'three-way' };
    }
    if (top && bottom && left && !right) {
        return { path: 'tiles/tile-road-intersection-t.glb', rotation: 270 * DEG, style: 'three-way' };
    }

    if (top && !bottom && left && !right) {
        return { path: 'tiles/tile-road-curve.glb', rotation: 180 * DEG, style: 'corner' };
    }
    if (top && !bottom && !left && right) {
        return { path: 'tiles/tile-road-curve.glb', rotation: 90 * DEG, style: 'corner' };
    }
    if (!top && bottom && left && !right) {
        return { path: 'tiles/tile-road-curve.glb', rotation: 270 * DEG, style: 'corner' };
    }
    if (!top && bottom && !left && right) {
        return { path: 'tiles/tile-road-curve.glb', rotation: 0, style: 'corner' };
    }

    if (top && bottom && !left && !right) {
        return { path: 'tiles/tile-road-straight.glb', rotation: 0, style: 'straight' };
    }
    if (!top && !bottom && left && right) {
        return { path: 'tiles/tile-road-straight.glb', rotation: 90 * DEG, style: 'straight' };
    }

    if (top && !bottom && !left && !right) {
        return { path: 'tiles/tile-road-end.glb', rotation: 180 * DEG, style: 'end' };
    }
    if (!top && bottom && !left && !right) {
        return { path: 'tiles/tile-road-end.glb', rotation: 0, style: 'end' };
    }
    if (!top && !bottom && left && !right) {
        return { path: 'tiles/tile-road-end.glb', rotation: 270 * DEG, style: 'end' };
    }
    if (!top && !bottom && !left && right) {
        return { path: 'tiles/tile-road-end.glb', rotation: 90 * DEG, style: 'end' };
    }

    return { path: 'tiles/tile-road-end.glb', rotation: 0, style: 'end' };
}

export function getBuildingRotation(x, y, city) {
    if (!city) return 0;
    const s = y < city.size - 1 && city.data[x][y + 1]?.terrainID === 'road';
    const e = x < city.size - 1 && city.data[x + 1][y]?.terrainID === 'road';
    const w = x > 0 && city.data[x - 1][y]?.terrainID === 'road';
    const n = y > 0 && city.data[x][y - 1]?.terrainID === 'road';
    if (s) return 0;
    if (e) return -Math.PI / 2;
    if (w) return Math.PI / 2;
    if (n) return Math.PI;
    return 0;
}