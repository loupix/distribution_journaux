'use strict';


var config = require('./config/environment'),
	path = require("path"),
    fs = require("fs");

var Client = require(path.join(config.root, "schema","client")),
	Paiement = require(path.join(config.root, "schema","paiement")),
	Commande = require(path.join(config.root, "schema","commande")),
	Paiement = require(path.join(config.root, "schema","paiement"));

console.log(config);

Paiement.find({}, function(err, paiements){
	if(err) console.warn(err);
	console.log(paiements);
});