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

exports.dbconnect = function() {
	async.series([

	function(cb) {
		conn = mysql.createConnection(connInfo);
		exports.conn = conn;
		conn.connect(function(err) {
			if(err) {
				throw err;
			}
			console.log('Connected to ' + connInfo.database);
		});
	}]);
};

exports.try_login = function(req, res) {
	var username = req.body.username;
	var password = req.body.password;

	if(!username || !password) {
		req.flash('msg', 'Missing login information!');
		res.redirect('/login');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		conn.query("select uid from users where username = ? and password = ?", [username, md5sum.digest('hex')], function(err, result) {
			if(err) {
				console.log(err);
				req.flash('msg', err);
				res.redirect('/login');
			} else {
				if(result.length === 1) {
					console.log(result[0].uid + "logged in");
					req.session.uid = result[0].uid;
					res.redirect('/playgame');
				} else {
					console.log(result);
					req.flash('msg', "Login failed, please try again.");
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
	if(!name || !password || !email) {
		req.flash('msg', 'Missing information for login!');
		res.redirect('/login');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		conn.query("insert into users values (NULL, ?, ?, ?)", [name, md5sum.digest('hex'), email], function(err, result) {
			if(err) {
				console.log(err);
				req.flash('msg', err);
				res.redirect('/register');
			} else {
				var uid = result.insertId;
				conn.query('insert into statistics values (NULL, ?, 0, 0, 0, 0, 0)', [uid], function(err1, result) {
					if(err1){
						conn.query('delete from users where uid = ?', [uid], function(err2, result1){
							if(err2){
								console.log(err2);
								req.flash('msg', err2);
								res.redirect('/register');
							}
						});
						console.log(err1);
						req.flash('msg', err);
						res.redirect('/register');
					}
				});
				req.flash('msg', "Registration sucessful, please log in.");
				res.redirect('/login');
			}
		});
	}
};



exports.index = function(req, res) {
	if(req.session.uid !== undefined) {
		res.redirect('/login');
	} else res.redirect('/playgame');
};

exports.login = function(req, res) {
	var msg = req.flash('msg')[0] || '';

	res.render('loginpage', {
		title: "login",
		msg: msg
	});
};

exports.logout = function(req, res) {
	req.session.uid = undefined;
	req.flash('msg', "Logged out");
	res.redirect('/login');
};

exports.register = function(req, res) {
	var msg = req.flash('msg')[0] || '';
	res.render('registerpage', {
		title: "login",
		msg: msg
	});
};


exports.playgame = function(req, res) {
	if(req.session.uid !== undefined) {
		res.render('gamepage', {
			token: req.session.uid
		});
	} else {
		res.redirect('/login');
	}
};

/**
 * Retrieves the statistics from the database and displays them on 
 * the statistics page.
 */
exports.getStatistics = function(req, res){
	if(req.session.uid !== undefined){										// If the user is logged in
		// Create the stats table with the proper headers
		var userStatsTable = '<table id="user_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th></tr>';
		conn.query('select S.gamesPlayed, S.wins, S.losses, S.kills, S.deaths, U.username from statistics S, users U where S.uid = ?', [req.session.uid], function(err, result){
			if(err){
				console.log(err);
				req.flash('msg', err);
			}
			else{
				var userStat = result[0];
				userStatsTable += '<tr>'													// Create a new table row
				userStatsTable += '<td id="username">' + userStat.username + '</td>';			// Add the user's name to the row
				userStatsTable += '<td id="gamesPlayed">' + userStat.gamesPlayed + '</td>';		// Add the # of games played to the row
				userStatsTable += '<td id="wins">' + userStat.wins + '</td>';					// Add the # of wins to the row
				userStatsTable += '<td id="losses">' + userStat.losses + '</td>'				// Add the # of losses to the row
				userStatsTable += '<td id="kills">' + userStat.kills + '</td>';					// Add the # of kills to the row
				userStatsTable += '<td id="deaths">' + userStat.deaths + '</td>';				// Add the # of deaths to the row
				userStatsTable += '<td id="ratio">' + (userStat.kills/userStat.deaths) + '</td></tr>';	// Add the K/D ratio to the row
				
			}
		});
		userStatsTable += '</table>';
		var statsTable = '<table id="full_stats_table"><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th></tr>';
		conn.query('select S.gamesPlayed, S.wins, S.losses, S.kills, S.deaths, U.username from statistics S, users U where S.uid = U.uid', function(err, stats) {		// Query the database for all statistics
			if(err) {														// If there's an error
				console.log(err);											// Log the error to the console
				req.flash('msg', err);										// Flash the error message to the user
			} else {														// If the query was successful
				for(var i = 0; i < stats.length; i++){						// Loop through the statistic entries
					var stat = stats[i];									// Grab the current statistic object
					statsTable += '<tr>'													// Create a new table row
					statsTable += '<td id="username">' + stat.username + '</td>';					// Add the user's name to the row
					statsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>';		// Add the # of games played to the row
					statsTable += '<td id="wins">' + stat.wins + '</td>';					// Add the # of wins to the row
					statsTable += '<td id="losses">' + stat.losses + '</td>'				// Add the # of losses to the row
					statsTable += '<td id="kills">' + stat.kills + '</td>';					// Add the # of kills to the row
					statsTable += '<td id="deaths">' + stat.deaths + '</td>';				// Add the # of deaths to the row
					statsTable += '<td id="ratio">' + (stat.kills/stat.deaths) + '</td>';	// Add the K/D ratio to the row
				}
			}
		});
		statsTable += '</table>';							// Complete the statistics tables
		res.render('statisticspage', {						// Render them to the statistics page
			title : 'statistics',
			user_stats_table : userStatsTable,
			full_stats_table : statsTable
		});
	} else {												// If the user isn't logged in
		res.redirect('/login');								// Redirect them to the login page
	}
};
