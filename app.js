
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/playgame/:user', routes.playgame);
app.get('/users', user.list);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});


function player(id,name) {
  this.id = id;
  this.x = 50;
  this.y = 50;
  this.rotation = 0;
  this.dirty = false;
  this.forward = false;
  this.pname = name;
}

//GameServer
var WebSocketServer = require('ws').Server, wss = new WebSocketServer({server:server});
var chatlog =[];
var playerList = {};
var socketList = {};
var idgen = 0;

setInterval(function() {
  console.log(chatlog);
  for (x in playerList){
      var update = {type:"update",players:{},chats:chatlog};
      for (y in playerList){
        if(x !== y && playerList[y].dirty === true){
          update.players[y] = playerList[y];

        }
      }

      if(Object.keys(update.players).length !== 0 || Object.keys(update.chats).length !== 0){
        socketList[x].send(JSON.stringify(update));

     }
  }
  chatlog = [];
}, 100);


  wss.on('connection', function(ws) {

;



    ws.on('message', function(message) {
        msg = JSON.parse(message);

        if(msg.type === 'update'){
          playerList[msg.id].x = msg.player.x;
          playerList[msg.id].y = msg.player.y;
          playerList[msg.id].rotation = msg.player.rotation;
          playerList[msg.id].dirty = true;
          for(c in msg.chats){
            chatlog.push(playerList[msg.id].pname +":"+msg.chats[c])
          }
                //  console.log(msg);
        }
        else if(msg.type === 'initid'){
          //do player lookup here
          //console.log(msg);
          idgen = idgen+1;
          var tmpname = msg.token;
          var tmpid = idgen; 

          ws.gid = tmpid;
          var tmp = new player(tmpid,tmpname);

          playerList[tmp.id] = tmp;
          socketList[tmp.id] = ws;
          console.log(tmp.pname + " connected");
          chatlog.push(tmp.pname + " connected");
          ws.send(JSON.stringify({type:'setplayer',player:tmp,id:tmpid}));
        }
    });

    ws.on('close', function() {
          console.log(playerList[ws.gid].pname + " left");
          var id = ws.gid;
          chatlog.push(playerList[id].pname + " left");
          delete socketList[ws.gid];
          delete playerList[ws.gid];
          for (x in socketList){
            socketList[x].send(JSON.stringify({type:'delplayer',id:id}));
          }
    });

});