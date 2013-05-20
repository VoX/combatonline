var redis = require('redis');
exports.conn = undefined;

exports.set = function(key,val){
	exports.conn.set(key, val, redis.print);
};

exports.get = function(key, cb){
	 exports.conn.get(key, cb);
};

exports.connect = function() {
	var db = redis.createClient(2770,"50.30.35.9",null);
	db.auth("7d8ba1731e08c0c51b698d8f437d8f0e", function(){console.log("authed");});
	
	db.on("ready", function(){
		
	});

	db.on("error", function (err) {
	    console.log("Error " + err);
	});
	exports.conn = db;
};

exports.storePlayer = function(player){
	db.conn.set("user:" + player.username, JSON.stringify(player));
};

exports.storeShip = function(ship){
	db.conn.set("ship:" + ship.id, JSON.stringify(ship));
};

exports.storeGrid = function(grid){
	db.conn.set("grid:" + grid.id, JSON.stringify(grid));

};