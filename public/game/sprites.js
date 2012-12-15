function initSprites() {
	SPRITES = {
		tank1: [0, 0],
		tank2: [1, 0],
		tank3: [2, 0],
		tank4: [0, 1],
		tank5: [1, 1],
		tank6: [2, 1],
		passable: [1, 2],
		impassable1: [0, 2],
		powerup: [2,2],

	};

	SPRITES2 = {
		projectile: [0, 0],
		explo1: [1, 0],
		explo2: [2, 0]
	};

	Crafty.sprite(40, "../data/sprites.png", SPRITES);
	Crafty.sprite(40, "../data/projectile.png", SPRITES2);
}
