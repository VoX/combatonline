var program = require('commander');
var async = require('async');

var dbconn = require('../database.js');


exports.dbconnect = function(){
dbconn.connect();
};


exports.dbconn = dbconn;



exports.try_login = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	if(!username || !password) {
		req.flash('badmsg', 'Missing login information!');
		res.redirect('/login');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		dbconn.get("user:" + username, function(err, result) {
			if(err) {
				console.log(err);
				req.flash('badmsg', "Username not found");
				res.redirect('/login');
			} else {
				result = JSON.parse(result);
				if(result.password === md5sum.digest('hex')){
					req.session.uid = result.username;
					req.session.uname = username;
					req.flash('goodmsg', 'Successfully logged in as ' + username);
					res.redirect('/');
				} else {
					console.log(result);
					req.flash('badmsg', "Login failed, please try again.");
					res.redirect('/login');
				}
			}
		});
	}
};


exports.try_register = function(req, res) {
	var name = req.body.name;
	var password = req.body.password;
	var email = req.body.email;
	var passwordCheck = req.body.passwordCheck;
	if(!name || !password || !passwordCheck || !email) {
		req.flash('badmsg', 'Missing information for registration!');
		res.redirect('/register');
	} else if(password != passwordCheck) {
		req.flash('badmsg', 'Password does not match');
		res.redirect('/register');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		dbconn.get("user:" + name, function(err, result) {
			if(err){
				console.log(err);
				req.flash('badmsg', 'Err');
				res.redirect('/register');
			}
			else if(result !== null){
				console.log(err);
				req.flash('badmsg', 'User already exists please choose a different name.');
				res.redirect('/register');
			}
			else if(result === null){
				user = {};
				user.username = name;
				user.password = md5sum.digest('hex');
				user.email = email;
				user.stats = {};
				user.stats.deaths = 0;
				user.stats.shotsfired = 0;
				user.stats.kills = 0;
				user.stats.gamesplayed = 0;


				dbconn.set("user:"+user.username, JSON.stringify(user));
				req.flash('goodmsg', "Registration sucessful, please log in.");
				res.redirect('/login');

			}
		});
	}
};



exports.index = function(req, res) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
	if(req.session.uid === undefined) {
		res.redirect('/about');
	} else {
		res.render('index', {
			title: 'About Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
			page: "about",
			loginout: "Logout",
			uname:req.session.uname
		});
	}
};

exports.login = function(req, res) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
		if(req.session.uid !== undefined) {
			res.redirect('/logout');
		}
		res.render('index', {
			title: 'Login Combat! Online',
			goodmsg: goodmsg,
			badmsg: badmsg,
			page: "login",
			loginout: "Login",
			uname:req.session.uname
		});
};

exports.logout = function(req, res) {
	req.session.uid = undefined;
	req.session.uname = undefined;
	req.flash('goodmsg', "Logged out");
	res.redirect('/login');
};

exports.register = function(req, res) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
		if(req.session.uid !== undefined) {
			res.redirect('/logout');
		}
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg: badmsg,
			page: "register",
			loginout: "Login",
			uname:req.session.uname
		});
};


exports.playgame = function(req, res) {
	if(req.session.uid !== undefined) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg: badmsg,
			page: "game",
			loginout: "Logout",
			token: req.session.uid,
			uname:req.session.uname
		});
	} else {
		req.flash('goodmsg', "Login to begin playing.");
		res.redirect('/login');
	}
};

exports.about = function(req, res) {
	if(req.session.uid !== undefined) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg: badmsg,
			page: "about",
			loginout: "Logout",
			token: req.session.uid,
			uname:req.session.uname
		});
	} else {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('badmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg: badmsg,
			page: "about",
			loginout: "Login",
			token: req.session.uid,
			uname:req.session.uname
		});
	}
};

/**
 * Retrieves the statistics from the database and displays them on
 * the statistics page.
 */
exports.getStatistics = function(req, res) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
	if(req.session.uid !== undefined) { // If the user is logged in
		// Create the stats table with the proper headers
		var userStatsTable = '<table class="stats" id="user_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th><th>Accuracy</th></tr>';
		var statsTable = '<table class="stats" id="full_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th><th>Accuracy</th></tr>';
		async.waterfall([

		function(cb) {
			dbconn.get('user:' + req.session.uid, function(err, result) {
				if(err) {
					console.log(err);
					cb(err)
				} else {
					cb(null, result);
				}
			});
		},

		function(result, cb) {
			
				var stat = JSON.parse(result).stats; // Grab the current statistic object
				var deaths = 1;
				var shots = 1;
				if(parseInt(stat.deaths) !== 0) deaths = stat.deaths;
				if(parseInt(stat.shotsFired) !== 0) shots = stat.shotsfired;

	
					userStatsTable += '<tr>' // Create a new table row
					userStatsTable += '<td id="username">' + req.session.uid + '</td>'; // Add the user's name to the row
					userStatsTable += '<td id="gamesPlayed">' + stat.gamesplayed + '</td>'; // Add the # of games played to the row
					userStatsTable += '<td id="kills">' + stat.kills + '</td>'; // Add the # of kills to the row
					userStatsTable += '<td id="deaths">' + stat.deaths + '</td>'; // Add the # of deaths to the row
					userStatsTable += '<td id="ratio">' + (parseInt(stat.kills) / deaths).toFixed(2) + '</td>'; // Add the K/D ratio to the row
					userStatsTable += '<td id="accuracy">' + ((parseInt(stat.kills) / shots) * 100).toFixed(2) + '%</td>'; // Add the accuracy to the row
				
			userStatsTable += '</table>';
			statsTable += '</table>'; // Complete the statistics tables
			res.render('index', {
				title: 'Statistics Combat! Online',
				goodmsg: goodmsg,
				badmsg:badmsg,
				page: "statistics",
				loginout: "Logout",
				user_stats_table: userStatsTable,
				full_stats_table: statsTable,
				uname:req.session.uname
			});
		}], function(err) {
			console.log(err)
			req.flash('badmsg', err)
			res.render('index', {
				title: 'Statistics Combat! Online',
				goodmsg: goodmsg,
				badmsg:badmsg,
				page: "statistics",
				loginout: "Logout",
				user_stats_table: userStatsTable,
				full_stats_table: statsTable,
				uname:req.session.uname
			});
		});
	} else { // If the user isn't logged in
		req.flash('goodmsg', "Login to view statistics.");
		res.redirect('/login'); // Redirect them to the login page
	}
};

exports.updateStatistics = function(data) {

	console.log(data);
	dbconn.get("user:" + data.name,function(err, result) { 
		if(result!== null && !err){
			result = JSON.parse(result);
			result.stats.deaths += data.deaths;
			result.stats.shotsfired += data.shotsFired;
			result.stats.kills += data.kills;
			result.stats.gamesplayed += 1;
			console.log('Updated statistics for ' + data.name);
			dbconn.set("user:" + data.name, JSON.stringify(result));
		}
	});
	
};