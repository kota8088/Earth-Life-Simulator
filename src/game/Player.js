/* =========================================================
   Player
   プレイヤーの状態管理（位置・性別・視点・スタミナ・速度）
   ========================================================= */

import {
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  Color,
  HeightReference,
} from "cesium";

const GENDER_EMOJI = {
  male: "🧍‍♂️",
  female: "🧍‍♀️",
};

export class Player {
  constructor(viewer, saveData) {
    this.viewer = viewer;

    // ---- 性別 ----
    this.gender = saveData.gender || "male";

    // ---- 位置（緯度・経度・高さ）----
    this.longitude = saveData.longitude ?? 138.0;
    this.latitude = saveData.latitude ?? 35.0;
    this.height = saveData.height ?? 0;

    // ---- 視点 ----
    this.viewMode = saveData.viewMode || "first";
    this.heading = saveData.heading ?? 0;
    this.pitch = saveData.pitch ?? -0.2;

    // ---- スタミナ ----
    this.stamina = saveData.stamina ?? 100;
    this.maxStamina = 100;
    this.staminaRecoverRate = 15; // 1秒あたりの回復量
    this.staminaConsumeRate = 25; // 1秒あたりの消費量
    this.staminaRecoverThreshold = 30; // この値以上回復したら再ダッシュ可
    this.isExhausted = false;

    // ---- 速度 ----
    this.velocity = { north: 0, east: 0, up: 0 };
    this.isGrounded = false;

    // ---- Cesium Entity（絵文字ラベル）----
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
        heightReference: HeightReference.CLAMP_TO_GROUND,
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

  /**
   * 位置を Cesium の Cartesian3 で取得
   */
  getPosition() {
    return Cartesian3.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    );
  }

  /**
   * 位置を Cartographic で取得
   */
  getCartographic() {
    return Cartographic.fromDegrees(
      this.longitude,
      this.latitude,
      this.height
    );
  }

  /**
   * 位置を更新（Cesium Entity にも反映）
   */
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

  /**
   * セーブ用データを抽出
   */
  toSaveData() {
    return {
      gender: this.gender,
      longitude: this.longitude,
      latitude: this.latitude,
      height: this.height,
      viewMode: this.viewMode,
      heading: this.heading,
      pitch: this.pitch,
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