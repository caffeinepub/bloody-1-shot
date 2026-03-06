import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Game types
  public type Team = { #blue; #red };
  public type GamePhase = { #waiting; #playing; #ended };

  public type Position = {
    x : Float;
    y : Float;
  };

  public type PlayerView = {
    id : Principal;
    name : ?Text;
    team : Team;
    position : Position;
    isAlive : Bool;
    crouching : Bool;
    jumping : Bool;
    coins : Nat;
    kills : Nat;
  };

  public type GameRoomView = {
    id : Nat;
    name : Text;
    players : [PlayerView];
    blueTeamKills : Nat;
    redTeamKills : Nat;
    phase : GamePhase;
    winningTeam : ?Team;
  };

  // Room data
  type Player = PlayerView;
  type GameRoom = {
    id : Nat;
    name : Text;
    players : Map.Map<Principal, Player>;
    blueTeamKills : Nat;
    redTeamKills : Nat;
    phase : GamePhase;
    winningTeam : ?Team;
  };

  module GameRoom {
    public func compare(gameRoom1 : GameRoom, gameRoom2 : GameRoom) : Order.Order {
      switch (Text.compare(gameRoom1.name, gameRoom2.name)) {
        case (#equal) { Nat.compare(gameRoom1.id, gameRoom2.id) };
        case (order) { order };
      };
    };
  };

  var nextRoomId = 1;
  let gameRooms = Map.empty<Nat, GameRoom>();

  func getRoomOrThrow(roomId : Nat) : GameRoom {
    switch (gameRooms.get(roomId)) {
      case (null) { Runtime.trap("Room does not exist") };
      case (?room) { room };
    };
  };

  func getPlayerOrThrow(players : Map.Map<Principal, Player>, playerId : Principal) : Player {
    switch (players.get(playerId)) {
      case (null) { Runtime.trap("Player does not exist in this room") };
      case (?player) { player };
    };
  };

  func addPlayerToRoom(room : GameRoom, player : Player) : GameRoom {
    let newPlayers = room.players.clone();
    newPlayers.add(player.id, player);
    {
      id = room.id;
      name = room.name;
      players = newPlayers;
      blueTeamKills = room.blueTeamKills;
      redTeamKills = room.redTeamKills;
      phase = room.phase;
      winningTeam = room.winningTeam;
    };
  };

  func checkWinCondition(room : GameRoom) : GameRoom {
    if (room.blueTeamKills >= 5) {
      {
        id = room.id;
        name = room.name;
        players = room.players.clone();
        blueTeamKills = room.blueTeamKills;
        redTeamKills = room.redTeamKills;
        phase = #ended;
        winningTeam = ?#blue;
      };
    } else if (room.redTeamKills >= 5) {
      {
        id = room.id;
        name = room.name;
        players = room.players.clone();
        blueTeamKills = room.blueTeamKills;
        redTeamKills = room.redTeamKills;
        phase = #ended;
        winningTeam = ?#red;
      };
    } else { room };
  };

  func toPlayerView(player : Player) : PlayerView {
    {
      id = player.id;
      name = player.name;
      team = player.team;
      position = player.position;
      isAlive = player.isAlive;
      crouching = player.crouching;
      jumping = player.jumping;
      coins = player.coins;
      kills = player.kills;
    };
  };

  func toGameRoomView(room : GameRoom) : GameRoomView {
    let playersArray = room.players.values().toArray().map(toPlayerView);
    {
      id = room.id;
      name = room.name;
      players = playersArray;
      blueTeamKills = room.blueTeamKills;
      redTeamKills = room.redTeamKills;
      phase = room.phase;
      winningTeam = room.winningTeam;
    };
  };

  // Public functions

  public shared ({ caller }) func createRoom(name : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };
    let roomId = nextRoomId;
    nextRoomId += 1;

    let room : GameRoom = {
      id = roomId;
      name;
      players = Map.empty<Principal, Player>();
      blueTeamKills = 0;
      redTeamKills = 0;
      phase = #waiting;
      winningTeam = null;
    };
    gameRooms.add(roomId, room);
    roomId;
  };

  public shared ({ caller }) func joinRoom(roomId : Nat, name : ?Text, team : Team) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };
    let room = getRoomOrThrow(roomId);
    let player : Player = {
      id = caller;
      name;
      team;
      position = { x = 0.0; y = 0.0 };
      isAlive = true;
      crouching = false;
      jumping = false;
      coins = 0;
      kills = 0;
    };
    let updatedRoom = addPlayerToRoom(room, player);
    gameRooms.add(roomId, updatedRoom);
  };

  public query ({ caller }) func listRooms() : async [GameRoomView] {
    let roomsArray = gameRooms.values().toArray();
    roomsArray.sort().map(
      func(r) { toGameRoomView(r) }
    );
  };

  public shared ({ caller }) func movePlayer(roomId : Nat, position : Position, crouching : Bool, jumping : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can move");
    };
    let room = getRoomOrThrow(roomId);
    let player = getPlayerOrThrow(room.players, caller);
    let updatedPlayer = {
      id = player.id;
      name = player.name;
      team = player.team;
      position;
      isAlive = player.isAlive;
      crouching;
      jumping;
      coins = player.coins;
      kills = player.kills;
    };
    let updatedRoom = addPlayerToRoom(room, updatedPlayer);
    gameRooms.add(roomId, updatedRoom);
  };

  public shared ({ caller }) func shoot(roomId : Nat, targetId : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can shoot");
    };
    let room = getRoomOrThrow(roomId);
    let shooter = getPlayerOrThrow(room.players, caller);
    let target = getPlayerOrThrow(room.players, targetId);

    if (not shooter.isAlive) { Runtime.trap("Shooter is not alive") };
    if (not target.isAlive) { Runtime.trap("Target already dead") };

    let updatedTarget = {
      id = target.id;
      name = target.name;
      team = target.team;
      position = target.position;
      isAlive = false;
      crouching = target.crouching;
      jumping = target.jumping;
      coins = target.coins;
      kills = target.kills;
    };

    let shooterCoins = shooter.coins + 10;
    let shooterKills = shooter.kills + 1;
    let updatedShooter = {
      id = shooter.id;
      name = shooter.name;
      team = shooter.team;
      position = shooter.position;
      isAlive = shooter.isAlive;
      crouching = shooter.crouching;
      jumping = shooter.jumping;
      coins = shooterCoins;
      kills = shooterKills;
    };

    let updatedPlayers = room.players.clone();
    updatedPlayers.add(shooter.id, updatedShooter);
    updatedPlayers.add(target.id, updatedTarget);

    let newBlueKills = if (shooter.team == #blue) { room.blueTeamKills + 1 } else { room.blueTeamKills };
    let newRedKills = if (shooter.team == #red) { room.redTeamKills + 1 } else { room.redTeamKills };

    let updatedRoom = {
      id = room.id;
      name = room.name;
      players = updatedPlayers;
      blueTeamKills = newBlueKills;
      redTeamKills = newRedKills;
      phase = room.phase;
      winningTeam = room.winningTeam;
    };

    let finalRoom = checkWinCondition(updatedRoom);
    gameRooms.add(roomId, finalRoom);
    true;
  };

  public query ({ caller }) func getRoomState(roomId : Nat) : async GameRoomView {
    // Public function - anyone can view room state (for spectating)
    toGameRoomView(getRoomOrThrow(roomId));
  };

  public shared ({ caller }) func reload(roomId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reload");
    };
    let room = getRoomOrThrow(roomId);
    // Verify caller is in the room
    let _ = getPlayerOrThrow(room.players, caller);
  };
};
