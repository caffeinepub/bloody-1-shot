import type { Principal } from "@icp-sdk/core/principal";

export interface Position {
  x: number;
  y: number;
}

export enum Team {
  red = "red",
  blue = "blue",
}

export enum GamePhase {
  ended = "ended",
  playing = "playing",
  waiting = "waiting",
}

export interface PlayerView {
  id: Principal;
  jumping: boolean;
  crouching: boolean;
  name?: string;
  coins: bigint;
  team: Team;
  isAlive: boolean;
  position: Position;
  kills: bigint;
}

export interface GameRoomView {
  id: bigint;
  name: string;
  players: PlayerView[];
  winningTeam?: Team;
  phase: GamePhase;
  blueTeamKills: bigint;
  redTeamKills: bigint;
}

export interface MapObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "rock" | "crate" | "wall";
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface MuzzleFlash {
  x: number;
  y: number;
  angle: number;
  life: number;
}

export interface KillFeedEntry {
  killer: string;
  killed: string;
  time: number;
}

export type AppScreen = "login" | "lobby" | "game" | "gameover";

export interface LocalPlayerState {
  position: Position;
  crouching: boolean;
  jumping: boolean;
  ammoLoaded: boolean;
  reloading: boolean;
  reloadStartTime: number;
}
