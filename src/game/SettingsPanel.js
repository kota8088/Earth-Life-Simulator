/* =========================================================
   SettingsPanel
   設定パネルの開閉・性別切替・FOV・保存ボタンを管理
   ========================================================= */

export class SettingsPanel {
  constructor({
    onGenderChange,
    onFovChange,
    onSaveNow,
    saveManager,
    onOpenChange,
  }) {
    this.panel = document.getElementById("settings-panel");
    this.openButton = document.getElementById("settings-button");
    this.closeButton = document.getElementById("settings-close");
    this.genderMale = document.getElementById("gender-male");
    this.genderFemale = document.getElementById("gender-female");
    this.fovSlider = document.getElementById("fov-slider");
    this.fovValue = document.getElementById("fov-value");
    this.saveNowButton = document.getElementById("save-now");
    this.lastSaved = document.getElementById("last-saved");

    this.onGenderChange = onGenderChange;
    this.onFovChange = onFovChange;
    this.onSaveNow = onSaveNow;
    this.onOpenChange = onOpenChange;
    this.saveManager = saveManager;

    this.isOpen = false;
    this.bindEvents();
    this.subscribeSaveManager();
  }

  bindEvents() {
    if (this.openButton) {
      this.openButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => {
        this.close();
      });
    }

    if (this.genderMale) {
      this.genderMale.addEventListener("click", () => {
        this.setGender("male");
      });
    }
    if (this.genderFemale) {
      this.genderFemale.addEventListener("click", () => {
        this.setGender("female");
      });
    }

    // FOV スライダー
    if (this.fovSlider) {
      this.fovSlider.addEventListener("input", (e) => {
        const value = Number(e.target.value);
        this.updateFovDisplay(value);
        if (this.onFovChange) this.onFovChange(value);
      });
    }

    if (this.saveNowButton) {
      this.saveNowButton.addEventListener("click", () => {
        if (this.onSaveNow) this.onSaveNow();
      });
    }

    document.addEventListener("click", (e) => {
      if (!this.isOpen) return;
      if (!this.panel) return;
      if (this.panel.contains(e.target)) return;
      if (this.openButton && this.openButton.contains(e.target)) return;
      this.close();
    });
  }

  subscribeSaveManager() {
    if (!this.saveManager || !this.saveManager.onSaved) return;
    this.saveManager.onSaved((savedAt) => {
      this.updateLastSaved(savedAt);
    });
  }

  setGender(gender) {
    if (this.genderMale) {
      this.genderMale.classList.toggle("active", gender === "male");
    }
    if (this.genderFemale) {
      this.genderFemale.classList.toggle("active", gender === "female");
    }
    if (this.onGenderChange) this.onGenderChange(gender);
  }

  syncGender(gender) {
    if (this.genderMale) {
      this.genderMale.classList.toggle("active", gender === "male");
    }
    if (this.genderFemale) {
      this.genderFemale.classList.toggle("active", gender === "female");
    }
  }

  /**
   * FOV スライダーの表示を同期
   */
  syncFov(value) {
    if (this.fovSlider) {
      this.fovSlider.value = String(value);
    }
    this.updateFovDisplay(value);
  }

  updateFovDisplay(value) {
    if (this.fovValue) {
      this.fovValue.textContent = `${value}°`;
    }
  }

  updateLastSaved(savedAt) {
    if (!this.lastSaved) return;
    if (!savedAt) {
      this.lastSaved.textContent = "最終保存: --:--";
      return;
    }
    const d = new Date(savedAt);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    this.lastSaved.textContent = `最終保存: ${hh}:${mm}:${ss}`;
  }

  isOpened() {
    return this.isOpen;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (!this.panel) return;
    if (this.isOpen) return;
    this.isOpen = true;
    this.panel.classList.remove("hidden");
    if (this.onOpenChange) this.onOpenChange(true);
  }

  close() {
    if (!this.panel) return;
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.classList.add("hidden");
    if (this.onOpenChange) this.onOpenChange(false);
  }
}