import * as THREE from 'three';
import { VehicleGraphTile } from './vehicleGraphTile.js';
import { VehicleGraphHelper } from './vehicleGraphHelper.js';
import config from '../config.js';
import { Vehicle } from './vehicle.js';
import { getVehicleModel } from '../assets/modelLoader.js';

/**
 * Đồ thị xe — quản lý toàn bộ mạng lưới đường và xe đang chạy
 * Mỗi tile trên grid có thể là null (không phải đường) hoặc VehicleGraphTile
 * Khi đặt/xóa đường, gọi updateTile() để cập nhật graph
 */
export class VehicleGraph extends THREE.Group {
    constructor(size) {
        super();
        this.size = size;

        /** Lưới tiles — null nếu không phải đường @type {(VehicleGraphTile|null)[][]} */
        this.tiles = [];

        /** Group chứa tất cả xe đang chạy */
        this.vehicles = new THREE.Group();
        this.add(this.vehicles);

        /** Helper hiển thị debug graph (mặc định ẩn) */
        this.helper = new VehicleGraphHelper();
        this.add(this.helper);

        // Khởi tạo lưới tiles rỗng (null = chưa có đường)
        for (let x = 0; x < this.size; x++) {
            const column = [];
            for (let y = 0; y < this.size; y++) {
                column.push(null);
            }
            this.tiles.push(column);
        }

        // Cập nhật helper lần đầu
        this.helper.refreshView(this);

        // Bắt đầu spawn xe định kỳ
        this.spawnIntervalId = setInterval(this.spawnVehicle.bind(this), config.vehicle.spawnInterval);
    }

    dispose() {
        clearInterval(this.spawnIntervalId);
        while (this.vehicles.children.length > 0) {
            this.vehicles.children[0].dispose();
        }
    }

    /**
     * Cập nhật vị trí tất cả xe — gọi mỗi frame trong render loop
     */
    updateVehicles() {
        for (const vehicle of this.vehicles.children) {
            vehicle.simulate();
        }
    }

    /**
     * Cập nhật 1 tile khi đường thay đổi
     * @param {number} x - tọa độ X
     * @param {number} y - tọa độ Y
     * @param {object|null} road - object đường (cần .rotation.y và .style), null nếu xóa đường
     */
    updateTile(x, y, road) {
        const existingTile = this.getTile(x, y);
        // Lấy tiles lân cận
        const leftTile = this.getTile(x - 1, y);
        const rightTile = this.getTile(x + 1, y);
        const topTile = this.getTile(x, y - 1);
        const bottomTile = this.getTile(x, y + 1);

        // Ngắt kết nối tile hiện tại và các cạnh liền kề
        existingTile?.disconnectAll();
        leftTile?.getWorldRightSide()?.out?.disconnectAll();
        rightTile?.getWorldLeftSide()?.out?.disconnectAll();
        topTile?.getWorldBottomSide()?.out?.disconnectAll();
        bottomTile?.getWorldTopSide()?.out?.disconnectAll();

        if (road) {
            // Tạo tile mới đúng loại (straight, corner, v.v.)
            const tile = VehicleGraphTile.create(x, y, road.rotation.y, road.style);
            if (!tile) return;

            // Kết nối tile mới với các tile lân cận (2 chiều)
            if (leftTile) {
                tile.getWorldLeftSide().out?.connect(leftTile.getWorldRightSide().in);
                leftTile.getWorldRightSide().out?.connect(tile.getWorldLeftSide().in);
            }
            if (rightTile) {
                tile.getWorldRightSide().out?.connect(rightTile.getWorldLeftSide().in);
                rightTile.getWorldLeftSide().out?.connect(tile.getWorldRightSide().in);
            }
            if (topTile) {
                tile.getWorldTopSide().out?.connect(topTile.getWorldBottomSide().in);
                topTile.getWorldBottomSide().out?.connect(tile.getWorldTopSide().in);
            }
            if (bottomTile) {
                tile.getWorldBottomSide().out?.connect(bottomTile.getWorldTopSide().in);
                bottomTile.getWorldTopSide().out?.connect(tile.getWorldBottomSide().in);
            }

            // Xóa tile cũ khỏi scene, thêm tile mới
            if (existingTile) existingTile.removeFromParent();
            this.tiles[x][y] = tile;
            this.add(tile);
        } else {
            // Xóa đường
            if (existingTile) existingTile.removeFromParent();
            this.tiles[x][y] = null;
        }

        // Cập nhật visualization
        this.helper.refreshView(this);
    }

    /**
     * Lấy tile tại tọa độ (x, y), trả về null nếu ngoài biên
     * @param {number} x
     * @param {number} y
     * @returns {VehicleGraphTile|null}
     */
    getTile(x, y) {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            return this.tiles[x][y];
        }
        return null;
    }

    /**
     * Spawn 1 xe tại tile ngẫu nhiên có kết nối
     */
    spawnVehicle() {
        const startingTile = this.getStartingTile();
        if (!startingTile) return;

        const origin = startingTile.getRandomNode();
        const destination = origin?.getRandomNextNode();

        if (origin && destination) {
            // Lấy model xe ngẫu nhiên từ cache
            const model = getVehicleModel();
            if (!model) return; // Model chưa load xong

            const vehicle = new Vehicle(origin, destination, model);
            this.vehicles.add(vehicle);
        }
    }

    /**
     * Lấy 1 tile đường ngẫu nhiên để spawn xe
     * @returns {VehicleGraphTile|null}
     */
    getStartingTile() {
        const tiles = [];
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const tile = this.getTile(x, y);
                if (tile) tiles.push(tile);
            }
        }

        if (tiles.length === 0) return null;
        return tiles[Math.floor(tiles.length * Math.random())];
    }
}
