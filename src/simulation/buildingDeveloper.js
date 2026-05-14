import { checkRoadAccess } from '../buildings/zone.js';
import { createCitizen } from '../citizen.js';
import config from '../config.js';

export function updateAllBuildings(city) {
    for (let x = 0; x < city.size; x++) {
        for (let y = 0; y < city.size; y++) {
            const tile = city.data[x][y];
            if (!tile.building) continue;

            tile.building.x = x;
            tile.building.y = y;

            developBuilding(tile.building, city, x, y);
        }
    }
}

function developBuilding(building, city, x, y) {
    if (building.height > 0) {
        const wasAbandoned = building.abandoned;
        checkRoadAccess(building, city, x, y);

        if (building.abandoned) {
            handleEviction(building, city);
            return;
        }

        if (wasAbandoned && Math.random() < config.zone.redevelopChance) {
            building.height += 1;
            building.updated = true;
        }
    }

    if (!building.abandoned) {
        if (Math.random() < config.zone.developmentChance && building.height < 5) {
            building.height += 1;
            building.updated = true;
        }
    }

    if (building.type === 'residential' && !building.abandoned) {
        handleResidentMoveIn(building, city);
    }
}

function handleEviction(building, city) {
    if (building.type === 'residential') {
        if (building.residents && building.residents.length > 0) {
            for (const resident of building.residents) {
                if (resident.job && resident.job.workers) {
                    const idx = resident.job.workers.indexOf(resident);
                    if (idx !== -1) resident.job.workers.splice(idx, 1);
                }
                city.removeCitizen(resident);
            }
            building.residents = [];
        }
    } else {
        if (building.workers && building.workers.length > 0) {
            for (const worker of building.workers) {
                worker.job = null;
                worker.jobName = null;
                worker.state = 'unemployed';
            }
            building.workers = [];
        }
    }
}

function handleResidentMoveIn(building, city) {
    if (building.height > 0
        && building.residents.length < building.maxResidents
        && Math.random() < config.zone.residentMoveInChance) {
        const resident = createCitizen(building);
        building.residents.push(resident);
        city.addCitizen(resident);
    }
}