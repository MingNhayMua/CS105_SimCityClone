export const BUILDING_CATALOG = {
    residential: [
        { id: 'house-family-small', file: 'buildings/building-house-family-small.glb', tier: 1 },
        { id: 'house-family-large', file: 'buildings/building-house-family-large.glb', tier: 1 },
        { id: 'cabin-small', file: 'buildings/building-cabin-small.glb', tier: 1 },
        { id: 'cabin-big', file: 'buildings/building-cabin-big.glb', tier: 1 },
        { id: 'house-modern', file: 'buildings/building-house-modern.glb', tier: 2 },
        { id: 'house-modern-big', file: 'buildings/building-house-modern-big.glb', tier: 2 },
        { id: 'house-block', file: 'buildings/building-house-block.glb', tier: 2 },
        { id: 'house-block-old', file: 'buildings/building-house-block-old.glb', tier: 2 },
        { id: 'house-block-big', file: 'buildings/building-house-block-big.glb', tier: 3 },
        { id: 'block-4floor-front', file: 'buildings/building-block-4floor-front.glb', tier: 3 },
        { id: 'block-4floor-corner', file: 'buildings/building-block-4floor-corner.glb', tier: 3 },
        { id: 'block-4floor-back', file: 'buildings/building-block-4floor-back.glb', tier: 3 },
        { id: 'block-4floor-short', file: 'buildings/building-block-4floor-short.glb', tier: 4 },
        { id: 'apartment-china', file: 'buildings/building-apartment-china.glb', tier: 4 },
        { id: 'block-5floor', file: 'buildings/building-block-5floor.glb', tier: 4 },
        { id: 'block-5floor-front', file: 'buildings/building-block-5floor-front.glb', tier: 4 },
        { id: 'block-5floor-corner', file: 'buildings/building-block-5floor-corner.glb', tier: 5 },
        { id: 'block-5floor-short', file: 'buildings/building-block-5floor-short.glb', tier: 5 },
        { id: 'office-balcony', file: 'buildings/building-office-balcony.glb', tier: 5 },
        { id: 'office-pyramid', file: 'buildings/building-office-pyramid.glb', tier: 5 },
    ],

    commercial: [
        { id: 'shop-china', file: 'buildings/building-shop-china.glb', tier: 1 },
        { id: 'cafe', file: 'buildings/building-cafe.glb', tier: 1 },
        { id: 'burger-joint', file: 'buildings/building-burger-joint.glb', tier: 1 },
        { id: 'carwash', file: 'buildings/building-carwash.glb', tier: 1 },
        { id: 'post', file: 'buildings/building-post.glb', tier: 1 },
        { id: 'restaurant', file: 'buildings/building-restaurant.glb', tier: 2 },
        { id: 'restuarant-china', file: 'buildings/building-restuarant-china.glb', tier: 2 },
        { id: 'market-china', file: 'buildings/building-market-china.glb', tier: 2 },
        { id: 'policestation', file: 'buildings/building-policestation.glb', tier: 2 },
        { id: 'firestation', file: 'buildings/building-firestation.glb', tier: 2 },
        { id: 'school', file: 'buildings/building-school.glb', tier: 2 },
        { id: 'mall', file: 'buildings/building-mall.glb', tier: 3 },
        { id: 'cinema', file: 'buildings/building-cinema.glb', tier: 3 },
        { id: 'museum', file: 'buildings/building-museum.glb', tier: 3 },
        { id: 'office', file: 'buildings/building-office.glb', tier: 3 },
        { id: 'hotel', file: 'buildings/building-hotel.glb', tier: 4 },
        { id: 'bank', file: 'buildings/building-bank.glb', tier: 4 },
        { id: 'hospital', file: 'buildings/building-hospital.glb', tier: 4 },
        { id: 'casino', file: 'buildings/building-casino.glb', tier: 4 },
        { id: 'office-big', file: 'buildings/building-office-big.glb', tier: 4 },
        { id: 'office-tall', file: 'buildings/building-office-tall.glb', tier: 5 },
        { id: 'office-rounded', file: 'buildings/building-office-rounded.glb', tier: 5 },
        { id: 'skyscraper', file: 'buildings/building-skyscraper.glb', tier: 5 },
    ],

    industrial: [
        { id: 'industry-warehouse', file: 'buildings/industry-warehouse.glb', tier: 1 },
        { id: 'industry-storage', file: 'buildings/industry-storage.glb', tier: 1 },
        { id: 'pumpjack', file: 'buildings/pumpjack.glb', tier: 1 },
        { id: 'industry-building', file: 'buildings/industry-building.glb', tier: 2 },
        { id: 'industry-factory-old', file: 'buildings/industry-factory-old.glb', tier: 2 },
        { id: 'windmill', file: 'buildings/windmill.glb', tier: 2 },
        { id: 'industry-factory', file: 'buildings/industry-factory.glb', tier: 3 },
        { id: 'industry-factory-hall', file: 'buildings/industry-factory-hall.glb', tier: 3 },
        { id: 'incineration-plant', file: 'buildings/incineration-plant.glb', tier: 3 },
        { id: 'cooling-tower', file: 'buildings/cooling-tower.glb', tier: 4 },
        { id: 'industry-refinery', file: 'buildings/industry-refinery.glb', tier: 4 },
        { id: 'data-center', file: 'buildings/data-center.glb', tier: 4 },
        { id: 'nuclear-power-plant', file: 'buildings/nuclear-power-plant.glb', tier: 5 },
        { id: 'sea-refinery', file: 'buildings/sea-refinery.glb', tier: 5 },
    ],
};

