/* =========================================================
   SaveManager
   localStorage への保存・読み込みを担当
   ========================================================= */

const STORAGE_KEY = "earth-life-simulator:save";

export const DEFAULT_SAVE = {
  gender: "male",
  longitude: 138.0,
  latitude: 35.0,
  height: 0,
  viewMode: "first",
  heading: 0,
  pitch: -0.2,
  stamina: 100,
  savedAt: 0,
};

export class SaveManager {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * セーブデータを読み込む（なければデフォルトを返す）
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE };
      }
      const parsed = JSON.parse(raw);
      // 未知のキーは無視、欠けているキーはデフォルトで補完
      return { ...DEFAULT_SAVE, ...parsed };
    } catch (err) {
      console.warn("[SaveManager] セーブデータの読み込みに失敗しました。", err);
      return { ...DEFAULT_SAVE };
    }
  }

  /**
   * セーブデータを保存する
   */
  save(data) {
    try {
      const toSave = {
        gender: data.gender,
        longitude: data.longitude,
        latitude: data.latitude,
        height: data.height,
        viewMode: data.viewMode,
        heading: data.heading,
        pitch: data.pitch,
        stamina: data.stamina,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      this.notify(toSave.savedAt);
      return true;
    } catch (err) {
      console.warn("[SaveManager] セーブデータの保存に失敗しました。", err);
      return false;
    }
  }

  /**
   * 保存時刻の変化を購読する
   */
  onSaved(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(savedAt) {
    for (const cb of this.listeners) {
      try {
        cb(savedAt);
      } catch (err) {
        console.warn("[SaveManager] リスナーでエラー", err);
      }
    }
  }
}