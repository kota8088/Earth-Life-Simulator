/* =========================================================
   CameraController
   一人称 / 三人称カメラを制御
   FOV を Player から反映
   ========================================================= */

import {
  Cartesian3,
  Matrix4,
  HeadingPitchRange,
  Math as CesiumMath,
} from "cesium";

const MOUSE_SENSITIVITY = 0.002;
const PITCH_MIN = -Math.PI / 2 + 0.05;
const PITCH_MAX = Math.PI / 2 - 0.05;
const THIRD_PERSON_DISTANCE = 8.0;
const THIRD_PERSON_PITCH_OFFSET = -0.3;
const EYE_HEIGHT = 1.7;

export class CameraController {
  constructor(viewer, player) {
    this.viewer = viewer;
    this.player = player;
    this.canvas = viewer.canvas;

    // Cesium 標準のカメラ操作を完全に無効化
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableInputs = false;
    controller.enableRotate = false;
    controller.enableTranslate = false;
    controller.enableZoom = false;
    controller.enableTilt = false;
    controller.enableLook = false;

    // Cesium のキャンバスへの Pointer Events を capture フェーズで停止
    this.onPointerEvent = (e) => {
      e.stopPropagation();
    };

    const events = [
      "pointerdown",
      "pointerup",
      "pointermove",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "contextmenu",
    ];
    this.boundEvents = events;

    for (const name of events) {
      this.canvas.addEventListener(name, this.onPointerEvent, true);
    }

    this.canvas.addEventListener("wheel", this.onPointerEvent, {
      capture: true,
      passive: false,
    });
  }

  applyMouseDelta(dx, dy) {
    const player = this.player;

    player.heading += dx * MOUSE_SENSITIVITY;
    player.pitch -= dy * MOUSE_SENSITIVITY;

    if (player.pitch < PITCH_MIN) player.pitch = PITCH_MIN;
    if (player.pitch > PITCH_MAX) player.pitch = PITCH_MAX;

    const TWO_PI = Math.PI * 2;
    player.heading = ((player.heading % TWO_PI) + TWO_PI) % TWO_PI;
  }

  /**
   * FOV をカメラに反映
   */
  applyFov() {
    const player = this.player;
    const fovRad = CesiumMath.toRadians(player.fov);

    // Cesium の frustum.fov は「水平方向の画角」
    // FPS の慣習に合わせて「垂直画角」として扱いたい場合は
    // アスペクト比から変換する
    const camera = this.viewer.camera;
    const aspect =
      this.viewer.scene.canvas.clientWidth /
      this.viewer.scene.canvas.clientHeight;

    // 垂直 FOV → 水平 FOV への変換
    // hFov = 2 * atan(tan(vFov/2) * aspect)
    const hFov = 2 * Math.atan(Math.tan(fovRad / 2) * aspect);

    if (camera.frustum && "fov" in camera.frustum) {
      camera.frustum.fov = hFov;
    }
  }

  update() {
    const player = this.player;

    this.applyFov();

    if (player.viewMode === "first") {
      this.updateFirstPerson();
    } else {
      this.updateThirdPerson();
    }
  }

  updateFirstPerson() {
    const player = this.player;

    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);

    const position = Cartesian3.fromDegrees(
      player.longitude,
      player.latitude,
      player.height + EYE_HEIGHT
    );

    this.viewer.camera.setView({
      destination: position,
      orientation: {
        heading: player.heading,
        pitch: player.pitch,
        roll: 0,
      },
    });
  }

  updateThirdPerson() {
    const player = this.player;

    const target = Cartesian3.fromDegrees(
      player.longitude,
      player.latitude,
      player.height + 1.0
    );

    this.viewer.camera.lookAt(
      target,
      new HeadingPitchRange(
        player.heading,
        player.pitch + THIRD_PERSON_PITCH_OFFSET,
        THIRD_PERSON_DISTANCE
      )
    );

    this.viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  }

  destroy() {
    for (const name of this.boundEvents) {
      this.canvas.removeEventListener(name, this.onPointerEvent, true);
    }
    this.canvas.removeEventListener("wheel", this.onPointerEvent, true);
  }
}