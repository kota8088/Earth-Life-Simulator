/* =========================================================
   Obstacles
   障害物（箱）を配置し、プレイヤーとの衝突判定を行う
   ========================================================= */

import {
  Cartesian3,
  Color,
} from "cesium";

const EARTH_RADIUS = 6378137.0;
const PLAYER_RADIUS = 0.5;
const PLAYER_HEIGHT = 1.7;

export class Obstacles {
  constructor(viewer) {
    this.viewer = viewer;
    this.items = [];

    this.placeDefaults();
  }

  placeDefaults() {
    const baseLon = 138.0;
    const baseLat = 35.0;

    const defs = [
      { dLon: 0.0006, dLat: 0.0004, size: 20, height: 6, color: "#ff8a4c" },
      { dLon: -0.0004, dLat: 0.0007, size: 15, height: 10, color: "#6bb6ff" },
      { dLon: 0.0002, dLat: -0.0005, size: 25, height: 4, color: "#a0ffb4" },
    ];

    for (const def of defs) {
      this.addBox({
        longitude: baseLon + def.dLon,
        latitude: baseLat + def.dLat,
        size: def.size,
        height: def.height,
        color: def.color,
      });
    }
  }

  addBox({ longitude, latitude, size, height, color }) {
    const position = Cartesian3.fromDegrees(
      longitude,
      latitude,
      height / 2
    );

    const entity = this.viewer.entities.add({
      position: position,
      box: {
        dimensions: new Cartesian3(size, size, height),
        material: Color.fromCssColorString(color).withAlpha(0.75),
        outline: true,
        outlineColor: Color.WHITE.withAlpha(0.6),
      },
    });

    this.items.push({
      longitude,
      latitude,
      size,
      height,
      entity,
    });
  }

  resolveCollision(playerLon, playerLat, playerHeight) {
    let pushLon = 0;
    let pushLat = 0;
    let collided = false;

    for (const item of this.items) {
      const boxBottom = 0;
      const boxTop = item.height;

      const playerBottom = playerHeight;
      const playerTop = playerHeight + PLAYER_HEIGHT;

      if (playerTop < boxBottom || playerBottom > boxTop) {
        continue;
      }

      const dLonMeters = this.lonToMeters(
        playerLon - item.longitude,
        playerLat
      );
      const dLatMeters = this.latToMeters(playerLat - item.latitude);

      const halfSize = item.size / 2;

      const overlapX = halfSize + PLAYER_RADIUS - Math.abs(dLonMeters);
      const overlapY = halfSize + PLAYER_RADIUS - Math.abs(dLatMeters);

      if (overlapX > 0 && overlapY > 0) {
        collided = true;

        if (overlapX < overlapY) {
          const sign = dLonMeters >= 0 ? 1 : -1;
          pushLon += this.metersToLon(overlapX * sign, playerLat);
        } else {
          const sign = dLatMeters >= 0 ? 1 : -1;
          pushLat += this.metersToLat(overlapY * sign);
        }
      }
    }

    return { collided, pushLon, pushLat };
  }

  lonToMeters(dLonDeg, latDeg) {
    const latRad = (latDeg * Math.PI) / 180;
    return ((dLonDeg * Math.PI) / 180) * EARTH_RADIUS * Math.cos(latRad);
  }

  latToMeters(dLatDeg) {
    return ((dLatDeg * Math.PI) / 180) * EARTH_RADIUS;
  }

  metersToLon(meters, latDeg) {
    const latRad = (latDeg * Math.PI) / 180;
    return (meters / (EARTH_RADIUS * Math.cos(latRad))) * (180 / Math.PI);
  }

  metersToLat(meters) {
    return (meters / EARTH_RADIUS) * (180 / Math.PI);
  }
}