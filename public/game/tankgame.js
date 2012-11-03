var conn;
var chat;
var chatwindow;

var connect = function() {
		if(window["WebSocket"]) {
			conn = new WebSocket("ws://voxic.dyndns.org:3000");
			chat = $("#incomingChatMessages");
			chatwindow = $("#chatdisplay");
			conn.onerror = function(evt) {
				console.log(evt);
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
				console.log(message);
				if(message.type === 'setplayer') {
					id = message.id;
					playerList[message.id] = message.player;
					Crafty.scene("main");
					$('#outgoingChatMessage').keypress(function(event) {
						if(event.which == 13) {
							event.preventDefault();
							chatlog.push($('#outgoingChatMessage').val());	
							$('#outgoingChatMessage').val('');
						}
					});

				} else if(message.type === 'delplayer') {
					delete playerList[message.id];
					entList[message.id].destroy();
					delete entList[message.id];

				} else if(message.type === 'update') {
					for(c in message.chats) {
						chat.append($('<li></li>').text(message.chats[c]));
						chatwindow.scrollTop(chatwindow[0].scrollHeight);
					}
					for(x in message.players) {
						if(playerList[x] === undefined) {
							playerList[x] = message.players;

							var nametext = Crafty.e("2D, DOM, Text").attr({
								x: message.players[x].x,
								y: message.players[x].y,
								z: 100,
								id: x,
								_active: true
							}).text(message.players[x].pname).textFont({
								size: '200px',
								weight: 'bold'
							});

							entList[x] = Crafty.e("2D, Canvas, car_player, Tween").origin("center").attr({
								id: x,
								x: message.players[x].x,
								y: message.players[x].y,
								_active: true,
								textname: nametext
							}).bind("EnterFrame", function(e) {
								if(!this._active) return;
								if(playerList[this.id].dirty === true) {
									this.tween({
										rotation: playerList[this.id].rotation,
										x: playerList[this.id].x,
										y: playerList[this.id].y
									}, 3)
									playerList[this.id].dirty = false;
								}

							}).bind("Remove", function(e) {
								this.textname.destroy();

							}).attach(nametext);


						} else {
							playerList[x] = message.players[x];
							playerList[x].dirty = true;
						}
					}
				}
			};
		}
	};


function player(id, name) {
	this.id = id;
	this.x = 50;
	this.y = 50;
	this.rotation = 0;
	this.dirty = false;
	this.forward = false;
	this.pname = name;
}

var tiles = {},
	playerList = {},
	entList = {},
	W = 800,
	H = 600,
	HW = W / 2,
	HH = H / 2,
	framecount = 0,
	id,
	chatlog=[];


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

		entList[id] = Crafty.e("2D, Canvas, car_player, Keyboard, Collision").origin("center").attr({
			x: 100,
			y: 100,
			_active: true,
			forward: false
		}).collision(new Crafty.polygon([
			[1, 19],
			[2, 14],
			[9, 14],
			[13, 9],
			[22, 10],
			[24, 14],
			[31, 15],
			[30, 21],
			[2, 20]
		])).bind("EnterFrame", function(e) {
			if(!this._active) return;

			var forward = false;
			var angle = this._rotation * (Math.PI / 180),
				vx = Math.sin(angle),
				vy = -Math.cos(angle);

			if(this.isDown(Crafty.keys.W) || this.isDown(Crafty.keys.UP_ARROW)) {
				this.x += vx * 2;
				this.y += vy * 2;
				var forward = true;
			} else if(this.isDown(Crafty.keys.S) || this.isDown(Crafty.keys.DOWN_ARROW)) {
				this.x += -vx * 1.5;
				this.y += -vy * 1.5;
			}
			if(this.isDown(Crafty.keys.A) || this.isDown(Crafty.keys.LEFT_ARROW)) {
				entList[id].rotation = entList[id]._rotation - 3.5;
			} else if(this.isDown(Crafty.keys.D) || this.isDown(Crafty.keys.RIGHT_ARROW)) {
				entList[id].rotation = entList[id]._rotation + 3.5;
			}

			var collision = this.hit("Solid"),
				item;

			if(collision) {
				item = collision[0];

				this.x += Math.ceil(item.normal.x * -item.overlap);
				this.y += Math.ceil(item.normal.y * -item.overlap);
			}

			if(playerList[id].forward !== forward) {
				playerList[id].dirty = true;
				playerList[id].forward = forward;
			}
			if(playerList[id].x !== entList[id].x) {
				playerList[id].dirty = true;
				playerList[id].x = entList[id].x;
			}
			if(playerList[id].y !== entList[id].y) {
				playerList[id].dirty = true;
				playerList[id].y = entList[id].y;
			}
			if(playerList[id].rotation !== entList[id].rotation) {
				playerList[id].dirty = true;
				playerList[id].rotation = entList[id].rotation;
			}


		}).bind("KeyDown", function(e) {
			if(e.keyCode === Crafty.keys.ENTER || e.keyCode === Crafty.keys.F) {}
		});

		//Global Events
		Crafty.bind("EnterFrame", function() {
			if(!playerList[id]) return;

			framecount = framecount + 1;

			//position of the viewport
			var vpx = (entList[id]._x - HW),
				vpy = (entList[id]._y - HH);

			//Max x in map * 32 - Crafty.viewport.width = 1164
			if(vpx > 0 && vpx < 1196) {
				Crafty.viewport.x = -vpx;
			}

			if(vpy > 0 && vpy < 368) {
				Crafty.viewport.y = -vpy;
			}


			if(framecount % 10 === 0 || playerList[id].dirty === true) {
				playerList[id].dirty = false;
				conn.send(JSON.stringify({
					id: id,
					chats:chatlog,
					type: 'update',
					player: playerList[id]
				}));
				chatlog = [];
			}
		});
	});
};

function initMap() {
	for(var obj in MAP) {
		var pos = obj.split(",");
		tiles[obj] = Crafty.e("2D, Canvas, " + MAP[obj]).attr({
			x: pos[0] * 32,
			y: pos[1] * 32
		});

		if(MAP[obj].substr(0, 5) === "house") {
			tiles[obj].addComponent("Solid, Collision").collision();
		}
	}
}