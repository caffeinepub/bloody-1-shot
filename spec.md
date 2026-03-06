# Bloody 1 Shot

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- A 2D top-down / side-view desert-themed sniper shooter game
- Two teams: Blue Team vs Red Team (each has 1-4 players)
- Multiplayer support via backend lobby/game state (turn-based or real-time simulation with polling)
- Desert map with cover objects (rocks, crates, sand dunes)
- Sniper rifle mechanic: aim with mouse, shoot with left click, one-shot kill
- Reload mechanic: press R to reload (animation/timer)
- Jump: Space bar
- Crouch: Ctrl or C key (reduces hitbox, affects aim)
- Movement: WASD or arrow keys
- Kill reward: +10 coins per kill
- Win condition: first team to 5 kills wins
- Coin display per player and team scoreboard
- "Game Over" screen showing winning team
- Player respawn after death (limited or none -- one shot kill means no respawn per round; new round starts)

### Modify
- None (new project)

### Remove
- None

## Implementation Plan
1. Backend (Motoko):
   - Game rooms/lobbies: create room, join room, get room state
   - Player state: team assignment, position (x/y), alive/dead, coins, kill count
   - Game state: team scores (kills), game phase (waiting/playing/ended), winning team
   - Actions: move, shoot, reload, jump, crouch
   - Coin tracking per player
   - Win condition check (5 kills)

2. Frontend:
   - Canvas-based 2D renderer (top-down desert map)
   - Desert terrain: sandy background, rocks/crates as obstacles
   - Player sprites: blue vs red colored characters with sniper rifle
   - Mouse-aim crosshair for sniper
   - HUD: team scores, coin count, reload indicator, kill feed
   - Lobby screen: create/join room, team selection
   - Game Over screen with winner announcement
   - Keyboard controls: WASD (move), Space (jump), C/Ctrl (crouch), R (reload), LMB (shoot)
   - Polling backend for multiplayer sync
