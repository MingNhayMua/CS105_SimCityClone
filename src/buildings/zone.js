import config from '../config.js';

/**
 * Checks road access and manages building abandonment state.
 * Call this in each building's update() method.
 *
 * @param {object} building - The building object (must have: abandoned, abandonmentCounter, updated)
 * @param {object} city - The city object
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @returns {boolean} true if the building has road access, false otherwise
 */
export function checkRoadAccess(building, city, x, y) {
    const hasRoad = city.findTile(x, y, (tile) => {
        return tile.terrainID === 'road';
    }, config.zone.maxRoadSearchDistance);

    if (!hasRoad) {
        building.abandonmentCounter++;

        if (building.abandonmentCounter >= config.zone.abandonmentThreshold
            && Math.random() < config.zone.abandonmentChance) {
            building.abandoned = true;
            building.updated = true;
        }

        return false;
    }

    // Road found — reset counter and revive if abandoned
    building.abandonmentCounter = 0;
    if (building.abandoned) {
        building.abandoned = false;
        building.updated = true;
    }

    return true;
}
