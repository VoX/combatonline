function player(name) {
  this.name = name;
  this.x = 50;
  this.y = 50;
  this.rotation = 0;
}

//Server Vars
var WebSocketServer = require('ws').Server,
  wss, speciallog = []; //Special messages to be sent
chatlog = [], // array with all chats cleared every update
playerList = {}, // list of all player, pid:playerobject
dirtyList = {}, // list of dirty players pid:playerobject
socketList = {}, // list of all sockets pid:playerobject
idgen = 0, //temporary solution to id generation
stepSize = 100; //time between simulation step in ms


exports.startServer = function(server) {
  console.log("Game server started");
  wss = new WebSocketServer({
    server: server
  });

  //setup simulation step call
  setInterval(doStep, stepSize);

  //setup message handling
  wss.on('connection', function(ws) {
    onConnect(ws);
    //When a new meassage is recieved,
    //attatch the socket id and do processing
    ws.on('message', function(message) {
      //TODO: check message integrety, dont want someone sending malformed messages crashing the server.
      msg = JSON.parse(message);
      msg.pid = ws.pid;
      handleMessage(msg);
    });

    //When the socket closes cleanup the gamestate to remove them
    ws.on('close', function() {
      dcPlayer(ws.pid);
    });

  });

  return wss;
};


//When a new connection is made associate a id with the socket
//This socket id will be assocated with a database id later.
//NEVER SEND THE CLIENT THIS ID!, it is for internal processing only!
function onConnect(ws){
    idgen = idgen + 1;
    ws.pid = idgen;
    socketList[ws.pid] = ws;
    //Make all players dirty so they will be sent to the new player, could refine this.
    for(p in playerList){
         dirtyList[playerList[p].name] = playerList[p];
    }
}

//Called for every simulation step. Also sends updates.
//TODO: break up simulation and updates so that we can simulate faster then we update clients
function doStep(){

    var update = {
      type: "update",
      players: dirtyList,
      chats: chatlog,
      specials: speciallog
    };

    //for every player create a update that includes all dirty players and the chatlog
    for(x in socketList) {
      socketList[x].send(JSON.stringify(update));
    }

    //print the chat messages to the console and clear the logs
    if(chatlog.length !== 0) console.log(chatlog.join("\n"));
    chatlog = [];
    speciallog = [];
    dirtyList = {};
}

//do message handling.
function handleMessage(msg) {
  if(msg.type === 'update') {
    //TODO: Check position to ensure no cheating, also only add players to dirtylist if their pos is actually dirty
    playerList[msg.pid].x = msg.player.x;
    playerList[msg.pid].y = msg.player.y;
    playerList[msg.pid].rotation = msg.player.rotation;

    dirtyList[playerList[msg.pid].name] = playerList[msg.pid];
    for(c in msg.chats) {
      chatlog.push(playerList[msg.pid].name + ":" + msg.chats[c])
    }

  } else if(msg.type === 'initid') {
    //TODO: use the players token to match up the socket with the databaseid, 
    //use the database id to set players name, right just using token as name
    var joinedplayer = new player(msg.token);
    //TODO: set spawn location here
    playerList[msg.pid] = joinedplayer;
    chatlog.push(joinedplayer.name + " connected");
    socketList[msg.pid].send(JSON.stringify({
      type: 'setplayer',
      player: joinedplayer
    }));
  }
}

//disconnect a player
function dcPlayer(pid) {
  chatlog.push(playerList[pid].name + " left");
  speciallog.push({
    type: 'delplayer',
    name: playerList[pid].name
  })
  socketList[pid].close();
  delete socketList[pid];
  delete playerList[pid]; //TODO: Make players stay for some time after they DC
}