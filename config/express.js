'use strict';

var express = require('express');
var compression = require('compression');
var morgan = require('morgan');
var path = require('path');
var bodyParser = require('body-parser');

// auth purpose
var helmet = require('helmet'),
    session = require('express-session'),
    flash = require('connect-flash'),
/*    toastr = require('express-toastr'),
*/    favicon = require('serve-favicon'),
    passport = require('passport'),
    mongoStore = require('connect-mongo')(session),
    mongoose = require('mongoose');

var config = require('./environment');
var hour = 3600000;




function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}



function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: err });
  } else {
    next(err);
  }
}


module.exports = function (app) {

  var env = config.env;

  app.set('views', path.join(config.root, 'views'));
  app.set('view engine', 'jade');

  // sécurité
  app.use(helmet());
  app.disable('x-powered-by');


  // gestion erreurs
  app.use(logErrors);
  app.use(clientErrorHandler);

  // config & optimisation
  app.disable('etag');
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(compression());
  app.use(morgan('dev'));
  app.use(passport.initialize());
  app.use(express.static(path.join(config.root, 'public')));
  app.use(favicon(path.join(config.root, 'public', 'images', 'favicone.png')));

  // app.use('/admin', express.static(path.join(config.root, 'admin')));
  // app.set('adminPath', 'admin');
  // app.set('uploadsPath', path.join(config.root, 'public', 'uploads'));

  app.use(function(req, res, next){
    res.locals._ = require('underscore');
    next();
  });

  // app.set('trust proxy', 1);
  app.use(session({
    secret: config.secrets.session,
    resave: true,
    saveUninitialized: true,
    cookie: {
      expires:new Date(Date.now() + hour),
      maxAge:hour },
    store: new mongoStore({ mongooseConnection: mongoose.connection }, {useNewUrlParser:true, useUnifiedTopology: true})
  }));

  //toaster
  app.use(flash());
/*  app.use(toastr());
*/
  if (env === 'development' || env === 'test') {
    app.use(require('errorhandler')());
  }

};
