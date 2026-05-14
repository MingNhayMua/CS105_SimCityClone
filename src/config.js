export default {
    citizen: {
        minWorkingAge: 16,
        retirementAge: 65,
        maxJobSearchDistance: 4
    },
    zone: {
        abandonmentThreshold: 10,
        abandonmentChance: 0.25,
        developmentChance: 0.25,
        redevelopChance: 0.1,
        maxRoadSearchDistance: 3,
        residentMoveInChance: 0.5,
        capacityPerTier: {
            residential: [0, 2, 4, 8, 16, 24],
            commercial: [0, 2, 4, 8, 14, 20],
            industrial: [0, 4, 8, 14, 20, 30],
        }
    },

    vehicle: {
        speed: 0.0005,
        fadeTime: 500,
        maxLifetime: 10000,
        spawnInterval: 1000,
    },

    dayNight: {
        dayDurationMs: 120000,
        enabled: true,
        sunIntensityDay: 1.2,
        sunIntensityNight: 0.15,
        ambientIntensityDay: 0.4,
        ambientIntensityNight: 0.3,
        sunOrbitRadius: 25,
        cityCenter: { x: 8, y: 0, z: 8 },
    }
}
