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
					req.session.uid = result[0].uid;
					res.redirect('/');
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
		req.flash('msg', 'Missing information for registration!');
		res.redirect('/login');
	} else {
		var crypto = require('crypto');
		var md5sum = crypto.createHash('md5');
		md5sum.update(password);
		conn.query("insert into users values (NULL, ?, ?, ?)", [name, md5sum.digest('hex'), email], function(err, result) {
			if(err) {
				console.log("error: " + err);
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
						req.flash('color', 'green');
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
	var msg = req.flash('msg')[0] || '';
	if(req.session.uid === undefined) {
		res.redirect('/login');
	} else{
		res.render('landingpage', {
			title: 'Landing Page',
			msg: msg
		});
	}
};

exports.login = function(req, res) {
	var msg = req.flash('msg')[0] || '';
	var color = req.flash('color')[0] || 'red';

	res.render('loginpage', {
		title: "Login",
		msgcolor: color,
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
		title: "Register",
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
	var msg = req.flash('msg')[0] || '';
	if(req.session.uid !== undefined){										// If the user is logged in
		// Create the stats table with the proper headers
		var userStatsTable = '<table class="stats" id="user_stats_table"><tr><th>Username</th><th>Games Played</th><th>Wins</th><th>Losses</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th></tr>';
		var statsTable = '<table class="stats" id="full_stats_table"><tr><th>Username</th><th>Games Played</th><th>Wins</th><th>Losses</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th></tr>';
		async.waterfall([
			function (cb){
				conn.query('select S.uid, S.gamesPlayed, S.wins, S.losses, S.kills, S.deaths, U.username from statistics S, users U where S.uid = U.uid', function(err, result){
					if(err){
						console.log(err);
						cb(err)
					}
					else{
						cb(null, result);
					}
				});
			},
			
			function(result, cb){
				for(var i = 0; i < result.length; i++){						// Loop through the statistic entries
					var stat = result[i];									// Grab the current statistic object
					if(stat.uid === req.session.uid){
						userStatsTable += '<tr>'													// Create a new table row
						userStatsTable += '<td id="username">' + stat.username + '</td>';			// Add the user's name to the row
						userStatsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>';		// Add the # of games played to the row
						userStatsTable += '<td id="wins">' + stat.wins + '</td>';					// Add the # of wins to the row
						userStatsTable += '<td id="losses">' + stat.losses + '</td>'				// Add the # of losses to the row
						userStatsTable += '<td id="kills">' + stat.kills + '</td>';					// Add the # of kills to the row
						userStatsTable += '<td id="deaths">' + stat.deaths + '</td>';				// Add the # of deaths to the row
						userStatsTable += '<td id="ratio">' + (parseInt(stat.kills)/parseInt(stat.deaths)) + '</td>';	// Add the K/D ratio to the row
					}
					else{
						statsTable += '<tr>'													// Create a new table row
						statsTable += '<td id="username">' + stat.username + '</td>';			// Add the user's name to the row
						statsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>';		// Add the # of games played to the row
						statsTable += '<td id="wins">' + stat.wins + '</td>';					// Add the # of wins to the row
						statsTable += '<td id="losses">' + stat.losses + '</td>'				// Add the # of losses to the row
						statsTable += '<td id="kills">' + stat.kills + '</td>';					// Add the # of kills to the row
						statsTable += '<td id="deaths">' + stat.deaths + '</td>';				// Add the # of deaths to the row
						statsTable += '<td id="ratio">' + (parseInt(stat.kills)/parseInt(stat.deaths)) + '</td>';	// Add the K/D ratio to the row
					}
				}
				userStatsTable += '</table>';
				statsTable += '</table>';							// Complete the statistics tables
				res.render('statisticspage', {						// Render them to the statistics page
					title : 'statistics',
					user_stats_table : userStatsTable,
					full_stats_table : statsTable,
					msg : msg
				});
			}
		], 
			function(err){
				console.log(err)
				req.flash('msg', err)
				res.render('statisticspage', {
					title : 'statistics',
					user_stats_table : err,
					full_stats_table : err});
			});
	} else {												// If the user isn't logged in
		res.redirect('/login');								// Redirect them to the login page
	}
};
