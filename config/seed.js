'use strict';

var mongoose = require('mongoose');
var Promise = require("bluebird");
var shuffle = require('shuffle-array');

var config = require('./environment');
var path = require("path"),
    csv = require('csv'),
    parse = require('csv-parse'),
    fs = require("fs");

var Client = require(path.join(config.root, "schema","client")),
  Place = require(path.join(config.root, "schema","place")),
  Commande = require(path.join(config.root, "schema","commande")),
  Zone = require(path.join(config.root, "schema","zone"));


Client.find({}).remove(function(err){
  if (err) throw err;
  console.log("Clients removed");
});


Commande.find({}).remove(function(err){
  if (err) throw err;
  console.log("Commandes removed");
});




var parser = parse({}, function(err, data){
  if(err) console.warn(err);
  var zones = new Array(), promsZones = new Array();
  data.forEach(function(zone){
    if(zone[0]=="Ville") return;

    promsZones.push(new Promise(function(resolve, reject){
      Zone.create({Ville:zone[0], region:zone[1], brut:parseInt(zone[2]), net:parseInt(zone[3])}).then(function(zon){
        resolve(zon);
      }, function(err){
        reject(err);
      });
    }));

    Promise.all(promsZones).then(function(zones){
      console.log(zones.length+" Zones créer");
    }, function(err){
      console.warn(err);
    })
    
  });
});



Zone.find({}).remove(function(err){
  if (err) throw err;
  console.log("Zones removed");

  fs.createReadStream(config.root+"/public/data/prices.csv").pipe(parser);
});

