import * as THREE from 'three';
import { VehicleGraphNode } from './vehicleGraphNode.js';

/**
 * Offset để tạo 2 làn đường (in/out) cách tâm đường 1 chút
 */
const ROAD_OFFSET = 0.05;
/**
 * Offset từ tâm tile ra mép — nơi node in/out nằm
 */
const TILE_OFFSET = 0.25;

/**
 * Tile cơ sở trong đồ thị xe — chứa các node (in/out) cho mỗi cạnh
 * Mỗi cạnh (left/right/top/bottom) có thể có:
 *   - in: node xe đi VÀO tile từ hướng đó
 *   - out: node xe đi RA tile theo hướng đó
 * Dùng rotation để xác định hướng world thực tế
 */
export class VehicleGraphTile extends THREE.Group {
    constructor(x, y, rotation) {
        super();
        // Đặt tile tại vị trí (x, 0, y) trên grid
        this.position.set(x, 0, y);
        // Xoay tile — road model có rotation riêng, tile phải khớp
        this.rotation.set(0, rotation, 0);

        // Lưu rotation theo độ để dùng trong getWorldXxxSide()
        this.roadRotation = Math.round(rotation * (180 / Math.PI));

        // 4 cạnh — mỗi cạnh có cặp node {in, out}
        // null = cạnh đó không có kết nối (vd: đường cụt)
        this.left = { in: null, out: null };
        this.right = { in: null, out: null };
        this.top = { in: null, out: null };
        this.bottom = { in: null, out: null };
    }

    /**
     * Factory: tạo tile đúng loại dựa vào style đường
     * @param {number} x - tọa độ X trên grid
     * @param {number} y - tọa độ Y trên grid
     * @param {number} rotation - góc xoay (radians)
     * @param {string} style - loại đường: 'end', 'straight', 'corner', 'three-way', 'four-way'
     * @returns {VehicleGraphTile|null}
     */
    static create(x, y, rotation, style) {
        switch (style) {
            case 'end':
                return new EndRoadTile(x, y, rotation);
            case 'straight':
                return new StraightRoadTile(x, y, rotation);
            case 'corner':
                return new CornerRoadTile(x, y, rotation);
            case 'three-way':
                return new ThreeWayRoadTile(x, y, rotation);
            case 'four-way':
                return new FourWayRoadTile(x, y, rotation);
            default:
                console.error(`Loại đường "${style}" không được hỗ trợ`);
                return null;
        }
    }

    /**
     * Ngắt tất cả kết nối và xóa nodes khỏi tile
     */
    disconnectAll() {
        for (let node of this.children) {
            node.disconnectAll();
            node.removeFromParent();
        }
    }

    /**
     * Lấy ngẫu nhiên 1 node input để spawn xe
     * @returns {VehicleGraphNode|null}
     */
    getRandomNode() {
        const nodes = [];
        if (this.left.in) nodes.push(this.left.in);
        if (this.right.in) nodes.push(this.right.in);
        if (this.top.in) nodes.push(this.top.in);
        if (this.bottom.in) nodes.push(this.bottom.in);

        if (nodes.length > 0) {
            return nodes[Math.floor(nodes.length * Math.random())];
        }
        return null;
    }

    // ==========================================
    // Chuyển đổi cạnh local → world dựa theo rotation
    // Vd: tile xoay 90° → cạnh "left" local = cạnh "top" world
    // ==========================================

    getWorldLeftSide() {
        switch (this.roadRotation) {
            case 0: return this.left;
            case 90: return this.top;
            case 180: return this.right;
            case 270: return this.bottom;
            default: return this.left;
        }
    }

    getWorldRightSide() {
        switch (this.roadRotation) {
            case 0: return this.right;
            case 90: return this.bottom;
            case 180: return this.left;
            case 270: return this.top;
            default: return this.right;
        }
    }

    getWorldTopSide() {
        switch (this.roadRotation) {
            case 0: return this.top;
            case 90: return this.right;
            case 180: return this.bottom;
            case 270: return this.left;
            default: return this.top;
        }
    }

