//connection and display vars
var conn, chat, chatwindow, onlineplayers;


function player(name) {
	this.x = 50;
	this.y = 50;
	this.rotation = 0;
	this.name = name;
}

//game related vars
var tileList = {},
	//stores map tiles
	playerList = {},
	//stores player information
	entList = {},
	//stores crafty entity information
	W = 800,
	H = 600,
	HW = W / 2,
	HH = H / 2,
	framecount = 0,
	playerTank, chatlog = [],
	MAP;


function handleMessage(msg) {
	if(msg.type === 'setplayer') {
		playerList[msg.player.name] = msg.player;
		playerTank = playerList[msg.player.name];
		MAP = msg.map;
		//start the game!
		Crafty.scene("main");
		//register the chat event
		$('#outgoingChatMessage').keypress(function(event) {
			if(event.which == 13) {
				event.preventDefault();
				chatlog.push($('#outgoingChatMessage').val());
				$('#outgoingChatMessage').val('');
			}
		});

	} else if(msg.type === 'update') {

		for(c in msg.chats) {
			chat.append($('<li></li>').text(msg.chats[c]));
			chatwindow.scrollTop(chatwindow[0].scrollHeight);
		}

		for(s in msg.specials) {
			if(msg.specials[s].type === 'delplayer') {
				delete playerList[msg.specials[s].name];
				entList[msg.specials[s].name].destroy();
				delete entList[msg.specials[s].name];
			} else if(msg.specials[s].type === "allplayers") {
				onlineplayers.empty();
				for(p in msg.players) {
					onlineplayers.append($('<li></li>').text(msg.players[p].name));
				}
			}
		}

		for(x in msg.players) {
			var p = msg.players[x];
			//if this is a new player we havent seen before
			if(playerList[x] === undefined) {
				playerList[x] = p;

				var nametext = makeTankText(p);
				entList[x] = makeTank(p, nametext);

			} else {
				playerList[x] = p;
				playerList[x].dirty = true;
			}
		}
	}
}

//initialize the connection and the display objects

function connect() {
	if(window["WebSocket"]) {
		conn = new WebSocket("ws://voxic.dyndns.org:3000");
		chat = $("#incomingChatMessages");
		chatwindow = $("#chatDisplay");
		onlineplayers = $("#playerList");
		conn.onerror = function(evt) {
			console.log(evt);
		};
		conn.onclose = function(evt) {
			onlineplayers.empty();
			onlineplayers.append($('<li></li>').text("CONNECTION FAILURE!")).css("color", "red");
		};
		conn.onopen = function(evt) {
			var token = $('#user').text();

			conn.send(JSON.stringify({
				type: "initid",
				token: token
			}));
		};
		conn.onmessage = function(evt) {
			message = JSON.parse(evt.data);
			handleMessage(message);
		};
	}
};

window.onload = function() {
	//start crafty
	Crafty.init(W, H);
	Crafty.canvas.init(30);


	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["../data/sprites.png"], function() {
			initSprites();
			connect();
		});

		//black background with some loading text
		Crafty.background("#000");
		Crafty.e("2D, Canvas, Text").attr({
			w: 100,
			h: 20,
			x: 150,
			y: 120
		}).text("Loading")
	});

	//automatically play the loading scene
	Crafty.scene("loading");

	Crafty.scene("main", function() {
		initMap();

		//make the players tank
		entList[playerTank.name] = makePlayerTank(playerTank);

		//Global Events happen every frame
		Crafty.bind("EnterFrame", function() {
			if(!playerTank) return;

			framecount = framecount + 1;

			//position of the viewport
			var vpx = (entList[playerTank.name]._x - HW),
				vpy = (entList[playerTank.name]._y - HH);

			//Max x in map * 40 - Crafty.viewport.width
			if(vpx <= 0) {
				Crafty.viewport.x = 0;
			}
			else if(vpx >= 1200){
				Crafty.viewport.x = -1200;
			}
			else{
				Crafty.viewport.x = -vpx;
			}

			if(vpy <= 0) {
				Crafty.viewport.y = 0;
			}
			else if(vpy >= 840){
				Crafty.viewport.y = -840;
			}
			else{
				Crafty.viewport.y = -vpy;
			}


			//TODO: decouple the update rate from the framerate
			if(framecount % 10 === 0 || playerTank.dirty === true) {
				playerTank.dirty = false;
				conn.send(JSON.stringify({
					chats: chatlog,
					type: 'update',
					player: playerTank
				}));
				chatlog = [];
			}
		});
	});
};

//TODO:Rewrite this, maybe move it to the server?

function initMap() {
	for(var obj in MAP) {
		var pos = obj.split(",");
		if(MAP[obj] === "passable") {
			tileList[obj] = Crafty.e("2D, Canvas, passable").attr({
				x: pos[0] * 40,
				y: pos[1] * 40
			});
		} else {
			tileList[obj] = Crafty.e("2D, Canvas, impassable").attr({
				x: pos[0] * 40,
				y: pos[1] * 40
			});
			tileList[obj].addComponent("Solid, Collision").collision();
		}
	}
}