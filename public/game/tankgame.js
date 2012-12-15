//connection and display vars
var conn, chat, chatwindow, onlineplayers, chatname;


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
	projectileList = {},
	projentList = {},
	//stores crafty entity information
	W = 800,
	H = 600,
	mapx = 0,
	mapy = 0,
	HW = W / 2,
	HH = H / 2,
	framecount = 0,
	playerTank, chatlog = [],
	MAP, scoreList = {};


function handleMessage(msg) {
	if(msg.type === 'setplayer') {
		playerList[msg.player.name] = msg.player;
		playerTank = playerList[msg.player.name];
		chatname.text(msg.player.name);
		MAP = msg.map;
		//start the game!
		Crafty.scene("main");
		//register the chat event
		//TODO Fix WASD
		$('#outgoingChatMessage').keypress(function(event) {
			if(event.which == 13) {
				event.preventDefault();
				chatlog.push($('#outgoingChatMessage').val());
				$('#outgoingChatMessage').val('');
				$('#outgoingChatMessage').blur();
				chatIsFocused = false;
			}
		});

	} else if(msg.type === 'update' && playerTank !== undefined) {
		for(c in msg.chats) {
			chat.append($('<li></li>').text(msg.chats[c]));
			chatwindow.scrollTop(chatwindow[0].scrollHeight);
		}

		for(s in msg.specials) {
			if(msg.specials[s].type === 'hit') {
				Crafty.audio.play("hit");
				if(msg.specials[s].proj.owner === playerTank.name) {
					playerTank.fired = false;
				}
				if(msg.specials[s].hit === playerTank.name) {
					playerTank.dead = true;
				}
				if(msg.specials[s].hit !== null) {
					entList[msg.specials[s].hit]._active = false;
					entList[msg.specials[s].hit].visible = false;
					if(msg.specials[s].hit !== playerTank.name) {
						entList[msg.specials[s].hit].textname.visible = false;
					} else {
						$('#spawnMsg').text("Press Spacebar to Spawn");
					}
					makeExplosion(playerList[msg.specials[s].hit].x, playerList[msg.specials[s].hit].y, 2);
				}

				delete projectileList[msg.specials[s].proj.owner];
				//console.log(projentList[msg.specials[s].owner]);	
				makeExplosion(msg.specials[s].proj.x, msg.specials[s].proj.y, 1);
				projentList[msg.specials[s].proj.owner].destroy();
				//delete projentList[msg.specials[s].owner];

			} else if(msg.specials[s].type === 'spawn') {
				$('#spawnMsg').text(" ");


				console.log(msg.specials[s].player);

				entList[msg.specials[s].player.name].y = msg.specials[s].player.y;
				entList[msg.specials[s].player.name].x = msg.specials[s].player.x;
				entList[msg.specials[s].player.name]._active = true;
				entList[msg.specials[s].player.name].visible = true;


				playerList[msg.specials[s].player.name] = msg.specials[s].player;
				if(playerTank.name === msg.specials[s].player.name) playerTank = msg.specials[s].player;
				else entList[msg.specials[s].player.name].textname.visible = true;

			} else if(msg.specials[s].type === 'delplayer') {

				delete playerList[msg.specials[s].name];
				//entList[msg.specials[s].name].destroy();
			} else if(msg.specials[s].type === "allplayers") {
				onlineplayers.empty();
				scoreList = {};
				for(p in msg.players) {
					var scoretext = $('<li></li>').text(msg.players[p].name + ":" + msg.players[p].score);
					scoreList[msg.players[p].name] = scoretext;
					onlineplayers.append(scoretext);
				}
			}
		}

		for(x in msg.projectiles) {;
			var p = msg.projectiles[x];
			p.owner = x;
			//if this is a new player we havent seen before
			if(projectileList[x] === undefined) {
				projectileList[x] = p;
				projectileList[x].dirty = true;
				//var nametext = makeTankText(p);
				projentList[x] = makeProjectile(p);
				Crafty.audio.play("fire");


			} else {

				projectileList[x] = p;
				projectileList[x].dirty = true;
			}
		}


		for(x in msg.players) {

			var p = msg.players[x];
			p.name = x;
			//if this is a new player we havent seen before
			if(playerList[x] === undefined) {
				playerList[x] = p;

				var nametext = makeTankText(p);
				entList[x] = makeTank(p, nametext);

			} else {
				scoreList[p.name].text(p.name + ":" + p.score);
				playerList[x] = p;
				playerList[x].dirty = true;
			}
		}
	} else if(msg.type === 'newPowerUp') {
		makePowerUp(msg.power);
	}
}

//initialize the connection and the display objects

function connect() {
	if(window["WebSocket"]) {
		conn = new WebSocket("ws://" + window.location.host);
		chat = $("#incomingChatMessages");
		chatwindow = $("#chatDisplay");
		onlineplayers = $("#playerList");
		chatname = $('#user');
		conn.onerror = function(evt) {
			console.log(evt);
		};
		conn.onclose = function(evt) {
			onlineplayers.empty();
			onlineplayers.append($('<li></li>').text("CONNECTION FAILURE!")).css("color", "red");
		};
		conn.onopen = function(evt) {
			$('#spawnMsg').text("Press Spacebar to Spawn");
			var token = $('#token').val();

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
	$(document).keyup(function(e) {

		if(e.keyCode == 84) {
			if(chatIsFocused === false) {
				$("#outgoingChatMessage").focus();
				chatIsFocused = true;
			}
		} 
	});
	$("#cr-stage").keyup(function(e) {

		if(e.keyCode == 84) {
			if(chatIsFocused === false) {
				$("#outgoingChatMessage").focus();
				chatIsFocused = true;
			}
		} 
	});

	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["../data/sprites.png", "../data/projectile.png"], function() {
			Crafty.audio.add("hit", ["../data/death.mp3", "../data/death.wav"]);
			Crafty.audio.add("fire", ["../data/missile.mp3", "../data/missile.wav"]);
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

			//TODO:Automate min/max view size calculation
			if(vpx <= -20) {
				Crafty.viewport.x = 0;
			} else if(vpx + 20 >= mapx-W+40) {
				Crafty.viewport.x = -(mapx-W+40);
			} else {
				Crafty.viewport.x = -(vpx + 20);
			}

			if(vpy <= -20) {
				Crafty.viewport.y = 0;
			} else if(vpy + 20 >= mapy-H+40) {
				Crafty.viewport.y = -(mapy-H+40);
			} else {
				Crafty.viewport.y = -(vpy + 20);
			}


			//TODO: decouple the update rate from the framerate
			if((framecount % 5 === 0 && playerTank.dirty === true)) {
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

function initMap() {

	for(var obj in MAP) {

		var pos = obj.split(",");
		if(pos[0]* 40 > mapx){
			mapx = pos[0]* 40;
		}
		if(pos[1]* 40 > mapy){
			mapy = pos[1]* 40;
		}
		if(MAP[obj] === "passable") {
			tileList[obj] = Crafty.e("2D, Canvas, passable").attr({
				x: pos[0] * 40,
				y: pos[1] * 40
			});

		} else {
			tileList[obj] = Crafty.e("2D, Color,Canvas, impassable").attr({
				x: pos[0] * 40,
				y: pos[1] * 40,
				w:38,
				h:38

			}).color("#009900");
			tileList[obj].addComponent("Solid, Collision").collision();
		}
	}
}