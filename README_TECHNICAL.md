# SimCity — Tài liệu kỹ thuật đồ họa 3D

Đồ án môn Đồ Họa Máy Tính (CS105) — UIT

---

## Mục lục

1. [Phép chiếu & Camera](#1-phép-chiếu--camera)
2. [Vẽ & Load đối tượng (Model Loading)](#2-vẽ--load-đối-tượng-model-loading)
3. [Biến đổi Affine (Translate / Rotate / Scale)](#3-biến-đổi-affine-translate--rotate--scale)
4. [Chiếu sáng & Bóng đổ](#4-chiếu-sáng--bóng-đổ)
5. [Texture Mapping](#5-texture-mapping)
6. [Animation & Chuyển động](#6-animation--chuyển-động)
7. [Raycasting & Tương tác người dùng](#7-raycasting--tương-tác-người-dùng)
8. [Chế độ hiển thị (View Modes)](#8-chế-độ-hiển-thị-view-modes)
9. [Mô phỏng thành phố (Simulation)](#9-mô-phỏng-thành-phố-simulation)
10. [Hệ thống giao thông (Vehicles)](#10-hệ-thống-giao-thông-vehicles)
11. [Hệ thống đối tượng thủ tục (Procedural)](#11-hệ-thống-đối-tượng-thủ-tục-procedural)

---

## 1. Phép chiếu & Camera

### 1.1 Tổng quan

Camera cho phép người dùng quan sát thành phố từ mọi góc độ. Sử dụng phép chiếu phối cảnh (perspective projection).

### 1.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Phép chiếu phối cảnh** | `PerspectiveCamera(FOV=75°, near=0.1, far=1000)` — điểm càng xa càng nhỏ |
| **Ma trận chiếu (Projection Matrix)** | `M_proj` biến đổi view space → clip space |
| **Hệ tọa độ cầu → Cartesian** | Chuyển đổi `(azimuth, elevation, radius)` → `(x, y, z)` |
| **Phép tịnh tiến (Pan)** | Dịch chuyển `cameraOrigin` bằng vector forward/left |
| **Phép quay (Rotate)** | Thay đổi `azimuth` và `elevation` bằng chuột phải |

### 1.3 Cách load / khởi tạo

```javascript
// File: src/camera.js
const camera = new THREE.PerspectiveCamera(
    75,                  // FOV: góc nhìn dọc
    width / height,      // Tỉ lệ khung hình
    0.1,                 // Near clipping plane
    1000                 // Far clipping plane
);
```

### 1.4 Công thức chuyển đổi tọa độ

**Spherical → Cartesian:**
```
x = radius × sin(azimuth) × cos(elevation)
z = radius × cos(azimuth) × cos(elevation)
y = radius × sin(elevation)

camera.position = (x, y, z) + cameraOrigin
camera.lookAt(cameraOrigin)
```

**Tham số & giới hạn:**

| Tham số | Phạm vi | Thao tác chuột |
|---|---|---|
| `azimuth` (θ) | 0° → 360° | Right-click kéo ngang |
| `elevation` (φ) | 30° → 90° | Right-click kéo dọc |
| `radius` (r) | 3 → 40 | Scroll wheel |

**Ma trận chiếu phối cảnh (Three.js nội bộ):**
```
M_proj =
| 1/(a·tan(fov/2))       0            0          0   |
|        0           1/tan(fov/2)      0          0   |
|        0                0       (f+n)/(n-f)   -1   |
|        0                0       2·f·n/(n-f)    0   |

a = aspect, f = far, n = near
```

Biến đổi: `P_clip = M_proj × M_view × M_model × P_local`
Sau đó perspective divide: `(x/w, y/w)` → NDC `[-1, 1]`

### 1.5 File thực hiện

| File | Vai trò |
|---|---|
| `src/camera.js` | Tất cả logic camera |

---

## 2. Vẽ & Load đối tượng (Model Loading)

### 2.1 Tổng quan

Dự án vẽ các đối tượng 3D theo 2 cách:
- **Load model từ file GLB** (tập tin 3D có sẵn) — dùng cho building, tile đường, vehicle, landmark
- **Vẽ thủ công từ khối cơ bản** (BoxGeometry, CylinderGeometry, PlaneGeometry) — dùng cho construction site, billboard, fallback

### 2.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **GLTF/GLB Loading** | Dùng `THREE.GLTFLoader` load file `.glb` bất đồng bộ |
| **Model Caching** | `Map<path, THREE.Group>` — mỗi model chỉ load 1 lần, clone cho các instance |
| **Batch Preloading** | Load 4 file song song, có progress callback cho loading bar |
| **Material Replacement** | Khi load GLB: thay material gốc → `MeshLambertMaterial` với atlas texture |
| **Clone Pattern** | `cachedModel.clone()` — shared geometry, mỗi instance có material riêng |
| **Bounding Box Centering** | `Box3().setFromObject().getCenter()` để căn chỉnh model về gốc tọa độ |
| **Footprint Clamping** | Scale model sao cho không vượt quá kích thước tile |

### 2.3 Cách load

#### 2.3.1 Load model từ file GLB

```javascript
// File: src/assets/modelLoader.js
const gltfLoader = new GLTFLoader();
const modelCache = new Map();

async function loadModel(path) {
    if (modelCache.has(path)) return modelCache.get(path).clone(); // Cache hit

    const gltf = await gltfLoader.loadAsync(`/models/${path}`);
    const model = gltf.scene;

    // Thay material → Lambert với atlas texture
    model.traverse(child => {
        if (child.isMesh && child.material) {
            child.material = new THREE.MeshLambertMaterial({ map: atlasTexture });
            child.receiveShadow = true;
            child.castShadow = true;
        }
    });

    model.scale.set(1/30, 1/30, 1/30); // Scale về đơn vị tile
    modelCache.set(path, model);
    return model.clone();
}
```

#### 2.3.2 Preload khi khởi động

```javascript
// File: src/assets/modelLoader.js — preloadModels()
const paths = [...]; // Tất cả file GLB
for (let i = 0; i < paths.length; i += 4) {
    await Promise.all(paths.slice(i, i+4).map(path => loadModel(path)));
    onProgress(loaded, total); // Cập nhật thanh loading
}
```

#### 2.3.3 Danh sách model được load

| Loại | Số lượng | Đường dẫn |
|---|---|---|
| Grass tile | 1 | `tiles/tile-plain_grass.glb` |
| Road tiles | 6 | straight, curve, intersection, intersection-t, end, crosswalk |
| Residential buildings | 20 | `buildings/building-house-*.glb`, `building-block-*.glb`, ... |
| Commercial buildings | 22 | `buildings/building-cafe.glb`, `building-office-*.glb`, ... |
| Industrial buildings | 14 | `buildings/industry-*.glb`, `pumpjack.glb`, `windmill.glb`, ... |
| Vehicles | 27 | `vehicles/car-*.glb`, `truck.glb`, `bus-*.glb`, ... |
| Landmarks | 6 | `buildings/building-stadium.glb`, `building-temple-china.glb`, ... |

### 2.4 Mesh Creation Pipeline

```
createAssetInstance(assetID, x, y, data, city)    ← File: assetFactory.js
  │
  ├── 'grass' → load model grass.glb từ cache → clone → position(x,0,y)
  ├── 'road'  → getRoadConfig() xác định loại tile → load model phù hợp → clone → rotate
  ├── 'residential' | 'commercial' | 'industrial'
  │     ├── height=0 → createConstructionSite() (procedural crane)
  │     ├── height>0 → pickBuildingModel(type, height) chọn model theo tier
  │     │     ├── Có trong cache → clone + scale + center + rotate
  │     │     └── Chưa có → createZoneMeshFallback() (procedural box + texture)
  ├── 'water'   → BoxGeometry + blue material
  ├── 'park'    → BoxGeometry + green material
  ├── 'sidewalk'→ BoxGeometry + gray material
  └── 'vehicle' → pickVehicleModel() → clone từ cache → scale 1.2× → center
```

### 2.5 File thực hiện

| File | Vai trò |
|---|---|
| `src/assets/modelLoader.js` | GLTFLoader, cache, batch preload |
| `src/assets/assetFactory.js` | Factory tạo mesh cho từng loại asset |
| `src/assets/assetCatalog.js` | Danh sách model + logic chọn model theo tier |
| `src/assets/textures.js` | Load các file texture |

---

## 3. Biến đổi Affine (Translate / Rotate / Scale)

### 3.1 Tổng quan

Dự án triển khai **3 phép biến đổi Affine cơ sở** (Translate, Rotate, Scale) trên các đối tượng 3D. Người dùng có thể thao tác trực tiếp bằng chuột và bàn phím.

### 3.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả | Ma trận |
|---|---|---|
| **Phép tịnh tiến (Translate)** | Di chuyển đối tượng trong không gian 3D | `T(dx, dy, dz)` |
| **Phép quay (Rotate)** | Xoay đối tượng quanh 1 trục | `R_y(θ)` |
| **Phép tỉ lệ (Scale)** | Co giãn đối tượng | `S(sx, sy, sz)` |
| **Quaternion Rotation** | Xoay không cần Euler angles, tránh gimbal lock | `setFromUnitVectors(from, to)` |

### 3.3 Các nơi áp dụng biến đổi Affine

#### 3.3.1 TransformControls — Biến đổi landmark trực quan

**File:** `src/scene.js` (dòng 56-97, 345-402)

Người dùng chọn landmark → kéo gizmo 3D để biến đổi:

| Chế độ | Phím tắt | Thao tác chuột | Giới hạn trục | Lý do |
|---|---|---|---|---|
| **Translate** | `T` | Kéo mũi tên | Chỉ X, Z (khóa Y) | Giữ landmark trên mặt đất |
| **Rotate** | `S` | Kéo vòng tròn | Chỉ Y | Xoay quanh mặt đất |
| **Scale** | `R` | Kéo cube | Cả X, Y, Z | Scale đều |

**Khởi tạo & cấu hình:**
```javascript
const transformControls = new TransformControls(camera, renderer.domElement);
transformControls.setSize(3);

// Gizmo luôn hiển thị trên cùng, không bị che
const gizmo = transformControls.getHelper();
gizmo.renderOrder = 999;
gizmo.traverse(child => {
    child.material.depthTest = false;  // Không kiểm tra depth
    child.material.depthWrite = false; // Không ghi depth buffer
});
```

**Quy trình chọn & biến đổi:**
```
1. Click landmark → raycast tìm Group có userData.id='landmark'
2. attachTransform(landmarkGroup) → gắn gizmo vào group
3. Hiện UI hiển thị (Pos, Rot Y°, Scale) real-time
4. Kéo gizmo → sự kiện 'change' → updateTransformUI()
5. Escape / chọn tool khác → detachTransform()
```

**Khóa trục khi translate (chỉ di chuyển trên mặt đất):**
```javascript
// scene.js:369-374
transformControls.showX = true;
transformControls.showY = false;  // ← Không cho kéo lên/xuống
transformControls.showZ = true;
```

**Khóa trục khi rotate (chỉ xoay quanh Y):**
```javascript
// scene.js:377-381
transformControls.showX = false;
transformControls.showY = true;   // ← Chỉ xoay quanh trục đứng
transformControls.showZ = false;
```

#### 3.3.2 Xoay building hướng ra đường

**File:** `src/assets/roadHelper.js` (dòng 64-75)

Mỗi building tự động xoay mặt ra đường gần nhất:

```javascript
getBuildingRotation(x, y, city):
  Kiểm tra 4 hướng (trên/dưới/trái/phải) — tìm tile có terrainID='road'
  Có đường phía Nam → rotation = 0         (nhìn xuống dưới)
  Có đường phía Đông → rotation = -π/2     (nhìn sang phải)
  Có đường phía Tây  → rotation = π/2      (nhìn sang trái)
  Có đường phía Bắc  → rotation = π        (nhìn lên trên)
```

#### 3.3.3 Scale model theo tier

**File:** `src/assets/assetFactory.js` (dòng 112-120)

```javascript
// Building tier 1 (nhà nhỏ): scale ×1.4
// Building tier 2+ (nhà lớn): scale ×2.0
const SCALE = tier <= 1 ? 1.4 : 2.0;
inner.scale.multiplyScalar(SCALE);

// Clamp footprint: nếu model quá to → scale xuống vừa 1 tile
const box = new THREE.Box3().setFromObject(inner);
const maxDim = Math.max(box.size.x, box.size.z);
if (maxDim > 0.95) inner.scale.multiplyScalar(0.95 / maxDim);
```

#### 3.3.4 Center model bằng bounding box

**File:** `src/assets/assetFactory.js` (dòng 122-134)

```javascript
// Dịch chuyển model về gốc tọa độ dựa trên bounding box
box.getCenter(center);
inner.position.set(-center.x, -box.min.y, -center.z);
// → Model nằm trên y=0, trung tâm tại (0, 0, 0) trong local space
```

#### 3.3.5 Xoay xe theo hướng di chuyển (Quaternion)

**File:** `src/vehicles/vehicle.js` (dòng 150-164)

```javascript
const FORWARD = new THREE.Vector3(0, 0, 1); // Hướng mặc định model xe

// Vector hướng từ origin → destination
const direction = destinationWorldPos.clone().sub(originWorldPos).normalize();

// Quaternion: xoay từ FORWARD sang direction
this.quaternion.setFromUnitVectors(FORWARD, direction);
```

#### 3.3.6 Xoay tile đường theo neighbor

**File:** `src/assets/roadHelper.js` (dòng 1-62)

Mỗi tile đường tự xác định loại (straight/curve/intersection/end) và góc xoay:

```
Kiểm tra 4 tile lân cận:
  4 đường → four-way intersection     xoay 0°
  3 đường → three-way intersection     xoay 0°/90°/180°/270°
  2 đường đối diện → straight          xoay 0° hoặc 90°
  2 đường kề nhau → curve              xoay 0°/90°/180°/270°
  1 đường → end                        xoay 0°/90°/180°/270°
```

### 3.4 Bảng tọa độ & phạm vi

| Hệ tọa độ | Gốc | Đơn vị | Mô tả |
|---|---|---|---|
| Grid | (0,0) → (15,15) | Tile (1×1) | Tọa độ logic của city |
| World (Three.js) | (0,0,0) → (15,0,15) | Unit (1 = 1 tile) | Không gian 3D, Y hướng lên |
| Camera Spherical | (θ, φ, r) | Góc (°), radius (unit) | Hệ tọa độ cầu cho camera |

### 3.5 File thực hiện

| File | Biến đổi |
|---|---|
| `src/scene.js` | TransformControls (T/R/S gizmo cho landmark) |
| `src/assets/assetFactory.js` | Scale model theo tier, center bounding box |
| `src/assets/roadHelper.js` | Rotation của tile đường + building |
| `src/vehicles/vehicle.js` | Quaternion xoay xe theo hướng di chuyển |
| `src/camera.js` | Spherical → Cartesian transform |

---

## 4. Chiếu sáng & Bóng đổ

### 4.1 Tổng quan

Dự án sử dụng mô hình chiếu sáng toàn phần (global illumination đơn giản hóa) với 2 nguồn sáng + bóng đổ + chu kỳ ngày đêm.

### 4.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Directional Light** | Ánh sáng mặt trời — tia song song, không suy giảm theo khoảng cách |
| **Ambient Light** | Ánh sáng môi trường — chiếu đều mọi hướng |
| **Lambertian Shading** | `MeshLambertMaterial` — diffuse only, `I = ambient + diffuse × max(0, N·L)` |
| **Shadow Mapping** | Render từ góc nhìn light → depth map → so sánh depth |
| **PCF (Percentage Closer Filtering)** | Soft shadow — lọc mẫu xung quanh để shadow mềm mại |
| **Color Interpolation (Lerp)** | Nội suy màu sky/sun/ambient qua 11 mốc thời gian |
| **Exponential Fog** | `FogExp2` — sương mù ban đêm, mật độ tăng khi mặt trời thấp |
| **Sun Orbital Motion** | Mặt trời di chuyển theo quỹ đạo elip quanh thành phố |

### 4.3 Cách khởi tạo & cấu hình

#### 4.3.1 Nguồn sáng

```javascript
// File: src/scene.js (dòng 207-225)

// Directional Light = mặt trời
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 20, 20);
sun.castShadow = true;

// Shadow camera frustum — bao phủ toàn thành phố 16×16
sun.shadow.camera.left   = -40;
sun.shadow.camera.right  = 40;
sun.shadow.camera.top    = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near   = 0.5;
sun.shadow.camera.far    = 100;
sun.shadow.mapSize.width  = 2048;  // Độ phân giải shadow map
sun.shadow.mapSize.height = 2048;

// Ambient Light = ánh sáng môi trường
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
```

#### 4.3.2 Shadow Map

```javascript
// File: src/scene.js (dòng 23-25)
renderer.shadowMap.enabled = true;             // Bật shadow
renderer.shadowMap.type = PCFSoftShadowMap;    // Lọc mềm PCF
```

**Quy trình Shadow Mapping:**
```
1. Render scene từ góc nhìn của DirectionalLight → tạo depth map 2048×2048
2. Render scene từ camera chính:
   - Với mỗi pixel, tính vị trí trong light space
   - So sánh depth của pixel với depth trong shadow map
   - Nếu depth_pixel > depth_shadowMap → pixel nằm trong bóng
   - PCF: lấy mẫu nhiều texel xung quanh → shadow mềm
```

#### 4.3.3 Chu kỳ ngày đêm

**File:** `src/simulation/dayNightCycle.js`

**Thời gian:**
```javascript
t = (elapsed_ms × timeScale) % 120000 / 120000   // t ∈ [0, 1]
// 0 = nửa đêm, 0.25 = bình minh, 0.5 = trưa, 0.75 = hoàng hôn
```

**Nội suy màu bầu trời (11 mốc):**
```javascript
SKY_TABLE = [
    { time: 0.0,  sky: 0x0c1445, sun: 0x1a2255, ambient: 0x1a1a3a },  // 00:00
    { time: 0.2,  sky: 0x0e1850, sun: 0x1a2255, ambient: 0x1a1a3a },  // 04:48
    { time: 0.25, sky: 0x2a4070, sun: 0x5577aa, ambient: 0x334466 },  // 06:00 (dawn)
    { time: 0.3,  sky: 0x6699cc, sun: 0x99bbdd, ambient: 0x6688aa },  // 07:12
    { time: 0.35, sky: 0xaaccee, sun: 0xddeeff, ambient: 0xbbccdd },  // 08:24
    { time: 0.5,  sky: 0xddeeff, sun: 0xffffff, ambient: 0xffffff },  // 12:00 (noon)
    { time: 0.65, sky: 0xddeeff, sun: 0xffffff, ambient: 0xffffff },  // 15:36
    { time: 0.7,  sky: 0x8899bb, sun: 0x99aacc, ambient: 0x7788aa },  // 16:48
    { time: 0.75, sky: 0x445577, sun: 0x667799, ambient: 0x445577 },  // 18:00 (dusk)
    { time: 0.8,  sky: 0x1a2555, sun: 0x2a3366, ambient: 0x222244 },  // 19:12
    { time: 1.0,  sky: 0x0c1445, sun: 0x1a2255, ambient: 0x1a1a3a },  // 24:00
];

// Nội suy giữa 2 mốc:
const factor = (t - a.time) / (b.time - a.time);
skyColor.lerpColors(a.sky, b.sky, factor);     // ← Phép nội suy màu (color interpolation)
```

**Vị trí mặt trời (quỹ đạo elip):**
```javascript
sunAngle = (t - 0.25) × 2π;           // t=0.25 (dawn) → angle=0 (mặt trời mọc)
sun.x = cx + 25 × cos(sunAngle);
sun.y = 25 × sin(sunAngle);           // Cao nhất lúc noon: sin(π/2) = 1
sun.z = cz + 25 × 0.3 × sin(sunAngle × 0.5);
sun.target = (cx, 0, cz);             // Luôn chiếu vào tâm thành phố
```

**Cường độ ánh sáng theo độ cao mặt trời:**
```javascript
sunFactor = max(0, sin(sunAngle));  // 0 (đêm) → 1 (trưa)
sun.intensity     = lerp(0.15, 1.2, sunFactor);  // ← Phép nội suy tuyến tính
ambient.intensity = lerp(0.3,  0.4, sunFactor × 0.8 + 0.2);
sun.castShadow    = sunFactor > 0.05;  // Tắt shadow ban đêm (tiết kiệm GPU)
```

**Sương mù ban đêm:**
```javascript
if (sunFactor < 0.3) {
    density = (1 - sunFactor / 0.3) × 0.015;
    scene.fog = new THREE.FogExp2(skyColor, density);
    // FogExp2: attenuation = e^(-density × distance²)
}
```

### 4.4 Mô hình chiếu sáng Lambert

```
I_pixel = I_ambient × K_material + I_directional × K_material × max(0, N·L)
```

| Thành phần | Ý nghĩa |
|---|---|
| `I_ambient` | Cường độ AmbientLight (0.15→0.4) |
| `I_directional` | Cường độ DirectionalLight (0.15→1.2) |
| `K_material` | Màu + texture của mesh |
| `N` | Surface normal |
| `L` | Hướng đến mặt trời |
| `max(0, N·L)` | Góc tới: càng vuông góc càng sáng, mặt khuất = 0 |
| Shadow | Nếu pixel trong shadow map → bỏ `I_directional` |

### 4.5 File thực hiện

| File | Vai trò |
|---|---|
| `src/scene.js` | Tạo DirectionalLight + AmbientLight, cấu hình shadow map |
| `src/simulation/dayNightCycle.js` | Chu kỳ ngày đêm: sun orbit, color interpolation, fog |

---

## 5. Texture Mapping

### 5.1 Tổng quan

Dự án áp texture lên đối tượng 3D qua 3 cách: atlas texture cho model GLB, zone texture cho building thủ tục, và user-upload cho billboard.

### 5.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Texture Atlas** | 1 ảnh lớn chứa texture cho tất cả model → thay material khi load GLB |
| **Repeat Wrapping** | Texture lặp lại theo chiều cao building (`repeat.set(1, height)`) |
| **Canvas Texture** | Vẽ ảnh user upload lên canvas → `CanvasTexture` → áp lên PlaneGeometry |
| **sRGB Color Space** | Tất cả texture dùng `SRGBColorSpace` để hiển thị màu chính xác |

### 5.3 Cách load & áp dụng

#### 5.3.1 Atlas Texture (cho model GLB)

```javascript
// File: src/assets/textures.js (dòng 5-7)
const atlasTexture = new THREE.TextureLoader().load('/models/atlas-albedo-LPEC.png');
atlasTexture.colorSpace = THREE.SRGBColorSpace;
atlasTexture.flipY = false;  // GLTF convention

// File: src/assets/modelLoader.js (dòng 17-26)
// Khi load mỗi model GLB → thay toàn bộ material
model.traverse(child => {
    if (child.isMesh && child.material) {
        child.material = new THREE.MeshLambertMaterial({ map: atlasTexture });
    }
});
```

→ Texture atlas được áp cho **tất cả** building + tile + vehicle model GLB.

#### 5.3.2 Zone Textures (cho building thủ tục fallback)

```javascript
// File: src/assets/textures.js (dòng 9-39)
zoneTextures = {
    residential: [apartments1.png, apartments4.png, apartment_block5.png],
    commercial:  [building_front2.png, building_front5.png, building_side2.png],
    industrial:  [building_factory.png, loading_bays.png, warehouse_front.png],
};

// File: src/assets/assetFactory.js (dòng 56-83)
// Áp texture lên BoxGeometry thủ tục
sideTexture.repeat.set(1, height);   // Lặp texture theo chiều cao
sideTexture.wrapS = THREE.RepeatWrapping;
sideTexture.wrapT = THREE.RepeatWrapping;

const materialArray = [side, side, top, top, side, side]; // 6 mặt của box
```

#### 5.3.3 Billboard — User upload ảnh

```javascript
// File: src/scene.js (dòng 293-339)
// Người dùng chọn file ảnh (.jpg, .png, ...)
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';

// Khi chọn file:
img.onload = () => {
    // Vẽ lên canvas → tạo texture
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Áp lên 2 mặt PlaneGeometry (trước + sau) của billboard
    const boardFront = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 0.5),
        new THREE.MeshLambertMaterial({ map: texture })
    );
};
```

#### 5.3.4 Grass & Construction Textures

```javascript
// File: src/assets/textures.js (dòng 41-48)
grassTexture = TextureLoader.load('Grass006_1K-JPG_Color.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;

constructionTexture = TextureLoader.load('building_construction.png');
constructionTexture.wrapS = THREE.RepeatWrapping;
constructionTexture.wrapT = THREE.RepeatWrapping;
```

### 5.4 File thực hiện

| File | Vai trò |
|---|---|
| `src/assets/textures.js` | Load tất cả texture (atlas, zone, grass, construction) |
| `src/assets/modelLoader.js` | Áp atlas texture cho model GLB |
| `src/assets/assetFactory.js` | Áp zone texture cho building thủ tục |
| `src/scene.js` | CanvasTexture từ ảnh user upload cho billboard |

---

## 6. Animation & Chuyển động

### 6.1 Tổng quan

Dự án có 4 hệ thống animation chạy độc lập trong render loop.

### 6.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Phép nội suy vị trí (Position Lerp)** | `position.lerp(target, t)` — xe di chuyển giữa 2 node |
| **Phép nội suy màu (Color Lerp)** | `color.lerp(target, factor)` — sky/sun/ambient transition |
| **Phép nội suy cường độ (Linear Interpolation)** | `lerp(a, b, t)` — cường độ ánh sáng theo sunFactor |
| **Quaternion Rotation** | Xoay xe theo hướng di chuyển |
| **Opacity Animation** | Fade in/out xe bằng `material.opacity` |
| **requestAnimationFrame Loop** | Render loop 60fps, update animation mỗi frame |

### 6.3 Các animation

#### 6.3.1 Day-Night Cycle

_(Đã mô tả chi tiết ở mục 4.3.3 — Chiếu sáng)_

**File:** `src/simulation/dayNightCycle.js`

| Thành phần chuyển động | Công thức | Chu kỳ |
|---|---|---|
| Vị trí mặt trời | `(cx + R·cos(ωt), R·sin(ωt), cz)` | 120 giây |
| Màu bầu trời | Lerp giữa 11 mốc màu | 120 giây |
| Cường độ sáng | `lerp(night, day, max(0, sin(ωt)))` | 120 giây |
| Sương mù | `FogExp2` khi sunFactor < 0.3 | — |

#### 6.3.2 Vehicle Movement

**File:** `src/vehicles/vehicle.js`

Xe di chuyển tự động trên mạng lưới đường bằng đồ thị:

**Công thức lerp vị trí mỗi frame:**
```javascript
cycleTime = (now - cycleStartTime) / (distance / speed);  // ∈ [0, 1]
position = originWorldPos + (destWorldPos - originWorldPos) × cycleTime;
// Tương đương: position.lerp(destination, cycleTime)
```

**Pathfinding:**
```
Khi cycleTime = 1 (đến đích):
  origin = destination cũ
  destination = origin.getRandomNextNode()  // Chọn hướng ngẫu nhiên
  Cập nhật quaternion xoay sang hướng mới
```

**Fade In/Out:**
```javascript
if (age < 500ms)           opacity = age / 500;            // Fade in
else if (10000 - age < 500) opacity = (10000 - age) / 500; // Fade out
else                        opacity = 1;                   // Bình thường
```

#### 6.3.3 Building Growth

**File:** `src/simulation/buildingDeveloper.js`

Mỗi tick (1 giây):
```
25% chance + height < 5 → height += 1
10% chance sau khi hết abandoned → re-develop (height +1)
→ building.updated = true → scene tạo mesh mới với model tier mới
→ Hiệu ứng building "mọc lên"
```

#### 6.3.4 Render Loop

**File:** `src/scene.js` (dòng 397-421)

```javascript
function draw() {
    dayNightCycle.update(scene, sun, ambientLight);   // 1. Ánh sáng
    if (!vehiclesPaused) vehicleGraph.updateVehicles(); // 2. Xe
    renderer.render(scene, camera);                     // 3. Render
}
renderer.setAnimationLoop(draw); // Đăng ký với requestAnimationFrame (~60fps)
```

### 6.4 File thực hiện

| File | Animation |
|---|---|
| `src/simulation/dayNightCycle.js` | Sun orbit, sky color, light intensity, fog |
| `src/vehicles/vehicle.js` | Xe di chuyển lerp, fade in/out |
| `src/simulation/buildingDeveloper.js` | Building growth (height tăng dần) |
| `src/scene.js` | Render loop (điều phối tất cả animation) |

---

## 7. Raycasting & Tương tác người dùng

### 7.1 Tổng quan

Dự án sử dụng raycasting để người dùng tương tác với thế giới 3D: click chọn tile, chọn building, chọn landmark, hover indicator.

### 7.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Screen → NDC Transform** | Chuyển tọa độ pixel chuột → Normalized Device Coordinates [-1, 1] |
| **Ray Casting** | Tạo tia từ camera qua điểm NDC → tìm intersection với scene |
| **Recursive Intersection** | `intersectObjects(scene.children, true)` — duyệt toàn bộ scene graph |
| **Ancestor Traversal** | Tìm tổ tiên có `userData` (id hoặc x/y) từ object được click |

### 7.3 Công thức chuyển đổi tọa độ

```javascript
// File: src/scene.js (dòng 431-437)

// Pixel → NDC
mouse.x = ((clientX - rect.left) / rect.width)  × 2 - 1;   // [-1, 1]
mouse.y = -((clientY - rect.top) / rect.height) × 2 + 1;   // [-1, 1], flipped Y

// Tạo ray
raycaster.setFromCamera(mouse, camera);

// Intersect toàn bộ scene
const hits = raycaster.intersectObjects(scene.children, true);
```

### 7.4 Hai chế độ raycast

| Chế độ | Hàm | Tìm kiếm | Dùng cho |
|---|---|---|---|
| **Object** | `raycastObject(event)` | Ancestor có `userData.id` | Click chọn building xem info, chọn landmark để transform |
| **Tile** | `raycastTile(event)` | Ancestor có `userData.x` | Hover hiển thị indicator, drag đặt zone |

### 7.5 Tương tác chuột

| Thao tác | Xử lý |
|---|---|
| **Left click (pointer tool)** | Raycast object → hiện info panel. Nếu là landmark → gắn TransformControls |
| **Left click (zone/road tool)** | Raycast tile → đặt zone/đường/bulldoze |
| **Left drag (placement tool)** | `isLeftMouseDown=true` → mỗi frame raycast tile → đặt liên tục |
| **Right drag** | Xoay camera (thay đổi azimuth + elevation) |
| **Scroll** | Zoom camera (thay đổi radius) |

### 7.6 Hover Indicator

Khi hover tile trống với tool placement:
```javascript
// File: src/assets/assetFactory.js (dòng 646-659) - sử dụng trong scene.js

hoverObject = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.3, 0.8),
    new THREE.MeshLambertMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.5
    })
);
hoverObject.position.set(x, 0.15, y);
```

### 7.7 File thực hiện

| File | Vai trò |
|---|---|
| `src/scene.js` | Raycasting, mouse handlers, hover indicator |
| `src/camera.js` | Xử lý chuột cho camera (rotate/pan/zoom) |
| `src/game.js` | `onObjectSelected` callback, dispatch tool actions |

---

## 8. Chế độ hiển thị (View Modes)

### 8.1 Tổng quan

Dự án có 3 chế độ hiển thị, chuyển đổi qua phím 1/2/3 hoặc nút UI.

### 8.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Wireframe Rendering** | `material.wireframe = true` — chỉ vẽ cạnh của tam giác |
| **Point Cloud Rendering** | `THREE.Points` + `PointsMaterial` — hiển thị đỉnh dưới dạng điểm |
| **Material Save/Restore** | `Map<mesh, material>` — lưu material gốc để khôi phục |
| **World Matrix Copy** | Copy `matrixWorld` của mesh gốc cho point cloud |

### 8.3 Chế độ Normal (phím 1)

Hiển thị mặc định — đầy đủ texture, material, lighting.

### 8.4 Chế độ Blueprint / Wireframe (phím 2)

**Quy trình:**
```
1. Duyệt toàn bộ scene (scene.traverse)
2. Với mỗi mesh (không phải helper):
   a. Lưu material gốc vào Map originalMaterials
   b. Clone material → bật wireframe = true
   c. Đổi màu → xanh dương blueprint (0x4488ff)
   d. Xóa texture map → map = null
```

**Công thức:**
```javascript
// File: src/scene.js (dòng 631-656)
const wireframeMat = child.material.clone();
wireframeMat.wireframe = true;          // ← Chỉ vẽ wireframe
wireframeMat.color = new THREE.Color(0x4488ff);  // Màu xanh dương
wireframeMat.map = null;                // Bỏ texture
child.material = wireframeMat;
```

### 8.5 Chế độ X-Ray / Point Cloud (phím 3)

**Quy trình:**
```
1. Duyệt toàn bộ scene
2. Với mỗi mesh:
   a. Lưu material gốc
   b. Ẩn mesh (visible = false)
   c. Tạo Points với cùng geometry của mesh
   d. Copy world matrix từ mesh gốc
   e. Tô màu theo loại zone
```

**Bảng màu X-Ray:**
| Zone | Màu | Hex |
|---|---|---|
| Residential | Xanh lá | `#44ff88` |
| Commercial | Đỏ | `#ff4466` |
| Industrial | Vàng | `#ffcc44` |
| Road | Trắng | `#ffffff` |
| Grass | Xanh đậm | `#448844` |
| Landmark | Tím | `#cc88ff` |

**Công thức:**
```javascript
// File: src/scene.js (dòng 658-703)
child.visible = false;  // Ẩn mesh gốc

const points = new THREE.Points(
    child.geometry,                    // Dùng chung geometry
    new THREE.PointsMaterial({
        color: zoneColor,
        size: 0.03,
        sizeAttenuation: true          // Điểm xa nhỏ hơn
    })
);

// Copy world matrix → point cloud ở đúng vị trí của mesh gốc
child.updateWorldMatrix(true, false);
points.matrix.copy(child.matrixWorld);
points.matrixAutoUpdate = false;

scene.add(points);
```

### 8.6 Khôi phục (Restore)

```javascript
// File: src/scene.js (dòng 725-731)
for (const [mesh, mat] of originalMaterials) {
    mesh.material = mat;    // Gán lại material gốc
    mesh.visible = true;    // Hiện lại mesh
}
originalMaterials.clear();

// Xóa point clouds
for (const pc of xrayPointClouds) {
    pc.material.dispose();
    scene.remove(pc);
}
```

### 8.7 File thực hiện

| File | Vai trò |
|---|---|
| `src/scene.js` | Toàn bộ logic 3 view modes |

---

## 9. Mô phỏng thành phố (Simulation)

### 9.1 Tổng quan

Hệ thống mô phỏng chạy mỗi tick (1 giây), xử lý: phát triển building, citizen move-in/out, tìm việc làm, abandon/revive.

### 9.2 Kỹ thuật sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **BFS (Breadth-First Search)** | Tìm tile thỏa điều kiện trong bán kính cho trước |
| **State Machine** | Citizen: unemployed → findJob → employed → (mất job) → unemployed |
| **Probability-based Events** | Abandon, develop, redevelop, resident move-in — tất cả dùng Math.random() |

### 9.3 Building Growth

**File:** `src/simulation/buildingDeveloper.js`

```
Mỗi tick, với mỗi building:
  1. Nếu height > 0:
     a. Kiểm tra đường trong bán kính 3 tile (BFS)
     b. Không có đường → abandonmentCounter++
     c. Counter ≥ 10 + 25% chance → abandoned = true → đuổi residents/workers
     d. Có đường trở lại → abandoned = false (revive)
  2. 25% chance + height < 5 → height += 1 (phát triển)
  3. 10% chance sau khi hết abandon → re-develop
  4. Nếu residential + không abandon + 50% chance → citizen mới move in
```

### 9.4 Job Search

**File:** `src/simulation/citizenDeveloper.js`

```
State machine:
  unemployed ──→ age ∈ [16,65] → BFS tìm building commercial/industrial
       ↑              │                        trong bán kính 4 tile
       │              ↓ Found                           │
       │         citizen.job = building                 │
       │         citizen.state = 'employed'             │
       │              │                                 │
       └──────────────┘                                 ↓
          building bị xóa / abandon           ┌─────────────────┐
          → citizen.job = null                │    employed     │
          → citizen.state = 'unemployed'      └─────────────────┘
```

### 9.5 File thực hiện

| File | Vai trò |
|---|---|
| `src/city.js` | Grid 16×16, BFS `findTile()`, citizens list |
| `src/tile.js` | Tile data (terrain, building) |
| `src/buildings/residential.js` | Residential building data |
| `src/buildings/workplaceBuilding.js` | Commercial/industrial building data |
| `src/buildings/zone.js` | `checkRoadAccess()` — kiểm tra đường + abandon |
| `src/simulation/buildingDeveloper.js` | `updateAllBuildings()` — logic phát triển |
| `src/simulation/citizenDeveloper.js` | `updateAllCitizens()` — state machine tìm việc |
| `src/citizen.js` | Citizen factory (tên, tuổi, state) |
| `src/config.js` | Tất cả tham số mô phỏng |

---

## 10. Hệ thống giao thông (Vehicles)

### 10.1 Tổng quan

Hệ thống xe chạy tự động trên mạng lưới đường sử dụng đồ thị (graph). Mỗi tile đường chứa các node (điểm) được kết nối với nhau. Xe di chuyển giữa các node bằng phép nội suy vị trí.

### 10.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **Directed Graph** | Node → edge → node, xe chọn hướng ngẫu nhiên tại mỗi node |
| **Position Interpolation (Lerp)** | `position.lerp(target, cycleTime)` mỗi frame |
| **Quaternion Rotation** | `setFromUnitVectors(FORWARD, direction)` xoay xe theo hướng |
| **World Position Calculation** | `node.getWorldPosition()` — lấy vị trí thực tế trong scene graph |
| **Opacity Animation** | Fade in/out bằng `material.opacity` |

### 10.3 Cấu trúc đồ thị

#### VehicleGraphNode (src/vehicles/vehicleGraphNode.js)

```javascript
class VehicleGraphNode extends THREE.Object3D {
    constructor(x, y) {
        this.position.set(x, 0, y);  // Vị trí local trong tile cha
        this.next = [];              // Danh sách node kế tiếp (1 chiều)
    }
    connect(node) { this.next.push(node); }
    getRandomNextNode() { return random(this.next); }
}
```

#### VehicleGraphTile (src/vehicles/vehicleGraphTile.js)

Mỗi tile đường có 4 cạnh (left/right/top/bottom), mỗi cạnh có cặp node `{in, out}`.

**5 loại tile:**

| Loại | Cạnh kết nối | Cấu trúc node |
|---|---|---|
| **End Road** | 1 cạnh (bottom) | `bottom.in → mid.in → mid.out → bottom.out` (U-turn) |
| **Straight** | 2 cạnh đối diện | `bottom.in → top.out`, `top.in → bottom.out` |
| **Corner** | 2 cạnh kề | `bottom.in → midBR → right.out`, `right.in → midTL → bottom.out` |
| **Three-Way** | 3 cạnh | Vòng xoay nội bộ: `BL→BR→TR→TL→BL` + kết nối input/output |
| **Four-Way** | 4 cạnh | Vòng xoay nội bộ 4 midpoint + đầy đủ input/output |

**World side mapping** (tile bị xoay → map local → world):
```javascript
getWorldLeftSide() {
    switch (roadRotation) {
        case 0:   return this.left;    // Không xoay
        case 90:  return this.top;     // Xoay 90°: left → top
        case 180: return this.right;   // Xoay 180°: left → right
        case 270: return this.bottom;  // Xoay 270°: left → bottom
    }
}
```

#### VehicleGraph (src/vehicles/vehicleGraph.js)

```javascript
class VehicleGraph extends THREE.Group {
    tiles: (VehicleGraphTile|null)[size][size];  // Grid tile
    vehicles: THREE.Group;                        // Container xe
    
    // Khi đặt/xóa đường → cập nhật tile
    updateTile(x, y, road) {
        // 1. disconnectAll() tile cũ + neighbors
        // 2. Tạo tile mới: VehicleGraphTile.create(x, y, rotation, style)
        // 3. Kết nối 2 chiều: tile.getWorldLeftSide().out → leftTile.getWorldRightSide().in
        // 4. Thay tile trong grid
    }
    
    // Spawn xe mỗi 1000ms
    spawnVehicle() {
        const tile = random(tiles);                  // Chọn tile đường ngẫu nhiên
        const origin = tile.getRandomNode();          // Chọn node input
        const destination = origin.getRandomNextNode(); // Chọn hướng đi
        const model = getVehicleModel();              // Clone model xe từ cache
        const vehicle = new Vehicle(origin, destination, model);
        this.vehicles.add(vehicle);
    }
}
```

### 10.4 File thực hiện

| File | Vai trò |
|---|---|
| `src/vehicles/vehicleGraphNode.js` | Node — position + connections |
| `src/vehicles/vehicleGraphTile.js` | 5 loại tile với internal node network |
| `src/vehicles/vehicleGraph.js` | Graph manager — grid, spawn, updateTile |
| `src/vehicles/vehicle.js` | Vehicle — lerp movement, fade, lifecycle |
| `src/vehicles/vehicleGraphHelper.js` | Debug visualization (ẩn) |
| `src/assets/roadHelper.js` | Xác định style + rotation của tile đường |

---

## 11. Hệ thống đối tượng thủ tục (Procedural)

### 11.1 Tổng quan

Ngoài model GLB, dự án tạo một số đối tượng hoàn toàn từ các khối hình cơ bản (procedural geometry).

### 11.2 Kỹ thuật đồ họa sử dụng

| Kỹ thuật | Mô tả |
|---|---|
| **BoxGeometry** | Hình hộp chữ nhật — dùng cho hầu hết các khối |
| **CylinderGeometry** | Hình trụ — cột billboard |
| **PlaneGeometry** | Mặt phẳng — mặt billboard |
| **SphereGeometry** | Hình cầu — debug graph visualization |
| **ConeGeometry** | Hình nón — mũi tên debug graph |
| **MeshLambertMaterial** | Vật liệu Lambert — diffuse shading |

### 11.3 Construction Site (Cần cẩu công trường)

**File:** `src/assets/constructionSite.js`

Tạo khi building ở height=0. Gồm các thành phần từ `BoxGeometry`:

| Thành phần | Geometry | Material |
|---|---|---|
| Nền | Box(0.85, 0.04, 0.85) | Texture `construction.png` |
| Cột cẩu | Box(0.045, 2.2, 0.045) | Vàng `#CC8800` |
| Tay cẩu | Box(0.8, 0.035, 0.035) | Vàng |
| Đối trọng | Box(0.1, 0.12, 0.08) | Xám `#555555` |
| Cáp | Box(0.012, 0.9, 0.012) | Đen `#444444` |
| Móc | Box(0.045³) | Xám `#888888` |
| Khối bê tông ×5 | Box(0.14, 0.07, 0.1) | Xám `#999999` |
| Rào chắn ×4 | Box(0.55, 0.04, 0.03) | Cam `#FF8C00` |
| Vạch kẻ ×4 | Box(0.08, 0.042, 0.032) | Trắng |
| Container | Box(0.22, 0.12, 0.14) | Đỏ `#CC3333` |
| Ống ×3 | Box(0.03, 0.03, 0.3) | Xám `#666666` |

Tất cả được bọc trong `Group`, xoay hướng ra đường bằng `getBuildingRotation()`.

### 11.4 Billboard

**File:** `src/assets/billboardFactory.js`

| Thành phần | Geometry | Material |
|---|---|---|
| Cột | Cylinder(0.02, 0.025, 0.7, 8 đoạn) | Xám |
| Khung | Box(0.84, 0.54, 0.03) | Đen |
| Mặt trước | Plane(0.8, 0.5) | CanvasTexture từ ảnh upload |
| Mặt sau | Plane(0.8, 0.5), flipped 180° | CanvasTexture từ ảnh upload |
| Đế | Box(0.2, 0.05, 0.2) | Xám |

### 11.5 Zone Fallback Building

**File:** `src/assets/assetFactory.js` (dòng 32-88)

Khi model GLB chưa load xong, tạo building thủ công:

```javascript
// Base (móng)
const base = new Mesh(BoxGeometry(1,1,1), grayMaterial);
base.scale.set(0.8, 0.1, 0.8);

// Thân building — BoxGeometry 1×1 với 6 material (6 mặt)
const materialArray = [side, side, top, top, side, side];
const building = new Mesh(BoxGeometry(1,1,1), materialArray);
building.scale.set(0.8, height, 0.8);  // Chiều cao = số tầng
building.position.y = 0.1 + height/2;
```

### 11.5 Hover Indicator

Box bán trong suốt hiển thị khi hover tile trống:

```javascript
new Mesh(
    BoxGeometry(0.8, 0.3, 0.8),
    MeshLambertMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 })
)
// position: (x, 0.15, y)
```

### 11.6 Debug Graph Visualization

**File:** `src/vehicles/vehicleGraphHelper.js` (mặc định ẩn)

Vẽ đồ thị xe bằng sphere (node) và cone (edge/arrow):

```javascript
// Node = sphere
new Mesh(SphereGeometry(0.03, 6, 6), connectedMaterial); // Màu xanh nếu có edge

// Edge = cone (mũi tên)
new Mesh(ConeGeometry(0.02, 1, 6), blueMaterial);
cone.scale.set(1, distance, 1);
cone.quaternion.setFromUnitVectors(UP, edgeVector); // ← Phép quay hướng mũi tên
```

### 11.7 File thực hiện

| File | Đối tượng |
|---|---|
| `src/assets/constructionSite.js` | Cần cẩu + công trường |
| `src/assets/billboardFactory.js` | Billboard (cột + 2 mặt phẳng) |
| `src/assets/assetFactory.js` | Zone building fallback, hover indicator, grass/water/park/sidewalk cubes |
| `src/vehicles/vehicleGraphHelper.js` | Spheres + cones debug graph |

---

## Phụ lục: Tổng hợp kỹ thuật đồ họa

| Kỹ thuật | Áp dụng ở chức năng |
|---|---|
| **Phép chiếu phối cảnh** | Camera (FOV 75°, near/far) |
| **Biến đổi Affine — Translate** | Camera pan, TransformControls, model positioning |
| **Biến đổi Affine — Rotate** | Camera orbit, TransformControls, building hướng đường, xe quaternion |
| **Biến đổi Affine — Scale** | TransformControls, building theo tier, footprint clamping |
| **Chiếu sáng Directional + Ambient** | Mặt trời + ánh sáng môi trường |
| **Shadow Mapping (PCF 2048×2048)** | Bóng đổ toàn thành phố |
| **Phép nội suy màu (Color Lerp)** | Day-night sky/sun/ambient qua 11 mốc |
| **Phép nội suy vị trí (Position Lerp)** | Vehicle movement giữa graph nodes |
| **Phép nội suy cường độ (Linear Interp)** | Sun/ambient intensity theo độ cao mặt trời |
| **Exponential Fog** | Sương mù ban đêm |
| **GLTF/GLB Loading** | Tất cả model 3D (building, tile, vehicle, landmark) |
| **Model Caching (clone pattern)** | Mỗi model load 1 lần, clone cho instance |
| **Atlas Texture Mapping** | Thay material GLB → Lambert + atlas |
| **Zone Texture Mapping** | Building thủ tục với repeat wrapping |
| **Canvas Texture Mapping** | Billboard (ảnh user upload → texture) |
| **Raycasting** | Click chọn tile, building, landmark |
| **Wireframe Rendering** | Blueprint view mode |
| **Point Cloud Rendering** | X-Ray view mode |
| **Quaternion Rotation** | Xe xoay theo hướng di chuyển |
| **Bounding Box Centering** | Căn chỉnh model về gốc |
| **BFS (Breadth-First Search)** | Tìm đường gần nhất, tìm việc |
| **Directed Graph** | Hệ thống giao thông (5 loại tile) |
| **Procedural Geometry** | Construction site, billboard, hover indicator |
| **State Save/Restore** | View modes (lưu và khôi phục material) |
| **Batch Async Loading** | Preload 4 file song song |
| **Opacity Animation** | Vehicle fade in/out |
