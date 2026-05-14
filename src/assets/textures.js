import * as THREE from 'three';

const texLoader = new THREE.TextureLoader();

export const atlasTexture = texLoader.load('/models/atlas-albedo-LPEC.png');
atlasTexture.colorSpace = THREE.SRGBColorSpace;
atlasTexture.flipY = false;

const srcResidentialTextures = [
    texLoader.load('/textures/apartments1.png'),
    texLoader.load('/textures/apartments4.png'),
    texLoader.load('/textures/apartment_block5.png'),
];

const srcCommercialTextures = [
    texLoader.load('/textures/building_front2.png'),
    texLoader.load('/textures/building_front5.png'),
    texLoader.load('/textures/building_side2.png'),
];

const srcIndustrialTextures = [
    texLoader.load('/textures/building_factory.png'),
    texLoader.load('/textures/loading_bays.png'),
    texLoader.load('/textures/warehouse_front.png'),
];

[srcResidentialTextures, srcCommercialTextures, srcIndustrialTextures]
    .flat()
    .forEach(t => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
    });

export const zoneTextures = {
    'residential': srcResidentialTextures,
    'commercial': srcCommercialTextures,
    'industrial': srcIndustrialTextures,
};

export const grassTexture = texLoader.load('/textures/Grass006_1K-JPG_Color.jpg');
grassTexture.colorSpace = THREE.SRGBColorSpace;
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;

export const constructionTexture = texLoader.load('/textures/building_construction.png');
constructionTexture.colorSpace = THREE.SRGBColorSpace;
constructionTexture.wrapS = THREE.RepeatWrapping;
constructionTexture.wrapT = THREE.RepeatWrapping;

export const roadColor = 0x444444;