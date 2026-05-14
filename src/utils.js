/**
 * Shared utility functions for the SimCity simulation.
 */

/**
 * Picks a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
export function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Display labels for building/zone types.
 */
export const typeLabels = {
    'residential': '🏠 Residential',
    'commercial': '🏪 Commercial',
    'industrial': '🏭 Industrial',
    'road': '🛣 Road',
};
