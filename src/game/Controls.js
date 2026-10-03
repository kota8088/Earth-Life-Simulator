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
    this.lastUnlockTime = 0;

    // ---- イベント購読者 ----
    this.listeners = {
      toggleView: new Set(),
      toggleSettings: new Set(),
      jump: new Set(),
      lockChange: new Set(),
    };

    this.bindEvents();
  }

  /**
   * 入力欄（input / textarea / contenteditable）にフォーカスがあるか
   */
  isTextInputFocused() {
    const el = document.activeElement;
    if (!el) return false;

    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea") return true;
    if (el.isContentEditable) return true;

    return false;
  }

  bindEvents() {
    // ---- キーボード ----
    this.onKeyDown = (e) => {
      const inTextInput = this.isTextInputFocused();

      switch (e.code) {
        case "KeyW":
          if (!inTextInput) this.keys.forward = true;
          break;
        case "KeyS":
          if (!inTextInput) this.keys.backward = true;
          break;
        case "KeyA":
          if (!inTextInput) this.keys.left = true;
          break;
        case "KeyD":
          if (!inTextInput) this.keys.right = true;
          break;
        case "Space":
          if (!inTextInput) {
            e.preventDefault();
            if (!e.repeat && !this.keys.jump) {
              this.emit("jump");
            }
            this.keys.jump = true;
          }
          break;
        case "ShiftLeft":
        case "ShiftRight":
          if (!inTextInput) this.keys.dash = true;
          break;
        case "KeyV":
          if (!inTextInput && !e.repeat) {
            this.emit("toggleView");
          }
          break;
        case "KeyM":
          if (inTextInput) return;
          if (!e.repeat) {
            this.emit("toggleSettings");
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

    this.onBlur = () => {
      this.resetKeys();
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    // ---- マウス移動 ----
    this.onMouseMove = (e) => {
      if (!this.isLocked) return;
      this.mouseDelta.x += e.movementX || 0;
      this.mouseDelta.y += e.movementY || 0;
    };

    document.addEventListener("mousemove", this.onMouseMove);

    // ---- Pointer Lock 状態変化 ----
    this.onLockChange = () => {
      const wasLocked = this.isLocked;
      this.isLocked = document.pointerLockElement === this.dom;

      if (wasLocked && !this.isLocked) {
        this.lastUnlockTime = performance.now();
      }

      this.emit("lockChange", this.isLocked);
    };

    document.addEventListener("pointerlockchange", this.onLockChange);
  }

  /**
   * Pointer Lock を要求する
   * 解除直後（1秒以内）はセキュリティ制約で取得できないため、その場合はスキップ
   */
  requestLock() {
    const now = performance.now();
    if (this.lastUnlockTime && now - this.lastUnlockTime < 1000) {
      console.warn(
        "[Controls] Pointer Lock は解除直後は取得できません。少し待ってください。"
      );
      return;
    }

    if (this.dom.requestPointerLock) {
      try {
        const result = this.dom.requestPointerLock();
        // 新しいブラウザは Promise を返す
        if (result && typeof result.catch === "function") {
          result.catch((err) => {
            console.warn("[Controls] Pointer Lock 失敗:", err.message);
          });
        }
      } catch (err) {
        console.warn("[Controls] Pointer Lock 例外:", err.message);
      }
    }
  }

  /**
   * Pointer Lock を解除する
   */
  releaseLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
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

  /**
   * キー状態をすべてリセット
   */
  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.keys.dash = false;
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
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onLockChange);
  }
}