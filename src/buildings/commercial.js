import { createWorkplaceBuilding } from './workplaceBuilding.js';
import { commercialNames } from './names.js';

export function createCommercialBuilding() {
    return createWorkplaceBuilding('commercial', commercialNames);
}