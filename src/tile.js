import { createBuilding } from './buildings/buildings.js';
import { typeLabels } from './utils.js';

/**
 * @param {number} x
 * @param {number} y
 * @returns {object}
 */
export function createTile(x, y) {
    return {
        id: crypto.randomUUID(),
        x,
        y,
        zoneType: undefined,
        building: undefined,
        terrainID: 'grass',
        removeBuilding(city) {
            if (this.building && this.building.dispose) {
                this.building.dispose(city);
            }
            this.building = null;
        },
        placeBuilding(buildingType) {
            this.building = createBuilding(buildingType);
        },
        toHTML() {
            const building = this.building;
            if (!building) return '';

            const rows = [
                { label: 'Name', value: building.name },
                { label: 'Type', value: typeLabels[building.type] || building.type },
                { label: 'Height', value: `${building.height} / 5` },
            ];

            if (building.abandoned) {
                rows.push({ label: 'Status', value: '<span style="color:#ff6b6b">⚠ Abandoned</span>' });
            }

            if (building.residents) {
                rows.push({ label: 'Residents', value: `${building.residents.length} / ${building.maxResidents}` });
                if (building.residents.length > 0) {
                    const residentList = building.residents.map(r =>
                        `<span class="info-resident">${r.toHTML()}</span>`
                    ).join('');
                    rows.push({ label: 'People', value: residentList });
                }
            }

            if (building.workers) {
                rows.push({ label: 'Jobs filled', value: `${building.workers.length} / ${building.maxWorkers}` });
                if (building.workers.length > 0) {
                    const workerList = building.workers.map(w =>
                        `<span class="info-resident">${w.toHTML()}</span>`
                    ).join('');
                    rows.push({ label: 'Workers', value: workerList });
                }
            }

            return rows.map(row =>
                `<div class="info-row"><span class="info-label">${row.label}</span><span class="info-value">${row.value}</span></div>`
            ).join('');
        },

        distanceTo(tile) {
            return Math.abs(this.x - tile.x) + Math.abs(this.y - tile.y);
        }
    }
}