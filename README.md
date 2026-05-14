# 🏙️ SimCity — 3D City Builder

A 3D city-building simulation built with **Three.js** and **Vite**. Designed as a final project for the Computer Graphics (ĐHMT) course.

![Three.js](https://img.shields.io/badge/Three.js-v0.184-black?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-v6.3-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **City Building** — Place residential, commercial, and industrial zones on a 16×16 tile grid
- **Road Network** — Dynamic road system with auto-connecting tiles (straight, curves, T-junctions, intersections)
- **Vehicle Simulation** — Graph-based traffic system with vehicles navigating the road network autonomously
- **Building Growth** — Buildings develop over time, increasing in height and capacity
- **Citizen Simulation** — Citizens move in, find jobs, and contribute to the city economy
- **Day-Night Cycle** — Dynamic lighting with sun movement, sky color transitions, and nighttime fog
- **Landmark System** — Place special buildings (stadiums, temples, skyscrapers) with Affine Transform controls (translate, rotate, scale)
- **Interactive UI** — Premium glassmorphism toolbar, info panels, and real-time city statistics

## 📂 Project Structure

```
SimCity/
├── index.html                    # Entry point
├── package.json                  # Dependencies (Three.js, Vite)
├── public/
│   ├── Icons/                    # UI toolbar icons
│   ├── main.css                  # Glassmorphism UI styles
│   ├── models/                   # 3D models (GLB format)
│   │   ├── buildings/            # Building models (~107 files)
│   │   ├── tiles/                # Road & terrain tiles
│   │   └── vehicles/             # Vehicle models
│   └── textures/                 # Texture maps for buildings & terrain
├── scripts/
│   └── convert-fbx-to-glb.py    # Blender batch converter (FBX → GLB)
└── src/
    ├── assets/                   # Asset management
    │   ├── assetCatalog.js       # Model catalog & selection logic
    │   ├── assetFactory.js       # Mesh creation & dispatch
    │   ├── constructionSite.js   # Construction site procedural mesh
    │   ├── modelLoader.js        # GLTF loading, caching, preload
    │   ├── roadHelper.js         # Road connectivity & building rotation
    │   └── textures.js           # Texture loading & management
    ├── buildings/                # Building data modules
    │   ├── buildings.js          # Factory switch (zone → building)
    │   ├── commercial.js         # Commercial building data
    │   ├── industrial.js         # Industrial building data
    │   ├── names.js              # Building name pools
    │   ├── residential.js        # Residential building data
    │   └── zone.js               # Road access & abandonment logic
    ├── simulation/               # Centralized simulation systems
    │   ├── buildingDeveloper.js  # Building growth, abandonment, population
    │   └── citizenDeveloper.js   # Job search, citizen state management
    ├── ui/                       # UI modules
    │   ├── infoPanel.js          # Building info overlay
    │   └── toolbar.js            # Tool selection & pause
    ├── vehicles/                 # Vehicle simulation
    │   ├── vehicle.js            # Vehicle class (movement, lifecycle)
    │   ├── vehicleGraph.js       # Traffic graph manager
    │   ├── vehicleGraphHelper.js # Graph utility functions
    │   ├── vehicleGraphNode.js   # Graph node definition
    │   └── vehicleGraphTile.js   # Road tile graph templates
    ├── camera.js                 # Orbit/pan/zoom camera controls
    ├── citizen.js                # Citizen data factory
    ├── city.js                   # City grid & state management
    ├── config.js                 # Centralized game configuration
    ├── game.js                   # Game loop & tool orchestration
    ├── scene.js                  # Three.js scene, rendering, raycasting
    ├── tile.js                   # Tile data & building placement
    └── utils.js                  # Shared utilities
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (included with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/SimCity.git
cd SimCity

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 Controls

| Action | Control |
|---|---|
| **Rotate camera** | Right-click + drag |
| **Pan camera** | Middle-click + drag |
| **Zoom** | Scroll wheel |
| **Place zone/road** | Select tool → Left-click tile |
| **View building info** | Select pointer tool → Left-click building |
| **Transform landmark** | Pointer tool → Click landmark → T/R/S keys |
| **Pause/Resume** | Click ⏸️ button |

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `T` | Transform mode: Translate |
| `R` | Transform mode: Rotate |
| `S` | Transform mode: Scale |
| `Escape` | Deselect / Cancel |

## 🛠️ Technologies

- **[Three.js](https://threejs.org/)** — 3D rendering engine
- **[Vite](https://vitejs.dev/)** — Build tool & dev server
- **[Low Poly Epic City](https://www.polyperfect.com/)** — 3D asset pack (v1.7)

## 🏗️ Architecture

```
┌──────────────┐    ┌────────────────────┐
│   index.html │───▶│     game.js        │ ◄── Game loop, tools
│   (UI/HTML)  │    │   ┌────────────┐   │
└──────────────┘    │   │  city.js   │   │ ◄── Data (grid, citizens)
                    │   └─────┬──────┘   │
                    │         │          │
                    │   ┌─────▼──────┐   │
                    │   │  scene.js  │   │ ◄── 3D rendering
                    │   └─────┬──────┘   │
                    │         │          │
                    │   ┌─────▼──────┐   │
                    │   │ simulation/│   │ ◄── buildingDeveloper
                    │   │            │   │     citizenDeveloper
                    │   └────────────┘   │
                    └────────────────────┘
```

**Key design principles:**
- **Separation of data & rendering** — `city.js` manages state, `scene.js` renders
- **Centralized simulation** — Developer modules process all entities
- **Factory pattern** — Buildings are pure data objects created by factories
- **Model caching** — GLTF models loaded once, cloned for each instance

## 📝 License

This project is for educational purposes.

## 👤 Author

**Minh** — UIT Computer Graphics Course
