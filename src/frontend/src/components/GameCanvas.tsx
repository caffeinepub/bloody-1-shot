import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";
import {
  BLUE_SPAWN_X,
  BLUE_SPAWN_Y,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CROUCH_RADIUS,
  CROUCH_SPEED,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  RED_SPAWN_X,
  RED_SPAWN_Y,
  RELOAD_TIME_MS,
} from "../constants/map";
import type {
  GameRoomView,
  KillFeedEntry,
  LocalPlayerState,
  MuzzleFlash,
  Particle,
  PlayerView,
} from "../types/game";
import { GamePhase, Team } from "../types/game";
import {
  checkLineObstacleIntersect,
  drawBackground,
  drawCrosshair,
  drawDeadPlayer,
  drawMuzzleFlash,
  drawObstacles,
  drawParticles,
  drawPlayer,
  resolveCollision,
  spawnBloodParticles,
  updateParticles,
} from "../utils/gameRenderer";

interface GameCanvasProps {
  roomId: bigint;
  actor: backendInterface;
  myPrincipal: Principal;
  myTeam: Team;
  roomState: GameRoomView;
  onGameEnd: (state: GameRoomView) => void;
  onKillFeed: (entries: KillFeedEntry[]) => void;
  killFeed: KillFeedEntry[];
}

