import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CROUCH_RADIUS,
  MAP_OBSTACLES,
  PLAYER_RADIUS,
} from "../constants/map";
import type {
  MapObstacle,
  MuzzleFlash,
  Particle,
  PlayerView,
  Position,
} from "../types/game";

const SAND_COLOR = "#c2935a";
const SAND_DARK = "#b07c45";
const SAND_LIGHT = "#d4a86a";
const ROCK_COLOR = "#8b7355";
const ROCK_DARK = "#6e5c44";
const CRATE_COLOR = "#7a6840";
const CRATE_DARK = "#5c4f2d";
const WALL_COLOR = "#9b8565";
const WALL_DARK = "#7a6845";

let sandPatternCache: CanvasPattern | null = null;

function getSandPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (sandPatternCache) return sandPatternCache;
  const patCanvas = document.createElement("canvas");
  patCanvas.width = 64;
  patCanvas.height = 64;
  const pCtx = patCanvas.getContext("2d")!;
  pCtx.fillStyle = SAND_COLOR;
  pCtx.fillRect(0, 0, 64, 64);
  // Add noise-like texture
  for (let i = 0; i < 120; i++) {
    const rx = Math.random() * 64;
    const ry = Math.random() * 64;
    const rr = Math.random() * 2 + 0.5;
    pCtx.beginPath();
    pCtx.arc(rx, ry, rr, 0, Math.PI * 2);
    pCtx.fillStyle = Math.random() > 0.5 ? SAND_DARK : SAND_LIGHT;
    pCtx.globalAlpha = 0.5;
    pCtx.fill();
    pCtx.globalAlpha = 1;
  }
  sandPatternCache = ctx.createPattern(patCanvas, "repeat");
  return sandPatternCache;
}

export function drawBackground(ctx: CanvasRenderingContext2D) {
  const pattern = getSandPattern(ctx);
  if (pattern) {
    ctx.fillStyle = pattern;
  } else {
    ctx.fillStyle = SAND_COLOR;
  }
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Vignette
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_HEIGHT * 0.3,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_HEIGHT * 0.8,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Spawn zone indicators
  ctx.strokeStyle = "rgba(80, 120, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(20, 20, 120, CANVAS_HEIGHT - 40);
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(255, 70, 70, 0.25)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(CANVAS_WIDTH - 140, 20, 120, CANVAS_HEIGHT - 40);
  ctx.setLineDash([]);

  // Spawn zone labels
  ctx.fillStyle = "rgba(80, 120, 255, 0.4)";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BLUE BASE", 80, 15);

  ctx.fillStyle = "rgba(255, 70, 70, 0.4)";
  ctx.fillText("RED BASE", CANVAS_WIDTH - 80, 15);
  ctx.textAlign = "left";
}

