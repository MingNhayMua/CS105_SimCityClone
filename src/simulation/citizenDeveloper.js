import config from '../config.js';
import { pickRandom } from '../utils.js';

const jobNames = {
    commercial: [
        'Cashier', 'Manager', 'Accountant', 'Sales Rep', 'Barista',
        'Chef', 'Waiter', 'Clerk', 'Consultant', 'Realtor'
    ],
    industrial: [
        'Factory Worker', 'Mechanic', 'Welder', 'Engineer', 'Foreman',
        'Assembler', 'Technician', 'Operator', 'Plumber', 'Electrician'
    ]
};

export function updateAllCitizens(city) {
    for (let i = city.citizens.length - 1; i >= 0; i--) {
        try {
            updateCitizen(city.citizens[i], city);
        } catch (e) {
            console.warn('Citizen update error:', e.message);
        }
    }
}

function updateCitizen(citizen, city) {
    switch (citizen.state) {
        case 'unemployed':
            if (citizen.age >= config.citizen.minWorkingAge
                && citizen.age < config.citizen.retirementAge) {
                findJob(citizen, city);
            }
            break;
        case 'employed':
            if (!citizen.job) {
                citizen.state = 'unemployed';
                citizen.jobName = null;
            }
            break;
    }
}

function findJob(citizen, city) {
    if (citizen.home.x === undefined || citizen.home.y === undefined) return;
    const result = city.findTile(citizen.home.x, citizen.home.y, (tile) => {
        if (!tile.building) return false;
        if (tile.building.type === 'industrial' || tile.building.type === 'commercial') {
            return tile.building.numberOfJobsAvailable() > 0;
        }
        return false;
    }, config.citizen.maxJobSearchDistance);

    if (result && result.building) {
        result.building.workers.push(citizen);
        citizen.job = result.building;
        citizen.state = 'employed';
        const jobs = jobNames[result.building.type] || ['Worker'];
        citizen.jobName = pickRandom(jobs);
    }
}