/* =========================================================
   SettingsPanel
   設定パネルの開閉・性別切替・保存ボタンを管理
   ========================================================= */

export class SettingsPanel {
  constructor({ onGenderChange, onSaveNow, saveManager }) {
    this.panel = document.getElementById("settings-panel");
    this.openButton = document.getElementById("settings-button");
    this.closeButton = document.getElementById("settings-close");
    this.genderMale = document.getElementById("gender-male");
    this.genderFemale = document.getElementById("gender-female");
    this.saveNowButton = document.getElementById("save-now");
    this.lastSaved = document.getElementById("last-saved");

    this.onGenderChange = onGenderChange;
    this.onSaveNow = onSaveNow;
    this.saveManager = saveManager;

    this.isOpen = false;
    this.bindEvents();
    this.subscribeSaveManager();
  }

  bindEvents() {
    if (this.openButton) {
      this.openButton.addEventListener("click", () => this.toggle());
    }
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => this.close());
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
    if (this.saveNowButton) {
      this.saveNowButton.addEventListener("click", () => {
        if (this.onSaveNow) this.onSaveNow();
      });
    }

    // パネル外クリックで閉じる
    document.addEventListener("click", (e) => {
      if (!this.isOpen) return;
      if (this.panel.contains(e.target)) return;
      if (this.openButton.contains(e.target)) return;
      this.close();
    });
  }

  subscribeSaveManager() {
    if (!this.saveManager) return;
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
    this.setGender(gender);
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
    this.lastSaved.textContent = `最終保存: ${hh}:${mm}`;
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.panel.classList.remove("hidden");
  }

  close() {
    this.isOpen = false;
    this.panel.classList.add("hidden");
  }
}