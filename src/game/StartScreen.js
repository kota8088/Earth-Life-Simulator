/* =========================================================
   StartScreen
   起動時のスタート画面を制御
   ネオン × 未来 × 宇宙 デザイン
   ========================================================= */

export class StartScreen {
  constructor({ onStart, onOpenSettings }) {
    this.onStart = onStart;
    this.onOpenSettings = onOpenSettings;

    this.root = document.getElementById("start-screen");
    this.startButton = document.getElementById("start-button");
    this.settingsButton = document.getElementById("start-settings-button");
    this.versionLabel = document.getElementById("start-version");

    this.isVisible = true;

    if (this.versionLabel) {
      this.versionLabel.textContent = "v0.3.0";
    }

    this.bindEvents();
  }

  bindEvents() {
    if (this.startButton) {
      this.startButton.addEventListener("click", () => {
        this.hide();
        if (this.onStart) this.onStart();
      });
    }

    if (this.settingsButton) {
      this.settingsButton.addEventListener("click", () => {
        if (this.onOpenSettings) this.onOpenSettings();
      });
    }
  }

  show() {
    if (!this.root) return;
    this.root.classList.remove("hidden");
    this.isVisible = true;
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add("hidden");
    this.isVisible = false;
  }
}