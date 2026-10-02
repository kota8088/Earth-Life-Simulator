import "./style.css";
import {
  Ion,
  Viewer,
  Cartesian3,
  Color,
  OpenStreetMapImageryProvider,
  createWorldTerrainAsync,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

/* =========================================================
   Cesium ion トークン設定
   ========================================================= */
const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

const loadingScreen = document.getElementById("loading-screen");
const errorScreen = document.getElementById("error-screen");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");
const settingsButton = document.getElementById("settings-button");

/* =========================================================
   エラー表示
   ========================================================= */
function showError(message) {
  if (loadingScreen) loadingScreen.classList.add("hidden");
  if (errorScreen) errorScreen.classList.remove("hidden");
  if (errorMessage) errorMessage.textContent = message;
  console.error("[Earth Life Simulator]", message);
}

/* =========================================================
   ローディング非表示
   ========================================================= */
function hideLoading() {
  if (loadingScreen) loadingScreen.classList.add("hidden");
}

/* =========================================================
   再読み込み
   ========================================================= */
if (retryButton) {
  retryButton.addEventListener("click", () => {
    window.location.reload();
  });
}

/* =========================================================
   設定ボタン（Phase 1ではプレースホルダのみ）
   ========================================================= */
if (settingsButton) {
  settingsButton.addEventListener("click", () => {
    // Phase 1では設定パネルは未実装
    // 将来のフェーズで拡張予定
    console.info("設定ボタンが押されました（Phase 1では未実装）");
  });
}

/* =========================================================
   初期化
   ========================================================= */
async function init() {
  try {
    if (!ionToken) {
      throw new Error(
        "Cesium ion トークンが設定されていません。.env.local の VITE_CESIUM_ION_TOKEN を確認してください。"
      );
    }

    // Cesium ion トークンを設定（コード内に直接記述しない）
    Ion.defaultAccessToken = ionToken;

    // 地形を非同期で取得
    let terrainProvider;
    try {
      terrainProvider = await createWorldTerrainAsync();
    } catch (terrainError) {
      console.warn("地形の読み込みに失敗しました。地形なしで続行します。", terrainError);
      terrainProvider = undefined;
    }

    // Viewer 作成
    const viewer = new Viewer("cesiumContainer", {
      terrainProvider,
      // 初期カメラ：日本付近
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      // Cesium ion のデフォルト画像（Bing Maps）を使用
      baseLayer: undefined,
    });

    // 日本付近へカメラを移動
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(138.0, 36.0, 12000000.0),
      orientation: {
        heading: 0.0,
        pitch: -Math.PI / 2,
        roll: 0.0,
      },
    });

    // 背景色（宇宙空間）
    viewer.scene.backgroundColor = Color.fromCssColorString("#000010");

    // マウス操作（回転・ズーム）はCesiumのデフォルトで有効
    // 必要に応じて明示的に有効化
    const controller = viewer.scene.screenSpaceCameraController;
    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;

    // 読み込み完了
    hideLoading();

    // デバッグ用（本番では削除可能）
    window.__viewer = viewer;
  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : "不明なエラーが発生しました。";
    showError(message);
  }
}

init();