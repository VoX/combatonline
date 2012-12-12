//TODO:replace with db query
var colorgen = 1;

function player(name) {
  this.name = name;
  this.color = String(colorgen);
  colorgen = (colorgen % 6) + 1;
  this.dead = true;
  this.rotation = 0;
  this.fired = false;
  this.x = -100;
  this.y = -100;
  this.score = 0;
}

player.prototype.spawn = function(){
  this.dead = false;
  this.x = spawnPoints[nextSpawn][0] * 40;
  this.y = spawnPoints[nextSpawn][1] * 40;
  nextSpawn = (nextSpawn + 1) % spawnPoints.length;
  dirtyList[this.name] = this;
  speciallog.push({type:"spawn",player:this});
}

function projectile(player){
  this.x = player.x;
  this.y = player.y;
  this.owner = player.name;
  this.rotation = player.rotation;
}

function powerUp(){
  this.x = spawnPoints[nextSpawn][0] * 40;
  this.y = spawnPoints[nextSpawn][1] * 40;
}

//Server Vars
var WebSocketServer = require('ws').Server,
  wss, speciallog = []; //Special messages to be sent
chatlog = [], // array with all chats cleared every update
playerList = {}, // list of all player, pid:playerobject
dirtyList = {}, // list of dirty players pid:playerobject
socketList = {}, // list of all sockets pid:playerobject
idgen = 0, //temporary solution to id generation
stepSize = 100, //time between simulation step in ms
//collide = require('./collision.js');
projectileList = {},
scores = {},
lookupList = {}; //TODO this is getting confusing redo playerlist with names rather then pid
importMap = require('./map/map.js'), spawnPoints = [], blocks = [], nextSpawn = 0, dbquery = require("./routes"), async = require('async');



