import { pickRandom } from '../utils.js';
import { residentialNames } from './names.js';
import config from '../config.js';

function getMaxResidents(height) {
    const tiers = config.zone.capacityPerTier.residential;
    return tiers[Math.min(height, tiers.length - 1)] || 0;
}

export function createResidentialBuilding() {
    return {
        id: crypto.randomUUID(),
        type: 'residential',
        name: pickRandom(residentialNames),
        updated: true,
        height: 0,
        abandoned: false,
        abandonmentCounter: 0,
        residents: [],
        get maxResidents() { return getMaxResidents(this.height); },
        x: undefined,
        y: undefined,
        dispose(city) {
            for (const resident of this.residents) {
                if (resident.job && resident.job.workers) {
                    const idx = resident.job.workers.indexOf(resident);
                    if (idx !== -1) resident.job.workers.splice(idx, 1);
                }
                city.removeCitizen(resident);
            }
            this.residents = [];
        }
    };
}