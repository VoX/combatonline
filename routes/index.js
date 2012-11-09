var mysql = require('mysql');
var program = require('commander');
var async = require('async');

var conn; 


var connInfo = {
	host: 'instance28219.db.xeround.com',
	port: 18453,
	user: 'Ian',
	password: 'Reddit11',
	database: 'users'
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
	var name = req.body.name;
	var hash = req.body.hash;

	if(!name || !hash) {
		req.flash('msg', 'Missing login information!');
		res.redirect('/login');
	} else {
		conn.query("select uid from users where name = ? and hash = ?", [name, hash], function(err, result) {
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
	var hash = req.body.hash;
	var email = req.body.email;

	if(!name || !hash || !email) {
		req.flash('msg', 'Missing information for login!');
		res.redirect('/login');
	} else {
		conn.query("insert into users values (NULL, ?, ?, ?, 0, NULL)", [name, email, hash], function(err, result) {
			if(err) {
				console.log(err);
				req.flash('msg', err);
				res.redirect('/register');
			} else {
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
		var statsTable = '<table><tr><th>Username</th><th>Games Played</th><th>Kills</th><th>Deaths</th><th>K/D Ratio</th></tr>';
		conn.query("select * from statistics", function(err, stats) {		// Query the database for all statistics
			if(err) {														// If there's an error
				console.log(err);											// Log the error to the console
				req.flash('msg', err);										// Flash the error message to the user
			} else {														// If the query was successful
				for(var i = 0; i < stats.length; i++){						// Loop through the statistic entries
					var stat = stats[i];									// Grab the current statistic object
					var user = '';
					conn.query('select name from users where uid = ?', [stat.uid], function(err, result){	// Query the database for the statistic's user
						if(err){											// If there's an error
							console.log(err);								// Log the error to the console
							req.flash('msg', err);							// Flash the error message to the user
						} else {											// If the query was successful
							user = results[0].name;							// Grab the user's name
						}
					});
					statsTable += '<tr>'													// Create a new table row
					statsTable += '<td id="username">' + user + '</td>';					// Add the user's name to the row
					statsTable += '<td id="gamesPlayed">' + stat.gamesPlayed + '</td>';		// Add the # of games played to the row
					statsTable += '<td id="kills">' + stat.kills + '</td>';					// Add the # of kills to the row
					statsTable += '<td id="deaths">' + stat.deaths + '</td>';				// Add the # of deaths to the row
					statsTable += '<td id="ratio">' + (stat.kills/stat.deaths) + '</td>';	// Add the K/D ratio to the row
				}
			}
		});
		statsTable += '</table>';							// Complete the statistics table
		res.render('statisticspage', {						// Render it to the statistics page
			full_stats_table : statsTable
		});
	} else {												// If the user isn't logged in
		res.redirect('/login');								// Redirect them to the login page
	}
};
