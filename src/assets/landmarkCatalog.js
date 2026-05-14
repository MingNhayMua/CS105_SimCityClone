export const LANDMARK_CATALOG = [
    { id: 'stadium',     name: 'Stadium',       file: 'buildings/building-stadium.glb',       icon: '🏟️', category: 'entertainment' },
    { id: 'casino',      name: 'Casino',         file: 'buildings/building-casino.glb',        icon: '🎰', category: 'entertainment' },
    { id: 'temple',      name: 'Temple',         file: 'buildings/building-temple-china.glb',   icon: '🛕', category: 'culture' },
    { id: 'pagoda',      name: 'Pagoda',         file: 'buildings/building-pagoda-china.glb',   icon: '🏯', category: 'culture' },
    { id: 'skyscraper',  name: 'Skyscraper',     file: 'buildings/building-skyscraper.glb',     icon: '🏙️', category: 'skyscraper' },
    { id: 'office-tall', name: 'Office Tower',   file: 'buildings/building-office-tall.glb',    icon: '🏢', category: 'skyscraper' },
];

export function getLandmarkById(id) {
    return LANDMARK_CATALOG.find(l => l.id === id) || null;
}