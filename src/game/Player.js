/* =========================================================
   Player
   プレイヤーの状態管理（位置・性別・視点・スタミナ・速度・FOV）
   ========================================================= */

import {
  Cartesian3,
  Cartographic,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
} from "cesium";

const GENDER_EMOJI = {
  male: "🧍‍♂️",
  female: "🧍‍♀️",
};

export const DEFAULT_FOV = 60;
export const MIN_FOV = 30;
export const MAX_FOV = 110;

export class Player {
  constructor(viewer, saveData) {
    this.viewer = viewer;

    this.gender = saveData.gender || "male";

    this.longitude = saveData.longitude ?? 138.0;
    this.latitude = saveData.latitude ?? 35.0;
    this.height = 0;

    this.viewMode = "first";
    this.heading = saveData.heading ?? 0;
    this.pitch = saveData.pitch ?? -0.2;

    // 視野角（度）
    this.fov = saveData.fov ?? DEFAULT_FOV;

    this.stamina = saveData.stamina ?? 100;
    this.maxStamina = 100;
    this.staminaRecoverRate = 15;
    this.staminaConsumeRate = 25;
    this.staminaRecoverThreshold = 30;
    this.isExhausted = false;

    this.velocity = { north: 0, east: 0, up: 0 };
    this.isGrounded = false;

    this.createEntity();
  }

  createEntity() {
    const position = Cartesian3.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    );

    this.entity = this.viewer.entities.add({
      position: position,
      label: {
        text: GENDER_EMOJI[this.gender],
        font: "48px sans-serif",
        style: LabelStyle.FILL,
        verticalOrigin: VerticalOrigin.BOTTOM,
        horizontalOrigin: HorizontalOrigin.CENTER,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scale: 1.0,
      },
    });
  }

  setGender(gender) {
    if (gender !== "male" && gender !== "female") return;
    this.gender = gender;
    if (this.entity && this.entity.label) {
      this.entity.label.text = GENDER_EMOJI[gender];
    }
  }

  setViewMode(mode) {
    if (mode !== "first" && mode !== "third") return;
    this.viewMode = mode;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === "first" ? "third" : "first";
    return this.viewMode;
  }

  setFov(value) {
    const v = Number(value);
    if (!isFinite(v)) return;
    this.fov = Math.max(MIN_FOV, Math.min(MAX_FOV, v));
  }

  getPosition() {
    return Cartesian3.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    );
  }

  getCartographic() {
    return Cartographic.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    );
  }

  setPosition(longitude, latitude, height) {
    this.longitude = longitude;
    this.latitude = latitude;
    this.height = height;

    if (this.entity) {
      this.entity.position = Cartesian3.fromDegrees(
        longitude,
        latitude,
        height
      );
    }
  }

  toSaveData() {
    return {
      gender: this.gender,
      longitude: this.longitude,
      latitude: this.latitude,
      viewMode: this.viewMode,
      heading: this.heading,
      pitch: this.pitch,
      fov: this.fov,
      stamina: this.stamina,
    };
  }

  destroy() {
    if (this.entity) {
      this.viewer.entities.remove(this.entity);
      this.entity = null;
    }
  }
}

export { GENDER_EMOJI };