var mysql = require('mysql');
var program = require('commander');
var async = require('async');

var conn;


var connInfo = {
	host: 'instance31444.db.xeround.com',
	port: 20310,
	user: 'administrator',
	password: 'tankgame',
	database: 'tanksonline'
};

exports.doconnect = function() {
	console.log('reconnecting');
	conn = mysql.createConnection(conn.config);
	exports.conn = conn;
	handleDisconnect();
	conn.connect();
}


exports.dbconnect = function() {
	async.series([

	function(cb) {
		conn = mysql.createConnection(connInfo);
		exports.conn = conn;
		conn.connect(function(err) {
			if(err) {
				console.log('Can\'t connect to database!');
				throw err;
			}
			console.log('Connected to ' + connInfo.database);
		});
		handleDisconnect();
	}]);
};

function handleDisconnect() {
	conn.on('error', function(err) {
		if(!err.fatal) {
			return;
		}

		if(err.code !== 'PROTOCOL_CONNECTION_LOST') {
			throw err;
		}
		console.log('Re-connecting lost connection: ' + err.stack);
		exports.doconnect();
	});

	conn.on('close', function(err) {

		console.log('Re-connecting lost connection: ' + err.stack);
		exports.doconnect();
	});
}

exports.try_login = function(req, res) {
	if(conn._protocol._destroyed === true) {
		exports.doconnect();
	}
	var username = req.body.username;
	var password = req.body.password;
	if(!username || !password) {
		req.flash('badmsg', 'Missing login information!');
		res.redirect('/login');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		conn.query("select uid from users where username = ? and password = ?", [username, md5sum.digest('hex')], function(err, result) {
			if(err) {
				console.log(err);
				req.flash('badmsg', err);
				res.redirect('/login');
			} else {
				if(result.length === 1) {
					req.session.uid = result[0].uid;
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
	if(conn._protocol._destroyed === true) {
		exports.doconnect();
	}
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
		conn.query("insert into users values (NULL, ?, ?, ?)", [name, md5sum.digest('hex'), email], function(err, result) {
			if(err) {
				console.log("error: " + err);
				req.flash('badmsg', err);
				res.redirect('/register');
			} else {
				var uid = result.insertId;
				conn.query('insert into statistics values (NULL, ?, 0, 0, 0, 0)', [uid], function(err1, result) {
					if(err1) {
						conn.query('delete from users where uid = ?', [uid], function(err2, result1) {
							if(err2) {
								console.log(err2);
								req.flash('badmsg', err2);
								res.redirect('/register');
							}
						});
						console.log(err1);
						req.flash('badmsg', err);
						res.redirect('/register');
					}
				});
				req.flash('goodmsg', "Registration sucessful, please log in.");
				res.redirect('/login');
			}
		});
	}
};



exports.index = function(req, res) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
	if(req.session.uid === undefined) {
		res.redirect('/login');
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
	var badmsg = req.flash('basmsg')[0] || '';
		if(req.session.uid !== undefined) {
			res.redirect('/logout');
		}
		res.render('index', {
			title: 'Login Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
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
	var badmsg = req.flash('basmsg')[0] || '';
		if(req.session.uid !== undefined) {
			res.redirect('/logout');
		}
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
			page: "register",
			loginout: "Login",
			uname:req.session.uname
		});
};


exports.playgame = function(req, res) {
	if(req.session.uid !== undefined) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
			page: "game",
			loginout: "Logout",
			token: req.session.uid,
			uname:req.session.uname
		});
	} else {
		res.redirect('/login');
	}
};

exports.about = function(req, res) {
	if(req.session.uid !== undefined) {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
			page: "about",
			loginout: "Logout",
			token: req.session.uid,
			uname:req.session.uname
		});
	} else {
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
		res.render('index', {
			title: ' Combat! Online',
			goodmsg: goodmsg,
			badmsg:badmsg,
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
	if(conn._protocol._destroyed === true) {
		exports.doconnect();
	}
	var goodmsg = req.flash('goodmsg')[0] || '';
	var badmsg = req.flash('basmsg')[0] || '';
	if(req.session.uid !== undefined) { // If the user is logged in
		// Create the stats table with the proper headers
		var userStatsTable = '<table class="stats" id="user_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th><th>Accuracy</th></tr>';
		var statsTable = '<table class="stats" id="full_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th><th>Accuracy</th></tr>';
		async.waterfall([

		function(cb) {
			conn.query('select S.uid, S.gamesPlayed, S.kills, S.deaths, S.shotsFired, U.username from statistics S, users U where S.uid = U.uid order by S.kills desc', function(err, result) {
				if(err) {
					console.log(err);
					cb(err)
				} else {
					cb(null, result);
				}
			});
		},

		function(result, cb) {
			for(var i = 0; i < result.length; i++) { // Loop through the statistic entries
				var stat = result[i]; // Grab the current statistic object
				var deaths = 1;
				var shots = 1;
				if(parseInt(stat.deaths) !== 0) deaths = stat.deaths;
				if(parseInt(stat.shotsFired) !== 0) shots = stat.shotsFired;

				if(stat.uid === req.session.uid) {
					userStatsTable += '<tr>' // Create a new table row
					userStatsTable += '<td id="username">' + stat.username + '</td>'; // Add the user's name to the row
					userStatsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>'; // Add the # of games played to the row
					userStatsTable += '<td id="kills">' + stat.kills + '</td>'; // Add the # of kills to the row
					userStatsTable += '<td id="deaths">' + stat.deaths + '</td>'; // Add the # of deaths to the row
					userStatsTable += '<td id="ratio">' + (parseInt(stat.kills) / deaths).toFixed(2) + '</td>'; // Add the K/D ratio to the row
					userStatsTable += '<td id="accuracy">' + ((parseInt(stat.kills) / shots) * 100).toFixed(2) + '%</td>'; // Add the accuracy to the row
				} else {
					statsTable += '<tr>' // Create a new table row
					statsTable += '<td id="username">' + stat.username + '</td>'; // Add the user's name to the row
					statsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>'; // Add the # of games played to the row
					statsTable += '<td id="kills">' + stat.kills + '</td>'; // Add the # of kills to the row
					statsTable += '<td id="deaths">' + stat.deaths + '</td>'; // Add the # of deaths to the row
					statsTable += '<td id="ratio">' + (parseInt(stat.kills) / deaths).toFixed(2) + '</td>'; // Add the K/D ratio to the row
					statsTable += '<td id="accuracy">' + ((parseInt(stat.kills) / shots) * 100).toFixed(2) + '%</td>'; // Add the accuracy to the row
				}
			}
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
		res.redirect('/login'); // Redirect them to the login page
	}
};

exports.updateStatistics = function(data) {
	if(conn._protocol._destroyed === true) {
		exports.doconnect();
	}
	console.log(data);
	var username = data.name;
	var kills = data.kills;
	var deaths = data.deaths;
	var shotsFired = data.shotsFired;

	conn.query('select uid from users where username="' + username + '"', function(err, result) {
		if(err) console.log(err);
		else {
			uid = result[0].uid;
			console.log('update statistics set gamesPlayed=gamesPlayed+1, kills=kills+' + kills + ', deaths=deaths+' + deaths + ', shotsFired=shotsFired+' + shotsFired + ' where uid=' + uid);
			conn.query('update statistics set gamesPlayed=gamesPlayed+1, kills=kills+' + kills + ', deaths=deaths+' + deaths + ', shotsFired=shotsFired+' + shotsFired + ' where uid=' + uid, function(err, result) {
				if(err) {
					console.log(err);
				} else {
					console.log('Updated statistics for ' + username);
				}
			});
		}
	});
};