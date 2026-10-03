/* =========================================================
   Game
   Phase 2 のメインループ
   ========================================================= */

import { Player } from "./Player.js";
import { Controls } from "./Controls.js";
import { Physics } from "./Physics.js";
import { Obstacles } from "./Obstacles.js";
import { CameraController } from "./CameraController.js";
import { HUD } from "./HUD.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { SaveManager } from "./SaveManager.js";

// ---- 移動速度（m/s）----
const WALK_SPEED = 3.0;
const DASH_SPEED = 9.0;

// ---- 自動保存間隔（ms）----
const AUTO_SAVE_INTERVAL = 10000;

export class Game {
  constructor(viewer) {
    this.viewer = viewer;

    // ---- セーブデータ読み込み ----
    this.saveManager = new SaveManager();
    const saveData = this.saveManager.load();

    // ---- 各モジュール初期化 ----
    this.player = new Player(viewer, saveData);
    this.controls = new Controls(viewer.canvas);
    this.physics = new Physics(viewer, this.player);
    this.obstacles = new Obstacles(viewer);
    this.cameraController = new CameraController(viewer, this.player);
    this.hud = new HUD();

    this.settingsPanel = new SettingsPanel({
      onGenderChange: (gender) => this.handleGenderChange(gender),
      onSaveNow: () => this.save(),
      saveManager: this.saveManager,
    });

    // ---- 初期UI同期 ----
    this.settingsPanel.syncGender(this.player.gender);
    this.settingsPanel.updateLastSaved(saveData.savedAt);
    this.hud.updateStamina(this.player.stamina, this.player.maxStamina);
    this.hud.updateViewMode(this.player.viewMode);

    // ---- イベント購読 ----
    this.bindEvents();

    // ---- ループ管理 ----
    this.lastTime = performance.now();
    this.autoSaveTimer = 0;
    this.running = false;

    // ---- Pointer Lock 案内 ----
    this.clickToPlay = document.getElementById("click-to-play");
    if (this.clickToPlay) {
      this.clickToPlay.addEventListener("click", () => {
        this.controls.requestLock();
      });
    }
    this.updateClickToPlayVisibility();
  }

  bindEvents() {
    // ---- V キーで視点切替 ----
    this.controls.on("toggleView", () => {
      const mode = this.player.toggleViewMode();
      this.hud.updateViewMode(mode);
      this.save();
    });

    // ---- ジャンプ ----
    this.controls.on("jump", () => {
      this.requestJump = true;
    });

    // ---- Pointer Lock 状態変化 ----
    this.controls.on("lockChange", (locked) => {
      this.updateClickToPlayVisibility();
    });

    // ---- 離脱時に保存 ----
    window.addEventListener("beforeunload", () => {
      this.save();
    });
  }

  updateClickToPlayVisibility() {
    if (!this.clickToPlay) return;
    if (this.controls.isLocked) {
      this.clickToPlay.classList.add("hidden");
    } else {
      this.clickToPlay.classList.remove("hidden");
    }
  }

  handleGenderChange(gender) {
    this.player.setGender(gender);
    this.save();
  }

  /**
   * ゲーム開始
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  /**
   * メインループ
   */
  loop = () => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // タブ非アクティブ時の巨大な dt を防ぐ
    if (dt > 0.1) dt = 0.1;

    this.update(dt);

    requestAnimationFrame(this.loop);
  };

  update(dt) {
    // ---- マウス視点 ----
    const { dx, dy } = this.controls.consumeMouseDelta();
    if (dx !== 0 || dy !== 0) {
      this.cameraController.applyMouseDelta(dx, dy);
    }

    // ---- 移動入力 ----
    const input = this.controls.keys;
    const isDashing = input.dash && !this.player.isExhausted && (input.forward || input.backward || input.left || input.right);

    const speed = isDashing ? DASH_SPEED : WALK_SPEED;

    // ---- カメラ基準の移動方向 ----
    let moveNorth = 0;
    let moveEast = 0;

    if (input.forward) moveNorth += 1;
    if (input.backward) moveNorth -= 1;
    if (input.right) moveEast += 1;
    if (input.left) moveEast -= 1;

    // 正規化
    const len = Math.sqrt(moveNorth * moveNorth + moveEast * moveEast);
    if (len > 0) {
      moveNorth /= len;
      moveEast /= len;

      // カメラの heading を基準に回転
      const heading = this.player.heading;
      const cos = Math.cos(heading);
      const sin = Math.sin(heading);

      const forwardN = moveNorth * cos - moveEast * sin;
      const forwardE = moveNorth * sin + moveEast * cos;

      // メートル → 緯度経度
      const metersPerDegLat = 111320;
      const metersPerDegLon =
        111320 * Math.cos((this.player.latitude * Math.PI) / 180);

      const dLat = (forwardN * speed * dt) / metersPerDegLat;
      const dLon = (forwardE * speed * dt) / metersPerDegLon;

      // 位置更新
      let newLon = this.player.longitude + dLon;
      let newLat = this.player.latitude + dLat;

      // ---- 障害物との衝突判定 ----
      const collision = this.obstacles.resolveCollision(
        newLon,
        newLat,
        this.player.height
      );

      if (collision.collided) {
        newLon += collision.pushLon;
        newLat += collision.pushLat;
      }

      this.player.setPosition(
        newLon,
        newLat,
        this.player.height
      );
    }

    // ---- スタミナ ----
    this.updateStamina(dt, isDashing);

    // ---- 物理 ----
    const jump = this.requestJump === true;
    this.requestJump = false;
    this.physics.update(dt, jump);

    // ---- 位置を Entity に反映 ----
    this.player.entity.position = this.player.getPosition();

    // ---- カメラ更新 ----
    this.cameraController.update();

    // ---- 自動保存 ----
    this.autoSaveTimer += dt * 1000;
    if (this.autoSaveTimer >= AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.save();
    }
  }

  updateStamina(dt, isDashing) {
    const player = this.player;

    if (isDashing) {
      player.stamina -= player.staminaConsumeRate * dt;
      if (player.stamina <= 0) {
        player.stamina = 0;
        player.isExhausted = true;
      }
    } else {
      // 回復
      if (player.stamina < player.maxStamina) {
        player.stamina += player.staminaRecoverRate * dt;
        if (player.stamina > player.maxStamina) {
          player.stamina = player.maxStamina;
        }
      }
      // 一定量回復したら再ダッシュ可
      if (player.isExhausted && player.stamina >= player.staminaRecoverThreshold) {
        player.isExhausted = false;
      }
    }

    this.hud.updateStamina(player.stamina, player.maxStamina);
  }

  save() {
    const data = this.player.toSaveData();
    this.saveManager.save(data);
  }

  destroy() {
    this.running = false;
    this.controls.destroy();
    this.player.destroy();
  }
}