import * as THREE from 'three';

// Hướng lên — dùng làm gốc để xoay cone
const UP = new THREE.Vector3(0, 1, 0);

// Geometry dùng chung (tiết kiệm bộ nhớ)
const NODE_GEOMETRY = new THREE.SphereGeometry(0.03, 6, 6);
const EDGE_GEOMETRY = new THREE.ConeGeometry(0.02, 1, 6);

// Màu sắc
const EDGE_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x5050ff });
const CONNECTED_MATERIAL = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const DISCONNECTED_MATERIAL = new THREE.MeshBasicMaterial({ color: 0xff0000 });

/**
 * Helper hiển thị đồ thị xe dưới dạng spheres + cones
 * Mặc định ẩn — bật visible = true để debug
 */
export class VehicleGraphHelper extends THREE.Group {
    constructor() {
        super();
        // Mặc định ẩn
        this.visible = false;
    }

    /**
     * Xóa và vẽ lại toàn bộ visualization từ graph
     * @param {import('./vehicleGraph.js').VehicleGraph} graph
     */
    refreshView(graph) {
        // Chỉ vẽ khi đang hiển thị — tránh tạo mesh thừa
        if (!this.visible) return;

        this.clear();

        for (let x = 0; x < graph.size; x++) {
            for (let y = 0; y < graph.size; y++) {
                const tile = graph.getTile(x, y);
                if (!tile) continue;

                // Vẽ từng node con của tile
                for (const node of tile.children) {
                    this.createNodeVisualization(node);
                }
            }
        }
    }

    /**
     * Vẽ 1 node (sphere) và các edge (cone mũi tên) tới nodes kế tiếp
     * @param {import('./vehicleGraphNode.js').VehicleGraphNode} node
     */
    createNodeVisualization(node) {
        // Lấy vị trí world
        const nodeWorldPos = new THREE.Vector3();
        node.getWorldPosition(nodeWorldPos);

        // Sphere: xanh nếu có kết nối, đỏ nếu không
        const material = node.next.length > 0 ? CONNECTED_MATERIAL : DISCONNECTED_MATERIAL;
        const nodeMesh = new THREE.Mesh(NODE_GEOMETRY, material);
        nodeMesh.position.copy(nodeWorldPos);

        // Vẽ mũi tên cho mỗi kết nối
        if (node.next.length > 0) {
            for (const nextNode of node.next) {
                const nextWorldPos = new THREE.Vector3();
                nextNode.getWorldPosition(nextWorldPos);

                const edgeVector = new THREE.Vector3().copy(nextWorldPos).sub(nodeWorldPos);
                const distance = edgeVector.length();

                const edgeMesh = new THREE.Mesh(EDGE_GEOMETRY, EDGE_MATERIAL);
                edgeMesh.scale.set(1, distance, 1);
                edgeMesh.quaternion.setFromUnitVectors(UP, edgeVector.clone().normalize());

                const offset = new THREE.Vector3(0, distance / 2, 0)
                    .applyQuaternion(edgeMesh.quaternion.clone());

                edgeMesh.position.set(
                    nodeWorldPos.x + offset.x,
                    nodeWorldPos.y + offset.y,
                    nodeWorldPos.z + offset.z
                );

                this.add(edgeMesh);
            }
        }

        this.add(nodeMesh);
    }
}
