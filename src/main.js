```javascript
import "./style.css";

import {
  Ion,
  Viewer,
  Cartesian3,
  Color,
  Terrain,
  ImageryLayer,
  IonImageryProvider,
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";

/* =========================================================
   Cesium ion トークン
   ========================================================= */

const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

/* =========================================================
   HTML要素
   ========================================================= */

const loadingScreen = document.getElementById("loading-screen");
const errorScreen = document.getElementById("error-screen");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");
const settingsButton = document.getElementById("settings-button");

/* =========================================================
   エラー表示
   ========================================================= */

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

/* =========================================================
   ローディング非表示
   ========================================================= */

function hideLoading() {
  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }
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
   設定ボタン
   ========================================================= */

if (settingsButton) {
  settingsButton.addEventListener("click", () => {
    console.info("設定ボタンが押されました。");
  });
}

/* =========================================================
   Cesium初期化
   ========================================================= */

async function init() {
  try {
    /* -------------------------------------------------------
       トークン確認
    ------------------------------------------------------- */

    if (!ionToken) {
      throw new Error(
        "Cesium ion トークンが設定されていません。.env.local の VITE_CESIUM_ION_TOKEN を確認してください。"
      );
    }

    Ion.defaultAccessToken = ionToken;

    /* -------------------------------------------------------
       Viewer作成
       
       baseLayer: false にして、Viewer起動時に
       不要なデフォルト画像レイヤーを読み込まない。
    ------------------------------------------------------- */

    const viewer = new Viewer("cesiumContainer", {
      terrain: Terrain.fromWorldTerrain(),

      baseLayer: false,
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

    /* -------------------------------------------------------
       Cesium ionの衛星画像
       
       Sentinel-2
       Asset ID: 3954
    ------------------------------------------------------- */

    try {
      const imageryLayer = await ImageryLayer.fromProviderAsync(
        IonImageryProvider.fromAssetId(3954)
      );

      viewer.imageryLayers.add(imageryLayer);
    } catch (imageryError) {
      console.error(
        "衛星画像の読み込みに失敗しました。",
        imageryError
      );

      /*
       * 画像が読み込めなくても地球自体は表示する。
       */
      console.warn(
        "衛星画像なしで地球を表示します。"
      );
    }

    /* -------------------------------------------------------
       初期カメラ
       日本付近
    ------------------------------------------------------- */

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        138.0,
        36.0,
        12000000.0
      ),
    });

    /* -------------------------------------------------------
       背景
    ------------------------------------------------------- */

    viewer.scene.backgroundColor =
      Color.fromCssColorString("#000010");

    /* -------------------------------------------------------
       カメラ操作
    ------------------------------------------------------- */

    const controller =
      viewer.scene.screenSpaceCameraController;

    controller.enableRotate = true;
    controller.enableZoom = true;
    controller.enableTilt = true;
    controller.enableLook = true;

    /* -------------------------------------------------------
       グローバルから確認できるようにする
    ------------------------------------------------------- */

    window.__viewer = viewer;

    /* -------------------------------------------------------
       ローディング終了
    ------------------------------------------------------- */

    hideLoading();

    console.log(
      "🌎 Earth Life Simulator - Cesium initialized!"
    );
  } catch (error) {
    const message =
      error && error.message
        ? error.message
        : "不明なエラーが発生しました。";

    showError(message);
  }
}

/* =========================================================
   起動
   ========================================================= */

init();
```
