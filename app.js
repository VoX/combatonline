/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  http = require('http'),
  path = require('path'),
  game = require('./tankServer.js'),
  flash = require('connect-flash');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.compress());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'asidawodwpaod239041idw09wid2q09i'
  }));
  app.use(flash());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/login', routes.login);
app.post('/login', routes.try_login);
app.get('/register', routes.register);
app.get('/logout', routes.logout);
app.post('/register', routes.try_register);
app.get('/playgame', routes.playgame);

// Remove comment to enable the statistics page
//app.get('/statistics', routes.getStatistics);

var webServer = http.createServer(app);

webServer.listen(app.get('port'), function() {
  console.log("Web server listening on port " + app.get('port'));
  routes.dbconnect();
});

var gameServer = game.startServer(webServer);