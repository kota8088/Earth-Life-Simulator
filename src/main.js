import "./style.css";

import {
  Ion,
  Viewer,
  Cartesian3,
  Color,
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";

import { Game } from "./game/Game.js";

// ========================================
// Cesium のアセットパス
// ========================================

window.CESIUM_BASE_URL = "/cesiumStatic";

// ========================================
// Cesium ion トークン
// ========================================

const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

// ========================================
// HTML要素
// ========================================

const loadingScreen = document.getElementById("loading-screen");
const errorScreen = document.getElementById("error-screen");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");

// ========================================
// エラー表示
// ========================================

function showError(message) {
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }

  if (errorScreen) {
    errorScreen.classList.remove("hidden");
  }

  if (errorMessage) {
    errorMessage.textContent = message;
  }

  console.error("[Earth Life Simulator]", message);
}

// ========================================
// ローディング終了
// ========================================

function hideLoading() {
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }
}

// ========================================
// 再読み込み
// ========================================

if (retryButton) {
  retryButton.addEventListener("click", () => {
    window.location.reload();
  });
}

// ========================================
// Cesium初期化
// ========================================

function init() {
  try {
    // ========================================
    // トークン確認
    // ========================================

    if (!ionToken) {
      throw new Error(
        "Cesium ion トークンが設定されていません。.env.local の VITE_CESIUM_ION_TOKEN を確認してください。"
      );
    }

    // ========================================
    // Cesium ionへトークンを設定
    // ========================================

    Ion.defaultAccessToken = ionToken;

    // ========================================
    // Viewer作成
    // ========================================

    const viewer = new Viewer("cesiumContainer", {
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
    });

    // ========================================
    // 初期カメラ
    // 日本付近
    // ========================================

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        138.0,
        36.0,
        12000000.0
      ),
    });

    // ========================================
    // 背景色
    // ========================================

    viewer.scene.backgroundColor =
      Color.fromCssColorString("#000010");

    // ========================================
    // カメラ操作
    // ========================================

    const controller =
      viewer.scene.screenSpaceCameraController;

    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;

    // ========================================
    // デバッグ用
    // ========================================

    window.__viewer = viewer;

    console.log(
      "🌎 Earth Life Simulator - Cesium Viewer initialized!"
    );

    // ========================================
    // Phase 2: ゲーム初期化
    // ========================================

    const game = new Game(viewer);
    game.start();
    window.__game = game;

    // ========================================
    // ローディング終了
    // ========================================

    hideLoading();

  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : "不明なエラーが発生しました。";

    showError(message);
  }
}

// ========================================
// 起動
// ========================================

init();