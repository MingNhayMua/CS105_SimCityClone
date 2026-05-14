import { createResidentialBuilding } from './residential.js';
import { createCommercialBuilding } from './commercial.js';
import { createIndustrialBuilding } from './industrial.js';

export function createBuilding(BuildingType) {
    switch (BuildingType) {
        case 'residential':
            return createResidentialBuilding();
        case 'commercial':
            return createCommercialBuilding();
        case 'industrial':
            return createIndustrialBuilding();
        default:
            throw new Error(`Unknown building type: ${BuildingType}`);
    }
}

