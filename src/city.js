import { createTile } from './tile.js';
import { updateAllBuildings } from './simulation/buildingDeveloper.js';
import { updateAllCitizens } from './simulation/citizenDeveloper.js';

export function createCity(size) {
    const data = [];
    const citizens = [];
    let balance = 10000;

    function initialize() {
        for (let x = 0; x < size; x++) {
            const column = [];
            for (let y = 0; y < size; y++) {
                const tile = createTile(x, y);
                column.push(tile);
            }
            data.push(column);
        }
    }

    function update() {
        updateAllBuildings(city);
        updateAllCitizens(city);
    }

    initialize();

    const city = {
        size,
        data,
        citizens,
        get balance() { return balance; },
        getBalance() { return balance; },
        update,
        getPopulation() {
            let population = 0;
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    population += data[x][y].building?.residents?.length || 0;
                }
            }
            return population;
        },
        addCitizen(citizen) {
            citizens.push(citizen);
        },
        removeCitizen(citizen) {
            const idx = citizens.indexOf(citizen);
            if (idx !== -1) citizens.splice(idx, 1);
        },
        getTileNeighbors(x, y) {
            const neighbors = [];
            if (x > 0) neighbors.push(data[x - 1][y]);
            if (x < size - 1) neighbors.push(data[x + 1][y]);
            if (y > 0) neighbors.push(data[x][y - 1]);
            if (y < size - 1) neighbors.push(data[x][y + 1]);
            return neighbors;
        },
        findTile(startX, startY, searchCriteria, maxDistance) {
            if (startX === undefined || startY === undefined) return null;
            if (startX < 0 || startX >= size || startY < 0 || startY >= size) return null;
            const startTile = data[startX][startY];
            const visited = new Set();
            const tilesToSearch = [];

            tilesToSearch.push(startTile);

            while (tilesToSearch.length > 0) {
                const tile = tilesToSearch.shift();
                if (visited.has(tile.id)) continue;
                visited.add(tile.id);

                const distance = startTile.distanceTo(tile);
                if (distance > maxDistance) continue;

                if (searchCriteria(tile)) {
                    return tile;
                } else {
                    tilesToSearch.push(...city.getTileNeighbors(tile.x, tile.y));
                }
            }

            return null;
        }
    };

    return city;
}