exports.startServer = function(server) {
  console.log("Game server started");
  //setup the spawn points
  for(s in importMap.MAP) {
    if(importMap.MAP[s] === "impassable"){
     // var b = [];
     var b = {x:(s.split(",")[0]*40),y:(s.split(",")[1]*40)};
     // b[1] = {x:(s.split(",")[0]*40+40),y:(s.split(",")[1]*40)};
     // b[2] = {x:(s.split(",")[0]*40+40),y:(s.split(",")[1]*40+40)};
     // b[3] = {x:(s.split(",")[0]*40),y:(s.split(",")[1]*40+40)};
     blocks.push(b);
   }

   if(importMap.MAP[s] === "spawn") {
    spawnPoints.push(s.split(","));
    importMap.MAP[s] = "passable";
  }
}
console.log(blocks);
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

function onConnect(ws) {
  idgen = idgen + 1;
  ws.pid = idgen;
  socketList[ws.pid] = ws;
}


function checkTwo(object1,object2,width){

    if(Math.sqrt(Math.pow((object1.x-object2.x),2) + Math.pow((object1.y-object2.y),2)) <= width) return true;
  
  return false;
}

function checkWalls(object,width){

  for(var i = 0; i < blocks.length; i++){
    //console.log(i + " " + blocks[i].x + " , " + blocks[i].y + " ; " + player.x + " , " + player.y);
    //console.log(Math.sqrt((player.x-blocks[i].x)^2 + (player.y-blocks[i].y)^2));
    if(Math.sqrt(Math.pow((object.x-blocks[i].x),2) + Math.pow((object.y-blocks[i].y),2)) <= width) return true;
  }
  return false;
}

//Called for every simulation step. Also sends updates.
//TODO: break up simulation and updates so that we can simulate faster then we update clients

function doStep() {

/* TODO: Make this actually respond if the player is cheating by going through walls
  for(p in playerList){
    if(checkWalls(playerList[p], 40) === true)
      console.log("collision!, " + playerList[p].x + "," + playerList[p].y);
  }
  */

  for(var it = 0; it < 3; it++){
    for(p in projectileList){
      var proj = projectileList[p];
      var angle = proj.rotation * (Math.PI / 180),
      vx = Math.sin(angle),
      vy = -Math.cos(angle);

      proj.x += vx * 15;
      proj.y += vy * 15;

      if(checkWalls(projectileList[p], 25) === true){

        var tmp = {owner:projectileList[p].owner,x:projectileList[p].x,y:projectileList[p].y};
        speciallog.push({type:"hit",proj:tmp,hit:null});
          if(lookupList[projectileList[p].owner] !== undefined){
        playerList[lookupList[proj.owner]].fired = false;
      }
        delete projectileList[p];


      }
      else{
      //TODO fix width of projectile
      for(t in playerList){
        if(checkTwo(projectileList[p],playerList[t], 25) === true  && projectileList[p].owner !== playerList[t].name){
          console.log("hit a Tank");

          playerList[t].dead = true;
          scores[playerList[t].name].deaths++;
          if(lookupList[projectileList[p].owner] !== undefined){
          scores[projectileList[p].owner].kills++;
          playerList[lookupList[projectileList[p].owner]].score = scores[projectileList[p].owner].kills;
          playerList[lookupList[proj.owner]].fired = false;
        }
          var tmp = {owner:projectileList[p].owner,x:projectileList[p].x,y:projectileList[p].y};
          speciallog.push({type:"hit",proj:tmp,hit:playerList[t].name});
   

          delete projectileList[p];
          
          break;
        }
      }
    }

  }
}

var update = {
  type: "update",
  players: dirtyList,
  projectiles: projectileList,
  chats: chatlog,
  specials: speciallog
};
  //console.log(update.projectiles);


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
  if(msg.type === "fire"){
    if(playerList[msg.pid].fired === false && playerList[msg.pid].dead === false){
     // console.log(msg.pid + "fired");
      scores[playerList[msg.pid].name].shotsFired++;
      playerList[msg.pid].x = msg.player.x;
      playerList[msg.pid].y = msg.player.y;
      playerList[msg.pid].rotation = msg.player.rotation;
      projectileList[playerList[msg.pid].name] = new projectile(playerList[msg.pid]);
      playerList[msg.pid].fired = true;
    }
  }

  else if(msg.type === 'spawn') {
    if(playerList[msg.pid].dead === true){
      playerList[msg.pid].spawn();

    }
  }

  else if(msg.type === 'update') {
    //TODO: Check position to ensure no cheating, also only add players to dirtylist if their pos is actually dirty
    if(playerList[msg.pid].dead === false && msg.player.dead === false){
    playerList[msg.pid].x = msg.player.x;
    playerList[msg.pid].y = msg.player.y;
    playerList[msg.pid].rotation = msg.player.rotation;

    dirtyList[playerList[msg.pid].name] = playerList[msg.pid];
  }

    for(c in msg.chats) {
      chatlog.push(playerList[msg.pid].name + ": " + msg.chats[c])
    }

  }
  else if(msg.type === 'initid') {
    addPlayer(msg.pid, msg.token);
  }
}

function makeAllDirty() {
  for(p in playerList) {
    dirtyList[playerList[p].name] = playerList[p];
  }
  speciallog.push({
    type: "allplayers"
  });
}

function addPlayer(pid, token) {
  var joinedplayer;
  async.waterfall([

    function(cb) {
      dbquery.conn.query("select username from users where uid = ?", [token], function(err, result) {
        if(err) {
          console.log(err);
          cb(null, err, undefined);
        } else {
          cb(null, err, result);
        }
      });
    }, function(err, result, cb) {
      if(!err && result) {
        if(lookupList[result[0].username] !== undefined){
          dcPlayer(lookupList[result[0].username]);
        }
        else{
          joinedplayer = new player(result[0].username);
          scores[result[0].username] = {name:result[0].username,kills:0,deaths:0,shotsFired:0};
          lookupList[joinedplayer.name] = pid;
          playerList[pid] = joinedplayer;
          chatlog.push(joinedplayer.name + " connected");
          socketList[pid].send(JSON.stringify({
            type: 'setplayer',
            player: joinedplayer,
            map: importMap.MAP
          }));
          makeAllDirty();  
        }
      } else {
        console.log(err);
        dcPlayer(pid);
      }
    }]);
}

//disconnect a player

function dcPlayer(pid) {
  if(playerList[pid] !== undefined){
    
  console.log("dc player" + pid)
  chatlog.push(playerList[pid].name + " left");
  dbquery.updateStatistics(scores[playerList[pid].name]);

  speciallog.push({
    type: 'delplayer',
    name: playerList[pid].name
  })
    delete dirtyList[pid];
  delete lookupList[playerList[pid].name];
  delete playerList[pid];
}

if(socketList[pid] !== undefined){
  socketList[pid].close();
  delete socketList[pid];
 //TODO: Make players stay for some time after they DC
}

  for(p in playerList) {
    dirtyList[playerList[p].name] = playerList[p];
  }
  speciallog.push({
    type: "allplayers"
  });
}

//add another powerup to the map and send it to all clients

function addPowerUp(){
  for(pid in socketList){
    socketList[pid].send(JSON.stringify({
      type: 'newPowerUp',
      power: new powerUp()
    }));
  }
}