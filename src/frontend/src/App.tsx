import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import GameOverScreen from "./components/GameOverScreen";
import GameScreen from "./components/GameScreen";
import LobbyScreen from "./components/LobbyScreen";
import LoginScreen from "./components/LoginScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { Team } from "./types/game";
import type { GameRoomView } from "./types/game";

type AppScreen = "login" | "lobby" | "game" | "gameover";

export default function App() {
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();

  const [screen, setScreen] = useState<AppScreen>("login");
  const [playerName, setPlayerName] = useState<string>("");
  const [currentRoomId, setCurrentRoomId] = useState<bigint | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team>(Team.blue);
  const [finalRoomState, setFinalRoomState] = useState<GameRoomView | null>(
    null,
  );

  const hasIdentity = !!identity && !identity.getPrincipal().isAnonymous();

  // Save/restore player name
  useEffect(() => {
    const saved = localStorage.getItem("bloody1shot_name");
    if (saved) setPlayerName(saved);
  }, []);

  // Move to lobby once logged in and actor ready and name set
  useEffect(() => {
    if (
      hasIdentity &&
      actor &&
      !isFetching &&
      playerName &&
      screen === "login"
    ) {
      setScreen("lobby");
    }
  }, [hasIdentity, actor, isFetching, playerName, screen]);

  // Save player name to backend
  const handleSetName = useCallback(
    async (name: string) => {
      setPlayerName(name);
      localStorage.setItem("bloody1shot_name", name);
      if (actor && hasIdentity) {
        try {
          await actor.saveCallerUserProfile({ name });
        } catch (_) {
          /* ignore */
        }
      }
      setScreen("lobby");
    },
    [actor, hasIdentity],
  );

  // Load profile from backend when actor is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: playerName intentionally omitted
  useEffect(() => {
    if (!actor || !hasIdentity || isFetching) return;
    actor
      .getCallerUserProfile()
      .then((profile) => {
        if (profile?.name && !playerName) {
          setPlayerName(profile.name);
          localStorage.setItem("bloody1shot_name", profile.name);
        }
      })
      .catch(() => {});
  }, [actor, hasIdentity, isFetching]);

  const handleJoinRoom = (roomId: bigint, team: Team) => {
    setCurrentRoomId(roomId);
    setCurrentTeam(team);
    setScreen("game");
  };

  const handleGameEnd = useCallback((state: GameRoomView) => {
    setFinalRoomState(state);
    setScreen("gameover");
  }, []);

  const handlePlayAgain = () => {
    setCurrentRoomId(null);
    setFinalRoomState(null);
    setScreen("lobby");
  };

  const myPrincipal = identity?.getPrincipal();

  return (
    <>
      <Toaster />
      <AnimatePresence mode="wait">
        {screen === "login" && (
          <LoginScreen
            key="login"
            isLoggedIn={hasIdentity}
            isLoggingIn={isLoggingIn}
            isInitializing={isInitializing}
            onLogin={login}
            onSetName={handleSetName}
            savedName={playerName}
          />
        )}

        {screen === "lobby" && actor && (
          <LobbyScreen
            key="lobby"
            actor={actor}
            playerName={playerName}
            onJoinRoom={handleJoinRoom}
          />
        )}

        {screen === "game" &&
          actor &&
          currentRoomId !== null &&
          myPrincipal && (
            <GameScreen
              key="game"
              roomId={currentRoomId}
              actor={actor}
              myPrincipal={myPrincipal}
              myTeam={currentTeam}
              onGameEnd={handleGameEnd}
            />
          )}

        {screen === "gameover" && finalRoomState && myPrincipal && (
          <GameOverScreen
            key="gameover"
            roomState={finalRoomState}
            myPrincipal={myPrincipal}
            myTeam={currentTeam}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>
    </>
  );
}
