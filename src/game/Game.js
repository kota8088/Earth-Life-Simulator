/* =========================================================
   Game
   Phase 3 のメインループ
   ========================================================= */

import { Player } from "./Player.js";
import { Controls } from "./Controls.js";
import { Physics } from "./Physics.js";
import { Obstacles } from "./Obstacles.js";
import { CameraController } from "./CameraController.js";
import { HUD } from "./HUD.js";
import { SettingsPanel } from "./SettingsPanel.js";
import { SaveManager } from "./SaveManager.js";
import { UIManager } from "./UIManager.js";
import { Minimap } from "./Minimap.js";

const WALK_SPEED = 3.0;
const DASH_SPEED = 9.0;
const AUTO_SAVE_INTERVAL = 5000;

export class Game {
  constructor(viewer) {
    this.viewer = viewer;

    this.saveManager = new SaveManager();
    const saveData = this.saveManager.load();

    this.player = new Player(viewer, saveData);
    this.controls = new Controls(viewer.canvas);
    this.physics = new Physics(viewer, this.player);
    this.obstacles = new Obstacles(viewer);
    this.cameraController = new CameraController(viewer, this.player);
    this.hud = new HUD();

    this.uiManager = new UIManager(this.controls, viewer.canvas);

    this.paused = false;

    this.settingsPanel = new SettingsPanel({
      onGenderChange: (gender) => this.handleGenderChange(gender),
      onFovChange: (value) => this.handleFovChange(value),
      onSaveNow: () => this.save(true),
      saveManager: this.saveManager,
      onOpenChange: (isOpen) => this.handleSettingsOpenChange(isOpen),
    });

    this.physics.snapToGround();

    // ---- ミニマップ ----
    this.minimap = new Minimap(this.player);

    this.settingsPanel.syncGender(this.player.gender);
    this.settingsPanel.syncFov(this.player.fov);
    this.settingsPanel.updateLastSaved(saveData.savedAt);
    this.hud.updateStamina(this.player.stamina, this.player.maxStamina);
    this.hud.updateViewMode(this.player.viewMode);

    this.bindEvents();

    this.lastTime = performance.now();
    this.autoSaveTimer = 0;
    this.running = false;
    this.requestJump = false;

    this.uiManager.enterNoneMode();
  }

  bindEvents() {
    this.controls.on("toggleView", () => {
      if (this.paused) return;
      const mode = this.player.toggleViewMode();
      this.hud.updateViewMode(mode);
      this.save();
    });

    this.controls.on("toggleSettings", () => {
      this.settingsPanel.toggle();
    });

    this.controls.on("toggleMap", () => {
      console.info("[Game] Qキー: マップは第2弾で実装");
    });

    this.controls.on("jump", () => {
      if (this.paused) return;
      this.requestJump = true;
    });

    window.addEventListener("beforeunload", () => {
      this.save();
    });
  }

  enterGameMode() {
    this.uiManager.enterGameMode();
  }

  openSettingsFromStartScreen() {
    this.uiManager.enterUIMode();
    this.settingsPanel.open();
  }

  handleSettingsOpenChange(isOpen) {
    this.paused = isOpen;

    if (isOpen) {
      this.uiManager.enterUIMode();
      this.controls.resetKeys();
    } else {
      this.uiManager.exitUIMode();
      this.controls.resetKeys();
      this.requestJump = false;
      this.lastTime = performance.now();
    }
  }

  handleGenderChange(gender) {
    this.player.setGender(gender);
    this.save();
  }

  handleFovChange(value) {
    this.player.setFov(value);
    this.save();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.save();
    this.loop();
  }

  loop = () => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (dt > 0.1) dt = 0.1;

    this.update(dt);

    requestAnimationFrame(this.loop);
  };

  update(dt) {
    if (this.paused || !this.uiManager.isGameMode()) {
      this.controls.consumeMouseDelta();
      return;
    }

    const { dx, dy } = this.controls.consumeMouseDelta();
    if (dx !== 0 || dy !== 0) {
      this.cameraController.applyMouseDelta(dx, dy);
    }

    const input = this.controls.keys;
    const isMoving =
      input.forward || input.backward || input.left || input.right;
    const isDashing =
      input.dash && !this.player.isExhausted && isMoving;

    const speed = isDashing ? DASH_SPEED : WALK_SPEED;

    let moveNorth = 0;
    let moveEast = 0;

    if (input.forward) moveNorth += 1;
    if (input.backward) moveNorth -= 1;
    if (input.right) moveEast += 1;
    if (input.left) moveEast -= 1;

    const len = Math.sqrt(moveNorth * moveNorth + moveEast * moveEast);
    if (len > 0) {
      moveNorth /= len;
      moveEast /= len;

      const heading = this.player.heading;
      const cos = Math.cos(heading);
      const sin = Math.sin(heading);

      const forwardN = moveNorth * cos - moveEast * sin;
      const forwardE = moveNorth * sin + moveEast * cos;

      const metersPerDegLat = 111320;
      const metersPerDegLon =
        111320 * Math.cos((this.player.latitude * Math.PI) / 180);

      const dLat = (forwardN * speed * dt) / metersPerDegLat;
      const dLon = (forwardE * speed * dt) / metersPerDegLon;

      let newLon = this.player.longitude + dLon;
      let newLat = this.player.latitude + dLat;

      const collision = this.obstacles.resolveCollision(
        newLon,
        newLat,
        this.player.height
      );

      if (collision.collided) {
        newLon += collision.pushLon;
        newLat += collision.pushLat;
      }

      this.player.setPosition(newLon, newLat, this.player.height);
    }

    this.updateStamina(dt, isDashing);

    const jump = this.requestJump === true;
    this.requestJump = false;
    this.physics.update(dt, jump);

    if (this.player.entity) {
      this.player.entity.position = this.player.getPosition();
    }

    this.cameraController.update();

    // ---- ミニマップ更新 ----
    if (this.minimap) {
      this.minimap.update();
    }

    this.autoSaveTimer += dt * 1000;
    if (this.autoSaveTimer >= AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.save(true);
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
      if (player.stamina < player.maxStamina) {
        player.stamina += player.staminaRecoverRate * dt;
        if (player.stamina > player.maxStamina) {
          player.stamina = player.maxStamina;
        }
      }
      if (
        player.isExhausted &&
        player.stamina >= player.staminaRecoverThreshold
      ) {
        player.isExhausted = false;
      }
    }

    this.hud.updateStamina(player.stamina, player.maxStamina);
  }

  save(isAuto = false) {
    const data = this.player.toSaveData();
    const ok = this.saveManager.save(data);
    if (ok && isAuto) {
      this.hud.showAutosave();
    }
  }

  destroy() {
    this.running = false;
    this.controls.destroy();
    this.uiManager.destroy();
    if (this.minimap) this.minimap.destroy();
    this.player.destroy();
  }
}