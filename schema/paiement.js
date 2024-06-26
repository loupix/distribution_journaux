'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs");


var mangopay = require('mangopay2-nodejs-sdk');
var api = new mangopay({
    clientId: config.mangopay.clientId,
    clientPassword: config.mangopay.clientPassword,
    // debugMode:true,
    // Set the right production API url. If testing, omit the property since it defaults to sandbox URL
    baseUrl: config.mangopay.baseUrl
});





var Place = require("./place"),
	Client = require("./client"),
	Commande = require("./commande");

var PaiementSchema = new Schema({
	client:{type: Schema.Types.ObjectId, ref: 'Client'},
	commande:{type: Schema.Types.ObjectId, ref: 'Commande'},

	montant:{Type:Number, default:0},
	fees:{Type:Number, default:0},
	percentFees:{Type:Number, default:0},

	mangoPay: {
		payInId :{type:Number, default:0},
		payOutId :{type:Number, default:0},
		erreurs:{
			card:{type:String, default:''},
			payOut:{type:String, default:''},
			payIn:{type:String, default:''}
		}
	},

	valide: {type: Boolean, default: false},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now}
	
});


PaiementSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

PaiementSchema.methods.getWalletClient = function(){
	var obj = this;
	return new Promise(function(resolve, reject){

		Client.findById(obj.client).then(function(client){

			if(client.mangoPay != null && client.mangoPay.userId != 0){
				// on retourne le wallet & infos

				var promUser = new Promise(function(res, rej){
					api.Users.get(client.mangoPay.userId).then(function(user){
						res(user);
					}, function(err){
						rej(err);
					});
				});

				var promCard = new Promise(function(res, rej){
					api.CardRegistrations.get(client.mangoPay.cardRegistrationId).then(function(cardRegistration){
						res(cardRegistration);
					}, function(err){
						rej(err);
					});
				});

				var promWallet = new Promise(function(res, rej){
					api.Wallets.get(client.mangoPay.walletId).then(function(wallet){
						res(wallet);
					}, function(err){
						rej(err);
					});
				});


				Promise.all([promUser, promCard, promWallet]).then(function(data){
					var user = data[0], cardRegistration = data[1], wallet = data[2];
					resolve({
						'user':user,
						'cardRegistration':cardRegistration,
						'wallet':wallet
					});
				}, function(err){
					reject(err);
				});


			}else{
				// on creer le wallet et infos

				api.Users.create({
				    "FirstName": client.entreprise,
				    "LastName": "Distral SA",
				    "Address": {
				    	"AddressLine1":client.adresse,
				    	"PostalCode":"00001",
				    	"Region":"EU",
				    	"City":client.ville,
				    	"Country":"FR"
				    },
				    "Birthday": 1300186358,
				    "Nationality": "FR",
				    "CountryOfResidence": "FR",
				    "Occupation": client.activite,
				    "PersonType": "NATURAL",
				    "Email": client.email,
				    "Tag": "Client "+client.entreprise
				}).then(function(user){

					var promCard = new Promise(function(res, rej){
						// Create Card
						api.CardRegistrations.create({
							"Tag":"Carte pour "+user.FirstName,
							"UserId":user.Id,
							"Currency":"EUR",
							"CardType":"CB_VISA_MASTERCARD",
						}).then(function(cardRegistration){
							res(cardRegistration);				
						}, function(err){
							rej(err);
						});
					});


					var promWallet = new Promise(function(res, rej){
						// create Wallet
						api.Wallets.create({
							"Owners":[user.Id],
							"Description":"Wallet pour DistralSA",
							"Currency":"EUR"
						}).then(function(wallet){
							res(wallet);
						}, function(err){
							rej(err);
						});
					});


					Promise.all([promCard, promWallet]).then(function(data){
						var cardRegistration = data[0], wallet = data[1];

						// console.log("cardRegistration");
						// console.log(cardRegistration);

						client.mangoPay.userId = user.Id;
						client.mangoPay.cardRegistrationId = cardRegistration.Id;
						client.mangoPay.walletId = wallet.Id;
						client.save(function(err){
							if(err) console.log(err);
						});

						obj.client = client;
						obj.save(function(err){
							if(err) reject(err);
							else resolve({
								'user':user,
								'cardRegistration':cardRegistration,
								'wallet':wallet
							})
						});
					}, function(err){
						reject(err);
					});
				}, function(err){
					reject(err);
				});
			}




		}, function(err){
			reject(err);
		})
	});


};


PaiementSchema.methods.getWalletDistral = function(){
	var obj = this;
	return new Promise(function(resolve, reject){
		fs.exists(path.join(config.root, config.fileId), function(exist){
			if(exist){
				// Get wallet & infos Credit
				fs.readFile(path.join(config.root, config.fileId), function(err, data){
					if(err) reject(err);
					else resolve(JSON.parse(data.toString()));
				});

			}else{
				// Create user, wallet & RIB

				api.Users.create({
				    "FirstName": "Distral",
				    "LastName": "SA",
				    "Address": {
				    	"AddressLine1":config.rib.adresse,
				    	"PostalCode":"00001",
				    	"Region":"EU",
				    	"City":"Luxembourg",
				    	"Country":"LU"
				    },
				    "Birthday": 1300186358,
				    "Nationality": "FR",
				    "CountryOfResidence": "FR",
				    "Occupation": "Vente de papiers",
				    "PersonType": "NATURAL",
				    "Email": config.email,
				    "Tag": "Entreprise Distral",
				}).then(function(user){

					// creer un compte RIB
					var promBank = new Promise(function(res, rej){
						api.Users.createBankAccount(user.Id, {
							"Type": "IBAN",
							"Tag": "Virement RIB",
							"Country": "LU",
							"OwnerAddress":{
								"AddressLine1":config.rib.adresse,
						    	"PostalCode":"00001",
						    	"Region":"EU",
						    	"City":"Luxembourg",
						    	"Country":"LU"
						    },
							"OwnerName":config.rib.name,
							"BIC":config.rib.bic,
							"IBAN":config.rib.iban,
						}).then(function(bank){
							res(bank);
						}, function(err){
							rej(err);
						});
					});

					// Create wallet
					var promWallet = new Promise(function(res, rej){
						api.Wallets.create({
							"Owners":[user.Id],
							"Description":"Wallet pour DistralSA",
							"Currency":"EUR"
						}).then(function(wallet){
							res(wallet);
						}, function(err){
							rej(err);
						});
					});
					

						// Sauvegarde dans un fichier

					Promise.all([promBank, promWallet]).then(function(data){
						var bank = data[0], wallet = data[1];
						var data = {
							"user":user,
							"bank":bank,
							"wallet":wallet
						};

						fs.writeFile(path.join(config.root, config.fileId), JSON.stringify(data), function(err){
							if(err) return reject(err);
							resolve(data);
						});
						
					}, function(err){
						reject(err);
					});

				}, function(err){
					reject(err);
				});
			}
		})
	});
}


module.exports = mongoose.model('Paiement', PaiementSchema);
