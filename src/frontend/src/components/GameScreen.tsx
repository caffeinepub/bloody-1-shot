import type { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useRef, useState } from "react";
import type { backendInterface } from "../backend";
import type { GameRoomView, KillFeedEntry } from "../types/game";
import { GamePhase, type Team } from "../types/game";
import GameCanvas from "./GameCanvas";

interface GameScreenProps {
  roomId: bigint;
  actor: backendInterface;
  myPrincipal: Principal;
  myTeam: Team;
  onGameEnd: (state: GameRoomView) => void;
}

export default function GameScreen({
  roomId,
  actor,
  myPrincipal,
  myTeam,
  onGameEnd,
}: GameScreenProps) {
  const [roomState, setRoomState] = useState<GameRoomView | null>(null);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const state = await actor.getRoomState(roomId);
      setRoomState(state as GameRoomView);
      if (state.phase === GamePhase.ended) {
        onGameEnd(state as GameRoomView);
      }
    } catch (e) {
      console.error("Failed to fetch state:", e);
    }
  }, [actor, roomId, onGameEnd]);

  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 300);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchState]);

  if (!roomState) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-mono text-sm">
            Loading battle...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Phase banner */}
      {roomState.phase === GamePhase.waiting && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-yellow-400/90 text-black text-center py-1 text-sm font-bold uppercase tracking-wider">
          Waiting for players... Game starts when ready!
        </div>
      )}
      <GameCanvas
        roomId={roomId}
        actor={actor}
        myPrincipal={myPrincipal}
        myTeam={myTeam}
        roomState={roomState}
        onGameEnd={onGameEnd}
        onKillFeed={setKillFeed}
        killFeed={killFeed}
      />
    </div>
  );
}