export function drawObstacles(ctx: CanvasRenderingContext2D) {
  for (const obs of MAP_OBSTACLES) {
    const { x, y, width, height, type } = obs;

    if (type === "rock") {
      // Rock shape with rounded corners
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 12);
      const rockGrad = ctx.createLinearGradient(x, y, x + width, y + height);
      rockGrad.addColorStop(0, ROCK_COLOR);
      rockGrad.addColorStop(1, ROCK_DARK);
      ctx.fillStyle = rockGrad;
      ctx.fill();
      // highlight
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, width - 8, height / 3);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      // shadow bottom
      ctx.beginPath();
      ctx.roundRect(x, y + height - 6, width, 6, [0, 0, 8, 8]);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fill();
      ctx.restore();
    } else if (type === "crate") {
      ctx.save();
      // Crate box
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      const crateGrad = ctx.createLinearGradient(x, y, x, y + height);
      crateGrad.addColorStop(0, CRATE_COLOR);
      crateGrad.addColorStop(1, CRATE_DARK);
      ctx.fillStyle = crateGrad;
      ctx.fill();
      // Crate lines
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
      ctx.moveTo(x + width / 2, y);
      ctx.lineTo(x + width / 2, y + height);
      ctx.stroke();
      // highlight
      ctx.beginPath();
      ctx.rect(x + 2, y + 2, width - 4, height / 2 - 2);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.restore();
    } else {
      // Wall / sandbag
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 4);
      const wallGrad = ctx.createLinearGradient(x, y, x, y + height);
      wallGrad.addColorStop(0, WALL_COLOR);
      wallGrad.addColorStop(1, WALL_DARK);
      ctx.fillStyle = wallGrad;
      ctx.fill();
      // sandbag segments
      const segments = Math.floor(width / 20);
      for (let i = 0; i < segments; i++) {
        ctx.beginPath();
        ctx.ellipse(
          x + 10 + i * 20,
          y + height / 2,
          8,
          height / 2 - 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.fillStyle = "transparent";
    ctx.fill();
    ctx.restore();
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerView,
  mouseX: number,
  mouseY: number,
  isLocalPlayer: boolean,
) {
  if (!player.isAlive) return;

  const { position, team, crouching, jumping, name } = player;
  const { x, y } = position;
  const radius = crouching ? CROUCH_RADIUS : PLAYER_RADIUS;

  const teamColor = team === "blue" ? "#4488ff" : "#ff4444";
  const teamDark = team === "blue" ? "#2255cc" : "#cc2222";
  const teamGlow =
    team === "blue" ? "rgba(68,136,255,0.4)" : "rgba(255,68,68,0.4)";

  // Angle from player to mouse
  const angle = Math.atan2(mouseY - y, mouseX - x);

  ctx.save();

  // Jump shadow
  if (jumping) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      y + radius + 4,
      radius * 0.7,
      radius * 0.3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();
  }

  const yOffset = jumping ? -12 : 0;

  // Glow
  ctx.shadowColor = teamGlow;
  ctx.shadowBlur = isLocalPlayer ? 20 : 10;

  // Body
  ctx.beginPath();
  ctx.arc(x, y + yOffset, radius, 0, Math.PI * 2);
  const bodyGrad = ctx.createRadialGradient(
    x - radius * 0.3,
    y + yOffset - radius * 0.3,
    1,
    x,
    y + yOffset,
    radius,
  );
  bodyGrad.addColorStop(0, teamColor);
  bodyGrad.addColorStop(1, teamDark);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Border
  ctx.strokeStyle = isLocalPlayer ? "#ffffff" : "rgba(255,255,255,0.4)";
  ctx.lineWidth = isLocalPlayer ? 2.5 : 1.5;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Sniper rifle arm
  const gunLength = radius + 20;
  const gunBaseX = x + Math.cos(angle) * (radius * 0.5);
  const gunBaseY = y + yOffset + Math.sin(angle) * (radius * 0.5);
  const gunEndX = x + Math.cos(angle) * (radius + gunLength);
  const gunEndY = y + yOffset + Math.sin(angle) * (radius + gunLength);

  ctx.beginPath();
  ctx.moveTo(gunBaseX, gunBaseY);
  ctx.lineTo(gunEndX, gunEndY);
  ctx.strokeStyle = "#333";
  ctx.lineWidth = crouching ? 3 : 5;
  ctx.lineCap = "round";
  ctx.stroke();

  // Scope on rifle
  const scopeX = x + Math.cos(angle) * (radius + gunLength * 0.6);
  const scopeY = y + yOffset + Math.sin(angle) * (radius + gunLength * 0.6);
  ctx.beginPath();
  ctx.arc(scopeX, scopeY, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#888";
  ctx.fill();

  // Aim line (laser sight) - only for local player
  if (isLocalPlayer) {
    ctx.beginPath();
    ctx.moveTo(gunEndX, gunEndY);
    ctx.lineTo(mouseX, mouseY);
    const lineGrad = ctx.createLinearGradient(gunEndX, gunEndY, mouseX, mouseY);
    lineGrad.addColorStop(0, `${teamColor}99`);
    lineGrad.addColorStop(1, `${teamColor}00`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Name tag
  if (name) {
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${crouching ? 10 : 11}px "Mona Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(name, x, y + yOffset - radius - 4);
    ctx.shadowBlur = 0;
    ctx.textBaseline = "alphabetic";
  }

  // Crouch indicator
  if (crouching) {
    ctx.beginPath();
    ctx.arc(x, y + yOffset, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,100,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function drawDeadPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerView,
  alpha: number,
) {
  const { position, team } = player;
  const { x, y } = position;
  const teamColor = team === "blue" ? "#4488ff" : "#ff4444";

  ctx.save();
  ctx.globalAlpha = alpha * 0.5;

  // X mark
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x - 12, y + 12);
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  // Blood pool
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 15, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(180, 0, 0, 0.6)";
  ctx.fill();

  ctx.restore();
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isAiming: boolean,
) {
  const size = isAiming ? 18 : 22;
  const gap = 6;
  const dotR = 1.5;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 3;

  // Lines
  // Top
  ctx.beginPath();
  ctx.moveTo(x, y - gap);
  ctx.lineTo(x, y - size);
  ctx.stroke();
  // Bottom
  ctx.beginPath();
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  // Left
  ctx.beginPath();
  ctx.moveTo(x - gap, y);
  ctx.lineTo(x - size, y);
  ctx.stroke();
  // Right
  ctx.beginPath();
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(x, y, dotR, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,100,100,0.9)";
  ctx.fill();

  ctx.restore();
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

export function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  flash: MuzzleFlash,
) {
  const alpha = flash.life / 5;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(flash.x, flash.y);
  ctx.rotate(flash.angle);

  // Flash burst
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
  grad.addColorStop(0, "rgba(255,255,200,1)");
  grad.addColorStop(0.3, "rgba(255,150,0,0.8)");
  grad.addColorStop(1, "rgba(255,50,0,0)");
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.restore();
}

export function spawnBloodParticles(
  particles: Particle[],
  x: number,
  y: number,
) {
  const colors = ["#cc0000", "#aa0000", "#ff2222", "#880000"];
  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 1;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 4 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 40 + Math.random() * 30,
      maxLife: 70,
    });
  }
}

export function updateParticles(particles: Particle[]): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // gravity
      vx: p.vx * 0.97,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

export function checkLineObstacleIntersect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  return MAP_OBSTACLES.some((obs) => {
    return lineSegmentIntersectsRect(
      x1,
      y1,
      x2,
      y2,
      obs.x,
      obs.y,
      obs.width,
      obs.height,
    );
  });
}

