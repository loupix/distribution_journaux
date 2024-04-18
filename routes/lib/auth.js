var config = require('../../config/environment');
var Promise = require("bluebird");
var path = require("path"),
	fs = require("fs");

var Client = require(path.join(config.root, "schema","client")),
	Commande = require(path.join(config.root, "schema","commande"));


module.exports = function(req, res, next){

	// console.log(req.session);

		if(!req.session.client){
			var clientProm = new Promise(function(resolve, reject){
				Client.create({entreprise:"", adresse:"", 
						ville:"", pays:"", 
						activite:"", telephone:"", numTva:0}, function(err, client){
					if(err) return reject(err);
					return resolve(client);
				});
			});
		}else{
			var clientProm = new Promise(function(resolve, reject){
				Client.findById(req.session.client._id).then(function(client){
					if(client==null || client === undefined){
						Client.create({entreprise:"", adresse:"", 
								ville:"", pays:"", 
								activite:"", telephone:"", numTva:0}, function(err, client){
							if(err) return reject(err);
							return resolve(client);
						});
					}else
						resolve(client);
				}, function(err){
					reject(err);
				});
			});
		}

		clientProm.then(function(client){
			if(!req.session.commande){
				var promCommande = new Promise(function(resolve, reject){
					Commande.create({client:client}, function(err, commande){
						if(err) return reject(err);
						resolve(commande);
					});
				});
			}else{
				var promCommande = new Promise(function(resolve, reject){
					Commande.findById(req.session.commande._id).then(function(commande){

						if(commande==null || commande === undefined){
							var date = new Date();
							var onejan = new Date(date.getFullYear(), 0, 1);
							var year = date.getFullYear();
							var week = Math.ceil( (((date - onejan) / 86400000) + onejan.getDay() + 1) / 7 );
							var distribution = "Semaine "+week+" "+year;
							Commande.create({client:client, distribution:distribution}, function(err, commande){
								if(err) return reject(err);
								resolve(commande);
							});
						}else
							resolve(commande);
					}, function(err){
						reject(err);
					});
				});
			}

			promCommande.then(function(commande){
				req.session.commande = commande;
				req.session.client = client;
				req.session.save(function(err){
					if(err) return next(err);
					next();
				});
			}, function(err){
				next(err);
			})

		}, function(err){
			next(err);
		});
};