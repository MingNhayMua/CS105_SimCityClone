import * as THREE from 'three';
import { VehicleGraphNode } from './vehicleGraphNode.js';
import config from '../config.js';

// Hướng mặc định của model xe trong GLB (nhìn theo +Z)
// Nếu xe vẫn ngang, thử đổi sang (0, 0, -1) hoặc (1, 0, 0)
const FORWARD = new THREE.Vector3(0, 0, 1);

/**
 * Xe — di chuyển giữa các node trong đồ thị đường
 * Kế thừa THREE.Group để chứa mesh 3D
 * Tự xóa khi hết tuổi thọ hoặc mất đường
 */
export class Vehicle extends THREE.Group {
    /**
     * @param {VehicleGraphNode} origin - node xuất phát
     * @param {VehicleGraphNode} destination - node đích
     * @param {THREE.Object3D} model - model 3D clone từ cache
     */
    constructor(origin, destination, model) {
        super();

        // Thời điểm xe được tạo (dùng để tính tuổi thọ)
        this.createdTime = Date.now();
        // Thời điểm bắt đầu di chuyển giữa 2 node hiện tại
        this.cycleStartTime = this.createdTime;

        /** Node xuất phát @type {VehicleGraphNode} */
        this.origin = origin;
        /** Node đích @type {VehicleGraphNode} */
        this.destination = destination;

        // Cache vector positions để tránh tạo mới mỗi frame
        this.originWorldPosition = new THREE.Vector3();
        this.destinationWorldPosition = new THREE.Vector3();
        this.originToDestination = new THREE.Vector3();
        this.orientation = new THREE.Vector3();

        // Tính vị trí world ban đầu
        this.updateWorldPositions();

        // Gắn model 3D vào vehicle
        // Đặt material transparent để hỗ trợ fade in/out
        model.traverse(child => {
            if (child.isMesh && child.material) {
                // Clone material để mỗi xe có opacity riêng
                child.material = child.material.clone();
                child.material.transparent = true;
            }
        });
        this.add(model);

        // Tắt raycast cho xe — không muốn click nhầm vào xe
        this.traverse(obj => { obj.raycast = () => {}; });
    }

    /**
     * Tỉ lệ tiến trình di chuyển giữa origin → destination (0 → 1)
     * Dựa trên khoảng cách và tốc độ
     */
    get cycleTime() {
        const distance = this.originToDestination.length();
        // Thời gian cần để đi hết quãng đường = khoảng cách / tốc độ
        const cycleDuration = distance / config.vehicle.speed;
        const value = (Date.now() - this.cycleStartTime) / cycleDuration;
        // Clamp giữa 0 và 1
        return Math.max(0, Math.min(value, 1));
    }

    /**
     * Tuổi của xe (ms) — dùng để xóa xe cũ và fade effect
     */
    get age() {
        return Date.now() - this.createdTime;
    }

    /**
     * Cập nhật xe mỗi frame — gọi trong render loop
     * Xử lý: di chuyển, chọn đường mới, fade, tự xóa
     */
    simulate() {
        // Xe mất origin/destination → xóa
        if (!this.origin || !this.destination) {
            this.dispose();
            return;
        }

        // Nếu node đích bị xóa khỏi scene (đường bị phá) → xóa xe
        if (!this.destination.parent) {
            this.dispose();
            return;
        }

        // Hết tuổi thọ → xóa
        if (this.age > config.vehicle.maxLifetime) {
            this.dispose();
            return;
        }

        // Đã tới đích → chọn node kế tiếp
        if (this.cycleTime === 1) {
            this.pickNewDestination();
        } else {
            // Lerp vị trí giữa origin và destination theo cycleTime
            this.position.copy(this.originWorldPosition);
            this.position.lerp(this.destinationWorldPosition, this.cycleTime);
        }

        // Cập nhật opacity (fade in/out)
        this.updateOpacity();
    }

    /**
     * Fade in khi mới spawn, fade out khi sắp hết tuổi thọ
     */
    updateOpacity() {
        const setOpacity = (opacity) => {
            this.traverse(obj => {
                if (obj.material) {
                    obj.material.opacity = Math.max(0, Math.min(opacity, 1));
                }
            });
        };

        if (this.age < config.vehicle.fadeTime) {
            // Fade in
            setOpacity(this.age / config.vehicle.fadeTime);
        } else if ((config.vehicle.maxLifetime - this.age) < config.vehicle.fadeTime) {
            // Fade out
            setOpacity((config.vehicle.maxLifetime - this.age) / config.vehicle.fadeTime);
        } else {
            setOpacity(1);
        }
    }

    /**
     * Chọn node kế tiếp khi đã tới đích
     */
    pickNewDestination() {
        this.origin = this.destination;
        this.destination = this.origin?.getRandomNextNode();
        this.updateWorldPositions();
        this.cycleStartTime = Date.now();
    }

    /**
     * Tính toán vị trí world và hướng di chuyển
     * Gọi khi bắt đầu cycle mới (origin/destination thay đổi)
     */
    updateWorldPositions() {
        if (!this.origin || !this.destination) return;

        // Lấy vị trí world của 2 node
        this.origin.getWorldPosition(this.originWorldPosition);
        this.destination.getWorldPosition(this.destinationWorldPosition);

        // Tính vector hướng di chuyển
        this.originToDestination.copy(this.destinationWorldPosition);
        this.originToDestination.sub(this.originWorldPosition);

        // Xoay xe theo hướng di chuyển
        this.orientation.copy(this.originToDestination).normalize();
        this.quaternion.setFromUnitVectors(FORWARD, this.orientation);
    }

    /**
     * Xóa xe — giải phóng material và tự remove khỏi parent
     */
    dispose() {
        this.traverse((obj) => obj.material?.dispose());
        this.removeFromParent();
    }
}
