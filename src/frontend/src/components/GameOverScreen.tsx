import { Button } from "@/components/ui/button";
import type { Principal } from "@icp-sdk/core/principal";
import { Coins, RotateCcw, Trophy } from "lucide-react";
import { motion } from "motion/react";
import type { GameRoomView, PlayerView } from "../types/game";
import { Team } from "../types/game";

interface GameOverScreenProps {
  roomState: GameRoomView;
  myPrincipal: Principal;
  myTeam: Team;
  onPlayAgain: () => void;
}

export default function GameOverScreen({
  roomState,
  myPrincipal,
  myTeam,
  onPlayAgain,
}: GameOverScreenProps) {
  const winner = roomState.winningTeam;
  const myPid = myPrincipal.toString();
  const myPlayer = roomState.players.find((p) => p.id.toString() === myPid);
  const didWin = winner === myTeam;

  const blueTeam = roomState.players
    .filter((p) => p.team === Team.blue)
    .sort((a, b) => Number(b.kills - a.kills));
  const redTeam = roomState.players
    .filter((p) => p.team === Team.red)
    .sort((a, b) => Number(b.kills - a.kills));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 grain-overlay overflow-hidden">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
            winner === Team.blue ? "bg-blue-team/10" : "bg-red-team/10"
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl"
        data-ocid="gameover.panel"
      >
        {/* Result */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <Trophy
            className={`w-16 h-16 mx-auto mb-3 ${
              winner === Team.blue ? "text-blue-team" : "text-red-team"
            }`}
          />
          <h1
            className={`font-display font-extrabold text-6xl tracking-tighter uppercase ${
              winner === Team.blue ? "text-blue-team" : "text-red-team"
            }`}
          >
            {winner?.toUpperCase()} WINS
          </h1>
          <p
            className={`text-xl font-bold mt-2 ${didWin ? "text-yellow-400" : "text-muted-foreground"}`}
          >
            {didWin
              ? "🎉 Victory! Your team conquered the desert!"
              : "💀 Defeat. Better luck next round."}
          </p>

          {myPlayer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 inline-flex items-center gap-4 bg-card border border-border rounded-xl px-6 py-3"
            >
              <div className="text-center">
                <div className="text-yellow-400 font-bold text-2xl flex items-center gap-1">
                  <Coins className="w-5 h-5" />
                  {myPlayer.coins.toString()}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  Coins
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-white font-bold text-2xl">
                  ☠ {myPlayer.kills.toString()}
                </div>
                <div className="text-muted-foreground text-xs uppercase tracking-wider">
                  Kills
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Score table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {/* Blue Team */}
          <div className="bg-card border border-blue-team/30 rounded-xl overflow-hidden">
            <div className="bg-blue-team/20 border-b border-blue-team/30 px-4 py-2 flex items-center justify-between">
              <span className="font-display font-bold text-blue-team uppercase tracking-wider text-sm">
                🔵 Blue Team
              </span>
              <span className="text-blue-team font-bold">
                {roomState.blueTeamKills.toString()} kills
              </span>
            </div>
            <div className="divide-y divide-border">
              {blueTeam.map((p: PlayerView, i: number) => (
                <div
                  key={p.id.toString()}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${
                    p.id.toString() === myPid ? "bg-blue-team/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[100px]">
                      {p.name ?? "Unknown"}
                      {p.id.toString() === myPid && (
                        <span className="ml-1 text-xs text-blue-team">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-yellow-400">
                      ⚡{p.coins.toString()}
                    </span>
                    <span className="text-white">☠{p.kills.toString()}</span>
                  </div>
                </div>
              ))}
              {blueTeam.length === 0 && (
                <div className="px-4 py-4 text-muted-foreground text-xs text-center">
                  No players
                </div>
              )}
            </div>
          </div>

          {/* Red Team */}
          <div className="bg-card border border-red-team/30 rounded-xl overflow-hidden">
            <div className="bg-red-team/20 border-b border-red-team/30 px-4 py-2 flex items-center justify-between">
              <span className="font-display font-bold text-red-team uppercase tracking-wider text-sm">
                🔴 Red Team
              </span>
              <span className="text-red-team font-bold">
                {roomState.redTeamKills.toString()} kills
              </span>
            </div>
            <div className="divide-y divide-border">
              {redTeam.map((p: PlayerView, i: number) => (
                <div
                  key={p.id.toString()}
                  className={`flex items-center justify-between px-4 py-2 text-sm ${
                    p.id.toString() === myPid ? "bg-red-team/10" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs">
                      {i + 1}
                    </span>
                    <span className="font-medium text-foreground truncate max-w-[100px]">
                      {p.name ?? "Unknown"}
                      {p.id.toString() === myPid && (
                        <span className="ml-1 text-xs text-red-team">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-yellow-400">
                      ⚡{p.coins.toString()}
                    </span>
                    <span className="text-white">☠{p.kills.toString()}</span>
                  </div>
                </div>
              ))}
              {redTeam.length === 0 && (
                <div className="px-4 py-4 text-muted-foreground text-xs text-center">
                  No players
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Play Again */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <Button
            onClick={onPlayAgain}
            className="font-display font-bold uppercase tracking-widest bg-primary/80 hover:bg-primary text-primary-foreground h-14 text-lg px-12"
            data-ocid="gameover.play_again_button"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            PLAY AGAIN
          </Button>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
