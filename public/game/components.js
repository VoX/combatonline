//Tank creation

function makePlayerTank(player) {
	return Crafty.e("2D, Canvas, car_player, Keyboard, Collision, WiredHitBox").origin("center").attr({
		x: player.x,
		y: player.y,
		rotation: player.rotation,
		_active: true,
		//TODO: fix collision poly
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

		//TODO: disconnect the input from the framerate
		])).bind("EnterFrame", function(e) {
		if(!this._active) return;

		var angle = this._rotation * (Math.PI / 180),
			vx = Math.sin(angle),
			vy = -Math.cos(angle);

		if(this.isDown(Crafty.keys.W) || this.isDown(Crafty.keys.UP_ARROW)) {
			this.x += vx * 2;
			this.y += vy * 2;
		} else if(this.isDown(Crafty.keys.S) || this.isDown(Crafty.keys.DOWN_ARROW)) {
			this.x += -vx * 1.5;
			this.y += -vy * 1.5;
		}
		if(this.isDown(Crafty.keys.A) || this.isDown(Crafty.keys.LEFT_ARROW)) {
			this.rotation = this._rotation - 3.5;
		} else if(this.isDown(Crafty.keys.D) || this.isDown(Crafty.keys.RIGHT_ARROW)) {
			this.rotation = this._rotation + 3.5;
		}

		var collision = this.hit("Solid"),
			item;

		if(collision) {
			item = collision[0];

			this.x += Math.ceil(item.normal.x * -item.overlap);
			this.y += Math.ceil(item.normal.y * -item.overlap);
		}

		if(playerTank.x !== this.x) {
			playerTank.dirty = true;
			playerTank.x = this.x;
		}
		if(playerTank.y !== this.y) {
			playerTank.dirty = true;
			playerTank.y = this.y;
		}
		if(playerTank.rotation !== this.rotation) {
			playerTank.dirty = true;
			playerTank.rotation = this.rotation;
		}

	});
}

function makeTank(player, nametext) {
	return Crafty.e("2D, Canvas, car_player, Tween").origin("center").attr({
		id: player.name,
		x: player.x,
		y: player.y,
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
}

//nametext creation

function makeTankText(player) {
	return Crafty.e("2D, DOM, Text").attr({
		x: player.x,
		y: player.y,
		z: 100,
		id: player.name,
		_active: true
	}).text(player.name).textFont({
		size: '200px',
		weight: 'bold'
	});
}