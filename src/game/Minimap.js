/* =========================================================
   Minimap
   小さい Cesium Viewer で周辺地図を表示する
   プレイヤー位置に追従し、向きも反映する
   ========================================================= */

import {
  Viewer,
  Cartesian3,
  Cartographic,
  Math as CesiumMath,
  Color,
  Ion,
  HeightReference,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  NearFarScalar,
} from "cesium";

// ミニマップのカメラ高度（メートル）
const CAMERA_HEIGHT = 800;

export class Minimap {
  constructor(player) {
    this.player = player;
    this.viewer = null;
    this.playerEntity = null;
    this.enabled = true;

    this.container = document.getElementById("minimap-viewer");
    if (!this.container) {
      console.warn("[Minimap] #minimap-viewer が見つかりません。");
      this.enabled = false;
      return;
    }

    this.init();
  }

  init() {
    try {
      // 小さい Viewer を作成
      this.viewer = new Viewer(this.container, {
        // ミニマップに不要な UI をすべて無効化
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        vrButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        // 情報クレジットは非表示
        creditContainer: document.createElement("div"),
        // パフォーマンス最適化
        requestRenderMode: false,
        contextOptions: {
          webgl: {
            alpha: true,
            antialias: false,
          },
        },
      });

      // 背景を透明にして、CSS の背景を見せる
      this.viewer.scene.backgroundColor = Color.TRANSPARENT;
      this.viewer.scene.globe.baseColor = Color.fromCssColorString("#0a1a2a");

      // 太陽・月・大気を無効化（ミニマップなので不要）
      this.viewer.scene.sun.show = false;
      this.viewer.scene.moon.show = false;
      this.viewer.scene.skyAtmosphere.show = false;
      this.viewer.scene.skyBox.show = false;
      this.viewer.scene.fog.enabled = false;

      // カメラ操作をすべて無効化
      const controller = this.viewer.scene.screenSpaceCameraController;
      controller.enableInputs = false;
      controller.enableRotate = false;
      controller.enableTranslate = false;
      controller.enableZoom = false;
      controller.enableTilt = false;
      controller.enableLook = false;

      // プレイヤー位置にマーカーを追加
      this.createPlayerMarker();

      // 初期位置へ移動
      this.update();

      console.log("[Minimap] 初期化完了");
    } catch (err) {
      console.error("[Minimap] 初期化失敗:", err);
      this.enabled = false;
    }
  }

  createPlayerMarker() {
    const player = this.player;

    this.playerEntity = this.viewer.entities.add({
      position: Cartesian3.fromDegrees(
        player.longitude,
        player.latitude,
        player.height
      ),
      point: {
        pixelSize: 10,
        color: Color.fromCssColorString("#ff5c8a"),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  /**
   * プレイヤー位置に追従する
   * 毎フレーム呼ばれる
   */
  update() {
    if (!this.enabled || !this.viewer) return;

    const player = this.player;

    // 位置を Cesium の Cartesian3 で取得
    const position = Cartesian3.fromDegrees(
      player.longitude,
      player.latitude,
      player.height
    );

    // カメラをプレイヤーの真上に配置
    // 北を上にして、heading は 0 に固定（マップなので）
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        player.longitude,
        player.latitude,
        CAMERA_HEIGHT
      ),
      orientation: {
        heading: 0,
        pitch: CesiumMath.toRadians(-90),
        roll: 0,
      },
    });

    // プレイヤーマーカーの位置を更新
    if (this.playerEntity) {
      this.playerEntity.position = position;
    }

    // 向きを反映する場合は、ピンを回転させる
    // （点では回転できないので、後で必要ならビルボードに変更）
  }

  /**
   * 表示/非表示
   */
  setVisible(visible) {
    if (!this.container) return;
    if (visible) {
      this.container.style.visibility = "visible";
    } else {
      this.container.style.visibility = "hidden";
    }
  }

  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this.playerEntity = null;
  }
}