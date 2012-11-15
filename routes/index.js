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
	var name = req.body.name;
	var hash = req.body.hash;

	if(!name || !hash) {
		req.flash('msg', 'Missing login information!');
		res.redirect('/login');
	} else {
		conn.query("select uid from users where username = ? and password = ?", [username, password], function(err, result) {
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
	var username = req.body.name;
	var password = req.body.hash;
	var email = req.body.email;

	if(!username || !password || !email) {
		req.flash('msg', 'Missing information for registration!');
		res.redirect('/register');
	} else {
		conn.query("insert into users values (NULL, ?, ?, ?)", [username, email, password], function(err, result) {
			if(err) {
				console.log("error: " + err);
				req.flash('msg', err);
				res.redirect('/register');
			} else {
				req.flash('color', "green");
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
	var color = req.flash('color')[0] || 'red';

	res.render('loginpage', {
		title: "login",
		msg: msg,
		msgcolor: color
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