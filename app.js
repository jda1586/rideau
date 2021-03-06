var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    sassMiddleware = require('node-sass-middleware'),
    routes = require('./routes/index'),
    session = require('express-session'),
    app = express();

//View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Uncomment after placing your favicon in /public

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev', {
	skip: function (req, res) {
		return res.statusCode < 400; //Only log errors
	}
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "de0f92987b8b6e7337898b8e894846ac",
    resave: true,
    saveUninitialized: false
}));
app.use(sassMiddleware({
	src: path.join(__dirname, '/public/scss'),
	dest: path.join(__dirname, '/public/stylesheets'),
	debug: false,
	prefix: '/stylesheets',
	outputStyle: 'compressed'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

//Catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

//Error handlers

//Development error handler
//Will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

//Production error handler
//No stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;