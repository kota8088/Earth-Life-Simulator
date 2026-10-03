/* =========================================================
   HUD
   スタミナゲージ・視点モード表示・オートセーブ通知を更新
   ========================================================= */

export class HUD {
  constructor() {
    this.staminaFill = document.getElementById("stamina-fill");
    this.staminaValue = document.getElementById("stamina-value");
    this.viewModeIndicator = document.getElementById("view-mode-indicator");
    this.autosaveIndicator = document.getElementById("autosave-indicator");

    this.autosaveTimer = null;
  }

  updateStamina(current, max) {
    const ratio = Math.max(0, Math.min(1, current / max));
    const percent = Math.round(ratio * 100);

    if (this.staminaFill) {
      this.staminaFill.style.width = `${percent}%`;
      if (ratio < 0.3) {
        this.staminaFill.classList.add("low");
      } else {
        this.staminaFill.classList.remove("low");
      }
    }

    if (this.staminaValue) {
      this.staminaValue.textContent = percent.toString();
    }
  }

  updateViewMode(mode) {
    if (this.viewModeIndicator) {
      this.viewModeIndicator.textContent =
        mode === "first" ? "1st Person" : "3rd Person";
    }
  }

  /**
   * オートセーブ通知を一瞬表示する
   */
  showAutosave() {
    if (!this.autosaveIndicator) return;

    this.autosaveIndicator.classList.remove("hidden");
    // 次フレームで opacity を 1 にしてトランジションを効かせる
    requestAnimationFrame(() => {
      this.autosaveIndicator.classList.add("show");
    });

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosaveTimer = setTimeout(() => {
      this.autosaveIndicator.classList.remove("show");
      setTimeout(() => {
        this.autosaveIndicator.classList.add("hidden");
      }, 300);
    }, 1500);
  }
}