function lineSegmentIntersectsRect(
  lx1: number,
  ly1: number,
  lx2: number,
  ly2: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  // Check if either endpoint is inside the rect
  if (
    pointInRect(lx1, ly1, rx, ry, rw, rh) ||
    pointInRect(lx2, ly2, rx, ry, rw, rh)
  ) {
    return true;
  }
  // Check all 4 edges
  const edges = [
    [rx, ry, rx + rw, ry],
    [rx + rw, ry, rx + rw, ry + rh],
    [rx + rw, ry + rh, rx, ry + rh],
    [rx, ry + rh, rx, ry],
  ] as const;
  return edges.some(([ex1, ey1, ex2, ey2]) =>
    segmentsIntersect(lx1, ly1, lx2, ly2, ex1, ey1, ex2, ey2),
  );
}

function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const denom = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (Math.abs(denom) < 1e-10) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denom;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / denom;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

export function resolveCollision(
  newX: number,
  newY: number,
  radius: number,
): Position {
  let x = newX;
  let y = newY;

  // Clamp to canvas
  x = Math.max(radius, Math.min(CANVAS_WIDTH - radius, x));
  y = Math.max(radius, Math.min(CANVAS_HEIGHT - radius, y));

  // Resolve obstacle collisions
  for (const obs of MAP_OBSTACLES) {
    const closestX = Math.max(obs.x, Math.min(x, obs.x + obs.width));
    const closestY = Math.max(obs.y, Math.min(y, obs.y + obs.height));
    const distX = x - closestX;
    const distY = y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    if (dist < radius) {
      const pushDist = radius - dist;
      if (dist < 0.01) {
        x -= pushDist;
      } else {
        x += (distX / dist) * pushDist;
        y += (distY / dist) * pushDist;
      }
    }
  }

  return { x, y };
}
