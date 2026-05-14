import * as THREE from 'three';

/**
 * Node trong đồ thị xe — đại diện cho 1 điểm trên đường
 * Xe di chuyển từ node này sang node kế tiếp (next)
 * Kế thừa THREE.Object3D để có position trong scene graph
 */
export class VehicleGraphNode extends THREE.Object3D {
    constructor(x, y) {
        super();
        // Đặt vị trí node trong local space của tile cha
        this.position.set(x, 0, y);

        /**
         * Danh sách các node kế tiếp mà xe có thể đi tới
         * @type {VehicleGraphNode[]}
         */
        this.next = [];
    }

    /**
     * Kết nối node này tới node đích (1 chiều)
     * @param {VehicleGraphNode} node - node đích
     */
    connect(node) {
        if (!node) return;
        // Tránh kết nối trùng lặp
        if (!this.next.includes(node)) {
            this.next.push(node);
        }
    }

    /**
     * Ngắt tất cả kết nối từ node này
     */
    disconnectAll() {
        this.next = [];
    }

    /**
     * Lấy ngẫu nhiên 1 node kế tiếp — xe dùng hàm này để chọn hướng đi
     * @returns {VehicleGraphNode|null}
     */
    getRandomNextNode() {
        if (this.next.length === 0) return null;
        const i = Math.floor(this.next.length * Math.random());
        return this.next[i];
    }
}
