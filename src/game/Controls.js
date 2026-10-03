/* =========================================================
   Controls
   キーボード・マウス入力を管理
   Pointer Lock API による視点操作
   ========================================================= */

export class Controls {
  constructor(domElement) {
    this.dom = domElement;

    // ---- キー状態 ----
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      dash: false,
    };

    // ---- マウス移動量（毎フレームで消費）----
    this.mouseDelta = { x: 0, y: 0 };

    // ---- Pointer Lock 状態 ----
    this.isLocked = false;

    // ---- イベント購読者 ----
    this.listeners = {
      toggleView: new Set(),
      jump: new Set(),
      lockChange: new Set(),
    };

    this.bindEvents();
  }

  bindEvents() {
    // ---- キーボード ----
    this.onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
          this.keys.forward = true;
          break;
        case "KeyS":
          this.keys.backward = true;
          break;
        case "KeyA":
          this.keys.left = true;
          break;
        case "KeyD":
          this.keys.right = true;
          break;
        case "Space":
          e.preventDefault();
          if (!this.keys.jump) {
            this.emit("jump");
          }
          this.keys.jump = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.keys.dash = true;
          break;
        case "KeyV":
          if (!e.repeat) {
            this.emit("toggleView");
          }
          break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
          this.keys.forward = false;
          break;
        case "KeyS":
          this.keys.backward = false;
          break;
        case "KeyA":
          this.keys.left = false;
          break;
        case "KeyD":
          this.keys.right = false;
          break;
        case "Space":
          this.keys.jump = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          this.keys.dash = false;
          break;
      }
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    // ---- マウス移動 ----
    this.onMouseMove = (e) => {
      if (!this.isLocked) return;
      this.mouseDelta.x += e.movementX || 0;
      this.mouseDelta.y += e.movementY || 0;
    };

    document.addEventListener("mousemove", this.onMouseMove);

    // ---- Pointer Lock 状態変化 ----
    this.onLockChange = () => {
      this.isLocked = document.pointerLockElement === this.dom;
      this.emit("lockChange", this.isLocked);
    };

    document.addEventListener("pointerlockchange", this.onLockChange);
  }

  /**
   * Pointer Lock を要求する
   */
  requestLock() {
    if (this.dom.requestPointerLock) {
      this.dom.requestPointerLock();
    }
  }

  /**
   * マウス移動量を取得してリセット
   */
  consumeMouseDelta() {
    const dx = this.mouseDelta.x;
    const dy = this.mouseDelta.y;
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return { dx, dy };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
      return () => this.listeners[event].delete(callback);
    }
    return () => {};
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) {
        try {
          cb(payload);
        } catch (err) {
          console.warn(`[Controls] ${event} リスナーでエラー`, err);
        }
      }
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onLockChange);
  }
}