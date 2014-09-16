var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var debug = require('debug')('mbac:app');
var express = require('express');
var logger = require('morgan');
var mongoose = require('mongoose');
var path = require('path');
var Promise = require('Promise');
var serveFavicon = require('serve-favicon');
var serveStatic = require('serve-static');
var session = require('express-session');
var Store = require('mongoose-express-session-store');

var app;

exports.getInstance = function() {
    if (app) {
        return Promise.resolve(app);
    }

    var config = require('config');

    return (new Promise(
        function(resolve, reject) {
            mongoose.connect(config.database.fullURI).connection
                .once('error', reject)
                .once('open', resolve);
        })
    ).then(function(conn) {
        debug('Connected to db at ' + config.database.URI);

        app = express();

        // configuration setup
        app.set('config', config);
        app.set('debug', debug);

        // view engine setup
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'jade');

        // middleware setup
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(cookieParser());
        app.use(session({store: new Store, secret: 'IL0veK4t', proxy: true, resave: true, saveUninitialized: true}));
        app.use(serveFavicon(path.join(__dirname, '..', '..', 'public', 'mbac.ico')));
        app.use(serveStatic(path.join(__dirname, '..', '..', 'public')));

        app.use(function(req, res, next) {
            require('models/page')
                .list({index: /(?:top-bar)|(?:footer)/, published: true})
                .then(function(pages) {
                    res.locals.path = req.path;
                    res.locals.pages = pages;
                    next();
                })
                .then(null, next);
        });

        // plugins
        require('plugins/auth').setup(app);

        // routes setup
        app.use('/', require('routes/index'));

        // error handlers setup

        // catch 404 and forward to error handler
        app.use(function(req, res, next) {
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

        // development env will print stacktrace
        app.use(function(err, req, res, next) {
            var status = err.status = err.status || 500;
            res.status(status);
            res.render(
                'error',
                {
                    error:
                        app.get('env') === 'development'
                            ? err
                            : {message: err.message, status: status}
                }
            );
        });

        return app;
    });
};
