/* =========================================================
   UIManager
   カーソル表示と Pointer Lock を一元管理する
   ESCで解除された場合はクリックで復帰する
   ========================================================= */

export class UIManager {
  constructor(controls, canvasElement) {
    this.controls = controls;
    this.canvas = canvasElement;

    // "game" : ゲーム中（カーソル非表示・Pointer Lock 有効）
    // "ui"   : UI中（カーソル表示・Pointer Lock 解除）
    // "none" : スタート画面など
    this.mode = "none";

    this.openUICount = 0;
    this.escReleased = false;

    // ESCで解除されたときのクリック復帰
    // document 全体で受ける（キャンバス限定だと届かないことがある）
    this.onDocumentClick = (e) => {
      if (!this.escReleased) return;
      if (this.mode === "ui") return;

      this.escReleased = false;
      document.body.classList.remove("esc-released");
      this.controls.requestLock();
    };

    // ESC 検知
    this.onKeyDown = (e) => {
      if (e.code === "Escape") {
        if (this.mode === "game") {
          this.escReleased = true;
          document.body.classList.add("esc-released");
        }
      }
    };

    // Pointer Lock 復帰検知
    this.onLockChange = () => {
      const locked = document.pointerLockElement === this.canvas;
      if (locked) {
        this.escReleased = false;
        document.body.classList.remove("esc-released");
      }
    };

    document.addEventListener("click", this.onDocumentClick);
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("pointerlockchange", this.onLockChange);
  }

  enterNoneMode() {
    this.mode = "none";
    this.escReleased = false;
    document.body.classList.remove("game-mode", "ui-mode", "esc-released");
    document.body.classList.add("none-mode");
    this.controls.releaseLock();
  }

  enterGameMode() {
    this.mode = "game";
    this.escReleased = false;
    this.openUICount = 0;
    document.body.classList.remove("none-mode", "ui-mode", "esc-released");
    document.body.classList.add("game-mode");
    this.controls.requestLock();
  }

  enterUIMode() {
    this.openUICount += 1;
    if (this.mode === "ui") return;

    this.mode = "ui";
    this.escReleased = false;
    document.body.classList.remove("none-mode", "game-mode", "esc-released");
    document.body.classList.add("ui-mode");
    this.controls.releaseLock();
  }

  exitUIMode() {
    this.openUICount = Math.max(0, this.openUICount - 1);
    if (this.openUICount > 0) return;

    this.enterGameMode();
  }

  isGameMode() {
    return this.mode === "game";
  }

  isUIMode() {
    return this.mode === "ui";
  }

  destroy() {
    document.removeEventListener("click", this.onDocumentClick);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("pointerlockchange", this.onLockChange);
  }
}