    getWorldBottomSide() {
        switch (this.roadRotation) {
            case 0: return this.bottom;
            case 90: return this.left;
            case 180: return this.top;
            case 270: return this.right;
            default: return this.bottom;
        }
    }
}

// ==========================================
// Các loại tile đường cụ thể
// Mỗi loại tạo nodes + kết nối nội bộ khác nhau
// ==========================================

/**
 * Đường cụt — chỉ có 1 cạnh (bottom), xe vào rồi quay đầu ra
 */
class EndRoadTile extends VehicleGraphTile {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.name = `EndRoadTile (${x},${y})`;

        // Cạnh bottom: xe vào (in) và xe ra (out)
        this.bottom = {
            in: new VehicleGraphNode(ROAD_OFFSET, TILE_OFFSET),
            out: new VehicleGraphNode(-ROAD_OFFSET, TILE_OFFSET)
        };
        // Điểm giữa để tạo đường U-turn
        const mid = {
            in: new VehicleGraphNode(ROAD_OFFSET, 0),
            out: new VehicleGraphNode(-ROAD_OFFSET, 0)
        };

        this.add(this.bottom.in, this.bottom.out, mid.in, mid.out);

        // Kết nối: vào từ bottom → đi lên giữa → quay đầu → ra bottom
        this.bottom.in.connect(mid.in);
        mid.in.connect(mid.out);
        mid.out.connect(this.bottom.out);
    }
}

/**
 * Đường thẳng — 2 cạnh (top + bottom), xe đi xuyên qua
 */
class StraightRoadTile extends VehicleGraphTile {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.name = `StraightRoadTile (${x},${y})`;

        this.top = {
            in: new VehicleGraphNode(-ROAD_OFFSET, -TILE_OFFSET),
            out: new VehicleGraphNode(ROAD_OFFSET, -TILE_OFFSET)
        };
        this.bottom = {
            in: new VehicleGraphNode(ROAD_OFFSET, TILE_OFFSET),
            out: new VehicleGraphNode(-ROAD_OFFSET, TILE_OFFSET)
        };

        this.add(this.top.in, this.top.out, this.bottom.in, this.bottom.out);

        // Kết nối: bottom.in → top.out (đi lên), top.in → bottom.out (đi xuống)
        this.bottom.in.connect(this.top.out);
        this.top.in.connect(this.bottom.out);
    }
}

/**
 * Đường cua (góc) — 2 cạnh (bottom + right), xe rẽ 90°
 */
class CornerRoadTile extends VehicleGraphTile {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.name = `CornerRoadTile (${x},${y})`;

        this.bottom = {
            in: new VehicleGraphNode(ROAD_OFFSET, TILE_OFFSET + 0.1),
            out: new VehicleGraphNode(-ROAD_OFFSET, TILE_OFFSET + 0.1)
        };
        this.right = {
            in: new VehicleGraphNode(TILE_OFFSET + 0.1, -ROAD_OFFSET),
            out: new VehicleGraphNode(TILE_OFFSET + 0.1, ROAD_OFFSET)
        };

        // 2 midpoint để tạo đường cua mượt
        const midBR = new VehicleGraphNode(TILE_OFFSET - 1.5 * ROAD_OFFSET, TILE_OFFSET - 1.5 * ROAD_OFFSET);
        const midTL = new VehicleGraphNode(TILE_OFFSET - 3 * ROAD_OFFSET, TILE_OFFSET - 3 * ROAD_OFFSET);

        this.add(midBR, midTL, this.right.in, this.right.out, this.bottom.in, this.bottom.out);

        // bottom → midBR → right (rẽ phải), right → midTL → bottom (rẽ trái)
        this.bottom.in.connect(midBR);
        midBR.connect(this.right.out);
        this.right.in.connect(midTL);
        midTL.connect(this.bottom.out);
    }
}

/**
 * Ngã ba — 3 cạnh (left + right + bottom), xe chọn hướng tại giao lộ
 */
class ThreeWayRoadTile extends VehicleGraphTile {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.name = `ThreeWayRoadTile (${x},${y})`;

