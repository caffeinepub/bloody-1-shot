import type { MapObstacle } from "../types/game";

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 580;
export const PLAYER_RADIUS = 18;
export const CROUCH_RADIUS = 12;
export const PLAYER_SPEED = 3;
export const CROUCH_SPEED = 1.5;
export const RELOAD_TIME_MS = 1500;
export const KILLS_TO_WIN = 5;
export const POLL_INTERVAL_MS = 300;
export const RESPAWN_DELAY_MS = 3000;

// Blue spawns left, Red spawns right
export const BLUE_SPAWN_X = 80;
export const BLUE_SPAWN_Y = CANVAS_HEIGHT / 2;
export const RED_SPAWN_X = CANVAS_WIDTH - 80;
export const RED_SPAWN_Y = CANVAS_HEIGHT / 2;

export const MAP_OBSTACLES: MapObstacle[] = [
  // Left-side cover cluster
  { x: 160, y: 120, width: 70, height: 50, type: "rock" },
  { x: 140, y: 280, width: 80, height: 60, type: "crate" },
  { x: 180, y: 430, width: 65, height: 45, type: "rock" },

  // Central top
  { x: 380, y: 80, width: 60, height: 55, type: "rock" },

  // Central cluster (mid-field)
  { x: 340, y: 240, width: 90, height: 60, type: "wall" },
  { x: 460, y: 310, width: 80, height: 55, type: "crate" },
  { x: 400, y: 430, width: 75, height: 50, type: "rock" },

  // Central bottom
  { x: 380, y: 490, width: 60, height: 45, type: "crate" },

  // Right-side cover cluster
  { x: 660, y: 120, width: 70, height: 50, type: "rock" },
  { x: 680, y: 280, width: 80, height: 60, type: "crate" },
  { x: 650, y: 430, width: 65, height: 45, type: "rock" },

  // Right top
  { x: 750, y: 180, width: 55, height: 50, type: "wall" },
  // Left top
  { x: 130, y: 160, width: 55, height: 45, type: "wall" },
];