export const TILE_CATALOG = {
    grass: { file: 'tiles/tile-plain_grass.glb' },
    road: [
        { id: 'road-straight', file: 'tiles/tile-road-straight.glb' },
        { id: 'road-curve', file: 'tiles/tile-road-curve.glb' },
        { id: 'road-intersection', file: 'tiles/tile-road-intersection.glb' },
        { id: 'road-intersection-t', file: 'tiles/tile-road-intersection-t.glb' },
        { id: 'road-end', file: 'tiles/tile-road-end.glb' },
        { id: 'road-straight-crosswalk', file: 'tiles/tile-road-straight-crosswalk.glb' },
    ],
    sidewalk: { file: 'tiles/tile-sidewalk-straight.glb' },
    water: { file: 'tiles/tile-water.glb' },
    park: { file: 'tiles/tile-park.glb' },
};

export const CONSTRUCTION_CATALOG = [
    { id: 'crane-docks', file: 'buildings/crane-docks.glb' },
];

export function pickBuildingModel(zoneType, height) {
    const list = BUILDING_CATALOG[zoneType];
    if (!list || list.length === 0) return null;

    const tier = Math.min(Math.max(height, 1), 5);

    let candidates = list.filter(b => b.tier === tier);

    if (candidates.length === 0) {
        candidates = list.filter(b => b.tier === tier - 1);
    }

    if (candidates.length === 0) {
        candidates = list.filter(b => b.tier <= tier);
    }

    if (candidates.length === 0) return list[0];
    return candidates[Math.floor(Math.random() * candidates.length)];
}

export const VEHICLE_CATALOG = {
    car: [
        'car-passenger',
        'car-taxi',
        'car-police',
        'car-pickup-modern',
        'car-veteran',
        'car-baywatch',
        'car-hippie-van',
        'car-ambulance-pickup',
        'car-firefighter-pickup',
        'car-tow-truck',
        'car-camper-vintage',
        'car-formula',
    ],
    truck: [
        'truck',
        'car-truck-dump',
        'car-truck-tanker',
        'car-truck-cement',
        'armored-truck',
    ],
    bus: [
        'bus-passenger',
        'bus-school',
    ],
    bike: [
        'bike-old',
        'motorbike-old',
        'scooter-kick',
    ],
    specialty: [
        'firetruck',
        'jeep-open',
        'golf-cart',
        'forklift',
        'bulldozer',
        'road-roller',
        'excavator',
    ],
};

export function pickVehicleModel() {
    const categories = Object.keys(VEHICLE_CATALOG);
    const weights = [50, 15, 10, 10, 15];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    let catIndex = 0;
    for (let i = 0; i < weights.length; i++) {
        rand -= weights[i];
        if (rand <= 0) {
            catIndex = i;
            break;
        }
    }
    const cat = categories[catIndex];
    const list = VEHICLE_CATALOG[cat];
    return list[Math.floor(Math.random() * list.length)];
}