export default function GameCanvas({
  roomId,
  actor,
  myPrincipal,
  myTeam,
  roomState,
  onGameEnd,
  onKillFeed,
  killFeed,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<{ x: number; y: number }>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
  });
  const particlesRef = useRef<Particle[]>([]);
  const muzzleFlashRef = useRef<MuzzleFlash | null>(null);
  const animFrameRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roomStateRef = useRef<GameRoomView>(roomState);
  const prevPlayersAliveRef = useRef<Map<string, boolean>>(new Map());
  const scaleRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const canvasOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const spawnX = myTeam === Team.blue ? BLUE_SPAWN_X : RED_SPAWN_X;
  const spawnY = myTeam === Team.blue ? BLUE_SPAWN_Y : RED_SPAWN_Y;
  const localStateRef = useRef<LocalPlayerState>({
    position: { x: spawnX, y: spawnY },
    crouching: false,
    jumping: false,
    ammoLoaded: true,
    reloading: false,
    reloadStartTime: 0,
  });

  const [hudState, setHudState] = useState({
    coins: 0n,
    kills: 0n,
    ammoLoaded: true,
    reloading: false,
    blueKills: 0n,
    redKills: 0n,
    reloadProgress: 0,
    playerCount: 0,
  });

  // Update roomState ref when prop changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs intentionally excluded
  useEffect(() => {
    const prevState = roomStateRef.current;
    roomStateRef.current = roomState;

    // Detect kills for kill feed
    const newEntries: KillFeedEntry[] = [];
    for (const p of roomState.players) {
      const pid = p.id.toString();
      const wasAlive = prevPlayersAliveRef.current.get(pid);
      if (wasAlive === true && !p.isAlive) {
        // Find who killed them - check who has more kills
        const killer = roomState.players.find(
          (k) =>
            k.team !== p.team &&
            k.kills >
              (prevState.players.find(
                (pp) => pp.id.toString() === k.id.toString(),
              )?.kills ?? 0n),
        );
        newEntries.push({
          killer: killer?.name ?? "Unknown",
          killed: p.name ?? "Unknown",
          time: Date.now(),
        });
        // Blood particles at dead player location
        spawnBloodParticles(particlesRef.current, p.position.x, p.position.y);
      }
      prevPlayersAliveRef.current.set(pid, p.isAlive);
    }

    if (newEntries.length > 0) {
      onKillFeed([...killFeed, ...newEntries].slice(-6));
    }

    // Check game end
    if (roomState.phase === GamePhase.ended) {
      onGameEnd(roomState);
    }

    // Update HUD
    const myPlayer = roomState.players.find(
      (p) => p.id.toString() === myPrincipal.toString(),
    );
    if (myPlayer) {
      localStateRef.current = {
        ...localStateRef.current,
        position: myPlayer.isAlive
          ? localStateRef.current.position
          : myPlayer.position,
      };
      setHudState((prev) => ({
        ...prev,
        coins: myPlayer.coins,
        kills: myPlayer.kills,
        blueKills: roomState.blueTeamKills,
        redKills: roomState.redTeamKills,
        playerCount: roomState.players.length,
      }));
    } else {
      setHudState((prev) => ({
        ...prev,
        blueKills: roomState.blueTeamKills,
        redKills: roomState.redTeamKills,
        playerCount: roomState.players.length,
      }));
    }
  }, [roomState, onKillFeed, onGameEnd, myPrincipal]);

  // Start polling
  useEffect(() => {
    pollTimerRef.current = setInterval(async () => {
      try {
        const state = await actor.getRoomState(roomId);
        roomStateRef.current = state as GameRoomView;
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 300);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [actor, roomId]);

  const handleReload = useCallback(async () => {
    const ls = localStateRef.current;
    if (ls.ammoLoaded || ls.reloading) return;
    localStateRef.current = {
      ...ls,
      reloading: true,
      reloadStartTime: Date.now(),
    };
    setHudState((prev) => ({ ...prev, reloading: true, ammoLoaded: false }));
    try {
      await actor.reload(roomId);
    } catch (e) {
      console.error("Reload error:", e);
    }
    setTimeout(() => {
      localStateRef.current = {
        ...localStateRef.current,
        reloading: false,
        ammoLoaded: true,
      };
      setHudState((prev) => ({ ...prev, reloading: false, ammoLoaded: true }));
    }, RELOAD_TIME_MS);
  }, [actor, roomId]);

  const handleShoot = useCallback(async () => {
    const ls = localStateRef.current;
    if (!ls.ammoLoaded || ls.reloading) return;

    const { x, y } = ls.position;
    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;

    // Find nearest enemy in line of sight
    const enemies = roomStateRef.current.players.filter(
      (p) => p.team !== myTeam && p.isAlive,
    );

    let hitTarget: PlayerView | null = null;
    let minDist = Number.POSITIVE_INFINITY;

    for (const enemy of enemies) {
      const ex = enemy.position.x;
      const ey = enemy.position.y;

      // Check if enemy is roughly in aim direction
      const aimAngle = Math.atan2(mouseY - y, mouseX - x);
      const enemyAngle = Math.atan2(ey - y, ex - x);
      const angleDiff = Math.abs(aimAngle - enemyAngle);
      const normalizedDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

      if (normalizedDiff > 0.15) continue; // Too far off aim

      // Check line of sight (no obstacles blocking)
      const blocked = checkLineObstacleIntersect(x, y, ex, ey);
      if (blocked) continue;

      const dist = Math.hypot(ex - x, ey - y);
      if (dist < minDist) {
        minDist = dist;
        hitTarget = enemy;
      }
    }

    // Muzzle flash
    const gunAngle = Math.atan2(mouseY - y, mouseX - x);
    const radius = ls.crouching ? CROUCH_RADIUS : PLAYER_RADIUS;
    muzzleFlashRef.current = {
      x: x + Math.cos(gunAngle) * (radius + 22),
      y: y + Math.sin(gunAngle) * (radius + 22),
      angle: gunAngle,
      life: 5,
    };

    // Use ammo
    localStateRef.current = { ...ls, ammoLoaded: false };
    setHudState((prev) => ({ ...prev, ammoLoaded: false }));

    if (hitTarget) {
      try {
        const hit = await actor.shoot(roomId, hitTarget.id);
        if (hit) {
          spawnBloodParticles(
            particlesRef.current,
            hitTarget.position.x,
            hitTarget.position.y,
          );
        }
      } catch (e) {
        console.error("Shoot error:", e);
      }
    }
  }, [actor, roomId, myTeam]);

  // Compute canvas scale for responsive display
  const computeScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const pW = parent.clientWidth;
    const pH = parent.clientHeight;
    const scaleX = pW / CANVAS_WIDTH;
    const scaleY = pH / CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    const scaledW = CANVAS_WIDTH * scale;
    const scaledH = CANVAS_HEIGHT * scale;
    canvas.style.width = `${scaledW}px`;
    canvas.style.height = `${scaledH}px`;
    const offsetX = (pW - scaledW) / 2;
    const offsetY = (pH - scaledH) / 2;
    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;
    scaleRef.current = { x: scale, y: scale };
    canvasOffsetRef.current = { x: offsetX, y: offsetY };
  }, []);

  // Mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        handleShoot();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      if (e.code === "KeyR") handleReload();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", computeScale);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", computeScale);
    };
  }, [handleShoot, handleReload, computeScale]);

  // Move backend sync
  const lastMoveSyncRef = useRef<number>(0);

  // Game loop
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs intentionally excluded from deps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    computeScale();

    let lastTime = 0;

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTime) / 16.67, 3);
      lastTime = timestamp;

      // --- INPUT PROCESSING ---
      const ls = localStateRef.current;
      const isCrouching =
        keysRef.current.has("KeyC") || keysRef.current.has("ControlLeft");
      const isJumping = keysRef.current.has("Space");

      let dx = 0;
      let dy = 0;
      if (keysRef.current.has("KeyW") || keysRef.current.has("ArrowUp"))
        dy -= 1;
      if (keysRef.current.has("KeyS") || keysRef.current.has("ArrowDown"))
        dy += 1;
      if (keysRef.current.has("KeyA") || keysRef.current.has("ArrowLeft"))
        dx -= 1;
      if (keysRef.current.has("KeyD") || keysRef.current.has("ArrowRight"))
        dx += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }

      const speed = isCrouching ? CROUCH_SPEED : PLAYER_SPEED;
      const radius = isCrouching ? CROUCH_RADIUS : PLAYER_RADIUS;
      const newX = ls.position.x + dx * speed * dt;
      const newY = ls.position.y + dy * speed * dt;
      const resolved = resolveCollision(newX, newY, radius);

      const moved =
        resolved.x !== ls.position.x || resolved.y !== ls.position.y;
      const stateChanged =
        isCrouching !== ls.crouching || isJumping !== ls.jumping;

      if (moved || stateChanged) {
        localStateRef.current = {
          ...ls,
          position: resolved,
          crouching: isCrouching,
          jumping: isJumping,
        };

        // Sync to backend at most every 150ms
        const now = Date.now();
        if (now - lastMoveSyncRef.current > 150) {
          lastMoveSyncRef.current = now;
          actor
            .movePlayer(roomId, resolved, isCrouching, isJumping)
            .catch(() => {});
        }
      }

      // Reload progress
      if (ls.reloading) {
        const prog = Math.min(
          100,
          ((Date.now() - ls.reloadStartTime) / RELOAD_TIME_MS) * 100,
        );
        setHudState((prev) => ({ ...prev, reloadProgress: prog }));
      }

      // Update particles
      particlesRef.current = updateParticles(particlesRef.current);

      // Update muzzle flash
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.life -= 1;
        if (muzzleFlashRef.current.life <= 0) muzzleFlashRef.current = null;
      }

      // --- RENDERING ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawBackground(ctx);
      drawObstacles(ctx);

      // Draw remote players
      const myPid = myPrincipal.toString();
      const currentState = roomStateRef.current;
      const deadPlayers: PlayerView[] = [];

      for (const p of currentState.players) {
        const isMe = p.id.toString() === myPid;
        if (!p.isAlive) {
          deadPlayers.push(p);
          continue;
        }
        if (isMe) continue; // Draw self last
        drawPlayer(ctx, p, p.position.x, p.position.y, false);
      }

      // Draw local player (with mouse aim)
      const myServerPlayer = currentState.players.find(
        (p) => p.id.toString() === myPid,
      );
      const isAlive = myServerPlayer?.isAlive !== false;

      if (isAlive) {
        const displayPlayer: PlayerView = {
          id: myPrincipal,
          name: myServerPlayer?.name ?? "You",
          team: myTeam,
          isAlive: true,
          position: localStateRef.current.position,
          crouching: localStateRef.current.crouching,
          jumping: localStateRef.current.jumping,
          coins: myServerPlayer?.coins ?? 0n,
          kills: myServerPlayer?.kills ?? 0n,
        };
        drawPlayer(
          ctx,
          displayPlayer,
          mouseRef.current.x,
          mouseRef.current.y,
          true,
        );
      }

      // Dead players
      for (const p of deadPlayers) drawDeadPlayer(ctx, p, 0.6);

      // Particles
      drawParticles(ctx, particlesRef.current);

      // Muzzle flash
      if (muzzleFlashRef.current) {
        drawMuzzleFlash(ctx, muzzleFlashRef.current);
      }

      // Crosshair
      drawCrosshair(
        ctx,
        mouseRef.current.x,
        mouseRef.current.y,
        !localStateRef.current.ammoLoaded,
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [actor, roomId, myPrincipal, myTeam, computeScale]);

  return (
    <div className="relative w-full h-full game-canvas-container">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="absolute"
        style={{ imageRendering: "pixelated" }}
        data-ocid="game.canvas_target"
      />

      {/* HUD overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        data-ocid="game.hud_panel"
      >
        {/* Team score top */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-team/20 border border-blue-team/40 rounded px-3 py-1">
            <span className="text-blue-team font-display font-bold text-sm">
              BLUE
            </span>
            <span className="text-white font-bold text-lg">
              {hudState.blueKills.toString()}
            </span>
            <span className="text-white/40 text-sm">/5</span>
          </div>
          <span className="text-white/60 font-bold">vs</span>
          <div className="flex items-center gap-2 bg-red-team/20 border border-red-team/40 rounded px-3 py-1">
            <span className="text-red-team font-display font-bold text-sm">
              RED
            </span>
            <span className="text-white font-bold text-lg">
              {hudState.redKills.toString()}
            </span>
            <span className="text-white/40 text-sm">/5</span>
          </div>
        </div>

        {/* Player info bottom-left */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <div
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${myTeam === Team.blue ? "text-blue-team" : "text-red-team"}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${myTeam === Team.blue ? "bg-blue-team" : "bg-red-team"}`}
            />
            {myTeam} TEAM
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 font-bold text-sm">
              ⚡ {hudState.coins.toString()} coins
            </span>
            <span className="text-white/70 text-sm">
              ☠ {hudState.kills.toString()} kills
            </span>
          </div>
        </div>

        {/* Ammo / reload bottom-center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          {hudState.reloading ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                RELOADING...
              </span>
              <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-100"
                  style={{ width: `${hudState.reloadProgress}%` }}
                />
              </div>
            </div>
          ) : hudState.ammoLoaded ? (
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">●</span>
              <span className="text-white/70 text-xs">LOADED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-white/40 text-sm">○</span>
              <span className="text-white/40 text-xs">Press R to reload</span>
            </div>
          )}
        </div>

        {/* Kill feed top-right */}
        <div
          className="absolute top-2 right-2 flex flex-col gap-1 items-end"
          data-ocid="game.scoreboard_panel"
        >
          {killFeed.slice(-5).map((entry) => (
            <div
              key={`${entry.killer}-${entry.killed}-${entry.time}`}
              className="killfeed-entry bg-black/60 border border-white/10 rounded px-2 py-1 text-xs flex gap-1 items-center"
            >
              <span className="text-red-team font-bold">{entry.killer}</span>
              <span className="text-white/50">☠</span>
              <span className="text-blue-team/80">{entry.killed}</span>
            </div>
          ))}
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 text-white/30 text-xs font-mono leading-relaxed text-right">
          <div>WASD: Move</div>
          <div>C: Crouch | SPACE: Jump</div>
          <div>R: Reload | Click: Shoot</div>
        </div>

        {/* Players count */}
        <div className="absolute top-2 left-2 text-white/40 text-xs">
          {hudState.playerCount} player{hudState.playerCount !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
