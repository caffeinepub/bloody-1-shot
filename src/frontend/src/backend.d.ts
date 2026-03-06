import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GameRoomView {
    id: bigint;
    name: string;
    players: Array<PlayerView>;
    winningTeam?: Team;
    phase: GamePhase;
    blueTeamKills: bigint;
    redTeamKills: bigint;
}
export interface Position {
    x: number;
    y: number;
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
export interface UserProfile {
    name: string;
}
export enum GamePhase {
    ended = "ended",
    playing = "playing",
    waiting = "waiting"
}
export enum Team {
    red = "red",
    blue = "blue"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRoom(name: string): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getRoomState(roomId: bigint): Promise<GameRoomView>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinRoom(roomId: bigint, name: string | null, team: Team): Promise<void>;
    listRooms(): Promise<Array<GameRoomView>>;
    movePlayer(roomId: bigint, position: Position, crouching: boolean, jumping: boolean): Promise<void>;
    reload(roomId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    shoot(roomId: bigint, targetId: Principal): Promise<boolean>;
}
