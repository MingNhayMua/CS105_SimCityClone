import { pickRandom } from '../utils.js';
import config from '../config.js';

function getMaxWorkers(height, type) {
    const tiers = config.zone.capacityPerTier[type];
    return tiers[Math.min(height, tiers.length - 1)] || 0;
}

export function createWorkplaceBuilding(type, nameList) {
    return {
        id: crypto.randomUUID(),
        type,
        name: pickRandom(nameList),
        updated: true,
        height: 0,
        abandoned: false,
        abandonmentCounter: 0,
        workers: [],
        get maxWorkers() { return getMaxWorkers(this.height, type); },
        x: undefined,
        y: undefined,
        numberOfJobsAvailable() {
            if (this.abandoned) return 0;
            return this.maxWorkers - this.workers.length;
        },
        dispose(city) {
            for (const worker of this.workers) {
                worker.job = null;
                worker.jobName = null;
                worker.state = 'unemployed';
            }
            this.workers = [];
        }
    };
}