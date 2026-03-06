import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Plus, RefreshCw, Sword, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { backendInterface } from "../backend";
import type { GameRoomView } from "../types/game";
import { Team } from "../types/game";

interface LobbyScreenProps {
  actor: backendInterface;
  playerName: string;
  onJoinRoom: (roomId: bigint, team: Team) => void;
}

export default function LobbyScreen({
  actor,
  playerName,
  onJoinRoom,
}: LobbyScreenProps) {
  const [rooms, setRooms] = useState<GameRoomView[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team>(Team.blue);
  const [activeTab, setActiveTab] = useState<"join" | "create">("join");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState<bigint | null>(null);
  const [creating, setCreating] = useState(false);

  const refreshRooms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await actor.listRooms();
      setRooms(list as GameRoomView[]);
    } catch (_e) {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    refreshRooms();
    const interval = setInterval(refreshRooms, 3000);
    return () => clearInterval(interval);
  }, [refreshRooms]);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      setError("Room name required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const roomId = await actor.createRoom(roomName.trim());
      await actor.joinRoom(roomId, playerName, selectedTeam);
      onJoinRoom(roomId, selectedTeam);
    } catch (_e) {
      setError("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (roomId: bigint) => {
    setJoining(roomId);
    setError("");
    try {
      await actor.joinRoom(roomId, playerName, selectedTeam);
      onJoinRoom(roomId, selectedTeam);
    } catch (_e) {
      setError("Failed to join room");
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 grain-overlay">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="font-display font-extrabold text-5xl md:text-6xl tracking-tighter mb-1 text-foreground">
          <span className="text-red-team">BLOODY</span>{" "}
          <span className="text-primary">1 SHOT</span>
        </h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase font-mono">
          Desert Sniper Arena
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-muted-foreground text-sm">Playing as</span>
          <Badge
            variant="outline"
            className="font-mono text-primary border-primary/40"
          >
            {playerName}
          </Badge>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg"
      >
        {/* Tabs */}
        <div className="flex mb-4 bg-card rounded-lg overflow-hidden border border-border">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-all ${
              activeTab === "join"
                ? "bg-primary/20 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("join")}
            data-ocid="lobby.tab"
          >
            <LogIn className="inline w-4 h-4 mr-2" />
            Join Room
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase transition-all ${
              activeTab === "create"
                ? "bg-primary/20 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("create")}
            data-ocid="lobby.tab"
          >
            <Plus className="inline w-4 h-4 mr-2" />
            Create Room
          </button>
        </div>

        {/* Team Selector */}
        <div className="mb-4 bg-card border border-border rounded-lg p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Choose Your Team
          </p>
          <div className="grid grid-cols-2 gap-3" data-ocid="lobby.team_select">
            <button
              type="button"
              onClick={() => setSelectedTeam(Team.blue)}
              className={`py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
                selectedTeam === Team.blue
                  ? "bg-blue-team/20 border-2 border-blue-team text-blue-team shadow-glow-blue"
                  : "bg-card border border-border text-muted-foreground hover:border-blue-team/40"
              }`}
            >
              🔵 BLUE TEAM
            </button>
            <button
              type="button"
              onClick={() => setSelectedTeam(Team.red)}
              className={`py-3 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
                selectedTeam === Team.red
                  ? "bg-red-team/20 border-2 border-red-team text-red-team shadow-glow-red"
                  : "bg-card border border-border text-muted-foreground hover:border-red-team/40"
              }`}
            >
              🔴 RED TEAM
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "join" ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Available Rooms
                </p>
                <button
                  type="button"
                  onClick={refreshRooms}
                  disabled={loading}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div
                className="space-y-2 min-h-[120px]"
                data-ocid="lobby.room_list"
              >
                {rooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Sword className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">No rooms available — create one!</p>
                  </div>
                ) : (
                  rooms.map((room, idx) => (
                    <motion.div
                      key={room.id.toString()}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between bg-background/60 border border-border rounded-lg px-3 py-2"
                      data-ocid={`lobby.room.item.${idx + 1}`}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">
                          {room.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {room.players.length}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs py-0 ${
                              room.phase === "playing"
                                ? "text-yellow-400 border-yellow-400/40"
                                : room.phase === "ended"
                                  ? "text-muted-foreground"
                                  : "text-green-400 border-green-400/40"
                            }`}
                          >
                            {room.phase}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={joining === room.id || room.phase === "ended"}
                        onClick={() => handleJoin(room.id)}
                        className="font-bold text-xs uppercase tracking-wider"
                        data-ocid="lobby.join_room_button"
                      >
                        {joining === room.id ? "Joining..." : "JOIN"}
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                New Battle Room
              </p>
              <div className="space-y-3">
                <div>
                  <Input
                    placeholder="Room name (e.g. Desert Storm)"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    data-ocid="lobby.room_name_input"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !roomName.trim()}
                  className={`w-full font-display font-bold uppercase tracking-widest ${
                    selectedTeam === Team.blue
                      ? "bg-blue-team/80 hover:bg-blue-team text-white"
                      : "bg-red-team/80 hover:bg-red-team text-white"
                  }`}
                  data-ocid="lobby.create_room_button"
                >
                  {creating ? "Creating..." : "CREATE & JOIN BATTLE"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-red-team text-sm text-center font-medium"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Controls legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center max-w-lg"
      >
        {[
          { key: "WASD", desc: "Move" },
          { key: "SPACE", desc: "Jump" },
          { key: "C", desc: "Crouch" },
          { key: "R", desc: "Reload" },
        ].map(({ key, desc }) => (
          <div
            key={key}
            className="bg-card/60 border border-border rounded px-3 py-2"
          >
            <kbd className="font-mono text-primary font-bold text-sm">
              {key}
            </kbd>
            <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>
          </div>
        ))}
      </motion.div>
      <p className="mt-2 text-muted-foreground text-xs font-mono">
        Click to Shoot • One shot kills
      </p>
    </div>
  );
}
