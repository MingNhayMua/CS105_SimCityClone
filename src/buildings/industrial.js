import { createWorkplaceBuilding } from './workplaceBuilding.js';
import { industrialNames } from './names.js';

export function createIndustrialBuilding() {
    return createWorkplaceBuilding('industrial', industrialNames);
}