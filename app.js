'use strict';

var express = require('express');
var chalk = require('chalk');
var config = require('./config/environment');
var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
mongoose.connect(config.mongo.uri, config.mongo.options);

if (config.seed) {require('./config/seed');}

var app = express();
var server = require('http').createServer(app);
var socket = require('socket.io')(server, { serveClient: true });
// require('./config/sockets.js')(socket);

require('./config/express.js')(app);
// app.use('/admin', require('./routes/admin.js'));
app.use('/api', require('./routes/api.js'));
app.use('/', require('./routes/index.js'));



server.listen(config.port, config.ip, function () {

  console.log(
    chalk.red('\nExpress server listening on port ')
    + chalk.yellow('%d')
    + chalk.red(', in ')
    + chalk.yellow('%s')
    + chalk.red(' mode.\n'),
    config.port,
    app.get('env')
  );

});

module.exports = server;
