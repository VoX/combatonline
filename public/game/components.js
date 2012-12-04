//Tank creation

function makePlayerTank(player) {
	return Crafty.e("2D, Canvas, tank" + player.color + ", Keyboard, Collision").origin("center").attr({
		x: player.x,
		y: player.y,
		rotation: player.rotation,
		_active: true,
		//TODO: fix collision poly
	}).collision(new Crafty.polygon([
		[0, 5],
		[40, 5],
		[40, 40],
		[0, 40],

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

		if(this.isDown(Crafty.keys.SPACE) && playerTank.fired === false){
			playerTank.fired = true;
			conn.send(JSON.stringify({
				type: 'fire',
				player: playerTank
			}));
		}
		
		if(this.isDown(Crafty.keys.T)){
			$("#outgoingChatMessage").select();
		}

		var collision = this.hit("Solid"),
			item;

		if(collision) {
			var nx =0, ny=0;
			for(x in collision) {
				item = collision[x];

				var dx = Math.ceil(item.normal.x * -item.overlap);
				if(Math.abs(dx) > Math.abs(nx)){nx = dx;}
				var dy = Math.ceil(item.normal.y * -item.overlap);
				if(Math.abs(dy) > Math.abs(ny)){ny=dy;}
			}
			this.x += nx;
			this.y += ny;
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
	return Crafty.e("2D, Canvas, tank" + player.color + ", Tween").origin("center").attr({
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


function makeProjectile(projectile) {
	return Crafty.e("2D, Canvas, tank1, Tween").origin("center").attr({
		id: projectile.owner,
		x: projectile.x,
		y: projectile.y,
		_active: true,
	}).bind("EnterFrame", function(e) {
		if(!this._active) return;
		if(projectileList[this.id].dirty === true) {
			this.rotation = projectileList[this.id].rotation;
			this.tween({
				
				x: projectileList[this.id].x,
				y: projectileList[this.id].y
			}, 10)
			projectileList[this.id].dirty = false;
		}
		else{
			var angle = this._rotation * (Math.PI / 180),
			vx = Math.sin(angle),
			vy = -Math.cos(angle);

			this.x += vx * 15;
			this.y += vy * 15;

		}

	}).bind("Remove", function(e) {
//TODO make a explosion happen

	});
}


//nametext creation

function makeTankText(player) {
	return Crafty.e("2D, DOM, Text").attr({
		x: player.x,
		y: player.y - 20,
		z: 1,
		id: player.name,
		_active: true
	}).text(player.name).css('text-align', 'center').css('font-size', 'medium');

}

//powerup creation

function makePowerUp(power){
	return Crafty.e("2D, Canvas, powerup, Collision").attr({
		x: power.x,
		y: power.y
	});
}