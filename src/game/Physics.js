/* =========================================================
   Physics
   重力・接地・ジャンプを処理
   ========================================================= */

import { Cartographic } from "cesium";

// 重力加速度（m/s^2）※ゲーム的に強め
const GRAVITY = -18.0;

// ジャンプ初速（m/s）
const JUMP_VELOCITY = 7.5;

// 地面判定の許容誤差（m）
const GROUND_EPSILON = 0.1;

// プレイヤーの体の高さ（m）
const PLAYER_HEIGHT = 1.7;

export class Physics {
  constructor(viewer, player) {
    this.viewer = viewer;
    this.player = player;

    // 垂直方向の速度（m/s）
    this.verticalVelocity = 0;

    // プレイヤーの体の高さ
    this.playerEyeHeight = PLAYER_HEIGHT;
  }

  /**
   * 初期位置を地面にスナップする
   * Game の初期化時に1回だけ呼ぶ
   */
  snapToGround() {
    const player = this.player;
    const groundHeight = this.getGroundHeight(
      player.longitude,
      player.latitude
    );

    player.height = groundHeight;
    this.verticalVelocity = 0;
    player.isGrounded = true;

    if (player.entity) {
      player.entity.position = player.getPosition();
    }

    return groundHeight;
  }

  /**
   * 1フレーム分の物理更新
   * @param {number} dt 経過秒
   * @param {boolean} jumpRequested ジャンプ要求
   */
  update(dt, jumpRequested) {
    const player = this.player;

    // ---- ジャンプ ----
    if (jumpRequested && player.isGrounded) {
      this.verticalVelocity = JUMP_VELOCITY;
      player.isGrounded = false;
    }

    // ---- 重力 ----
    this.verticalVelocity += GRAVITY * dt;

    // ---- 高さ更新 ----
    player.height += this.verticalVelocity * dt;

    // ---- 地面判定 ----
    const groundHeight = this.getGroundHeight(
      player.longitude,
      player.latitude
    );

    if (player.height <= groundHeight + GROUND_EPSILON) {
      player.height = groundHeight;
      this.verticalVelocity = 0;
      player.isGrounded = true;
    } else {
      player.isGrounded = false;
    }
  }

  /**
   * 指定した緯度経度の地面高さを取得
   * 地形が取得できない場合は 0 を返す
   */
  getGroundHeight(longitude, latitude) {
    const carto = Cartographic.fromDegrees(longitude, latitude);
    const height = this.viewer.scene.globe.getHeight(carto);
    return typeof height === "number" && isFinite(height) ? height : 0;
  }

  /**
   * 垂直速度をリセット
   */
  resetVerticalVelocity() {
    this.verticalVelocity = 0;
  }
}