        this.left = {
            in: new VehicleGraphNode(-TILE_OFFSET, ROAD_OFFSET),
            out: new VehicleGraphNode(-TILE_OFFSET, -ROAD_OFFSET)
        };
        this.right = {
            in: new VehicleGraphNode(TILE_OFFSET, -ROAD_OFFSET),
            out: new VehicleGraphNode(TILE_OFFSET, ROAD_OFFSET)
        };
        this.bottom = {
            in: new VehicleGraphNode(ROAD_OFFSET, TILE_OFFSET),
            out: new VehicleGraphNode(-ROAD_OFFSET, TILE_OFFSET)
        };

        // 4 midpoint tạo vòng xoay nội bộ cho giao lộ
        const midBL = new VehicleGraphNode(-ROAD_OFFSET, ROAD_OFFSET);
        const midBR = new VehicleGraphNode(ROAD_OFFSET, ROAD_OFFSET);
        const midTL = new VehicleGraphNode(-ROAD_OFFSET, -ROAD_OFFSET);
        const midTR = new VehicleGraphNode(ROAD_OFFSET, -ROAD_OFFSET);

        this.add(this.left.in, this.left.out, this.right.in, this.right.out,
                 this.bottom.in, this.bottom.out, midBL, midBR, midTL, midTR);

        // Vòng xoay nội bộ: BL → BR → TR → TL → BL
        midBL.connect(midBR);
        midBR.connect(midTR);
        midTR.connect(midTL);
        midTL.connect(midBL);

        // Đầu vào → midpoint
        this.left.in.connect(midBL);
        this.right.in.connect(midTR);
        this.bottom.in.connect(midBR);

        // Midpoint → đầu ra
        midBL.connect(this.bottom.out);
        midBR.connect(this.right.out);
        midTL.connect(this.left.out);
    }
}

/**
 * Ngã tư — 4 cạnh, đầy đủ kết nối
 */
class FourWayRoadTile extends VehicleGraphTile {
    constructor(x, y, rotation) {
        super(x, y, rotation);
        this.name = `FourWayRoadTile (${x},${y})`;

        this.left = {
            in: new VehicleGraphNode(-TILE_OFFSET, ROAD_OFFSET),
            out: new VehicleGraphNode(-TILE_OFFSET, -ROAD_OFFSET)
        };
        this.right = {
            in: new VehicleGraphNode(TILE_OFFSET, -ROAD_OFFSET),
            out: new VehicleGraphNode(TILE_OFFSET, ROAD_OFFSET)
        };
        this.bottom = {
            in: new VehicleGraphNode(ROAD_OFFSET, TILE_OFFSET),
            out: new VehicleGraphNode(-ROAD_OFFSET, TILE_OFFSET)
        };
        this.top = {
            in: new VehicleGraphNode(-ROAD_OFFSET, -TILE_OFFSET),
            out: new VehicleGraphNode(ROAD_OFFSET, -TILE_OFFSET)
        };

        const midBL = new VehicleGraphNode(-ROAD_OFFSET, ROAD_OFFSET);
        const midBR = new VehicleGraphNode(ROAD_OFFSET, ROAD_OFFSET);
        const midTL = new VehicleGraphNode(-ROAD_OFFSET, -ROAD_OFFSET);
        const midTR = new VehicleGraphNode(ROAD_OFFSET, -ROAD_OFFSET);

        this.add(this.left.in, this.left.out, this.right.in, this.right.out,
                 this.bottom.in, this.bottom.out, this.top.in, this.top.out,
                 midBL, midBR, midTL, midTR);

        // Vòng xoay nội bộ
        midBL.connect(midBR);
        midBR.connect(midTR);
        midTR.connect(midTL);
        midTL.connect(midBL);

        // Đầu vào → midpoint
        this.left.in.connect(midBL);
        this.right.in.connect(midTR);
        this.bottom.in.connect(midBR);
        this.top.in.connect(midTL);

        // Midpoint → đầu ra
        midBL.connect(this.bottom.out);
        midBR.connect(this.right.out);
        midTR.connect(this.top.out);
        midTL.connect(this.left.out);
    }
}
