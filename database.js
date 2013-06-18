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
	db.auth("**DBPASSWORD**", function(){console.log("authed");});
	
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
