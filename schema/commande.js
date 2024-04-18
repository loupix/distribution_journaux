'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
	csv = require('csv'),
    parse = require('csv-parse'),
    moment = require('moment'),
    fs = require("fs");

var SchemaTypes = mongoose.Schema.Types;

var Zone = require("./zone"),
	Client = require("./client"),
	Promotion = require("./promotion");


var CommandeSchema = new Schema({
	intitule: {type:String, default:''},
	poid: {type:String, default:'1g - 20g'},
	format: {type:String, default:'A6'},
	contenu: {type:String, default:''},
	distribution: {type:String, default:''},
	
	codePromo:{type:String, default:''},
	nbPalette:{type:Number, default:0},

	total:{type:Number, default:0},
	totalHT:{type:Number, default:0},

	zones:[{type: Schema.Types.ObjectId, ref: 'Zone'}],
	client:{type: Schema.Types.ObjectId, ref: 'Client'},

	tarifBluescreen:{type:Number, default:13},

	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now}
	
});


CommandeSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});


CommandeSchema.methods.getClient = function(){
	var obj = this;
	return new Promise(function(resolve, reject){
		Client.findOne({_id:obj.client}).then(function(client){
			obj.client = client;
			resolve(obj);
		}, function(err){
			reject(err);
		});
	})
}


CommandeSchema.methods.setClient = function(client){
	var obj = this;
	return new Promise(function(resolve, reject){
		Client.findOne({_id:obj.client}).then(function(client){
			obj.client = client;
			resolve(obj);
		}, function(err){
			reject(err);
		});
	})
}



CommandeSchema.methods.getZones = function(){
	var obj = this;
	return new Promise(function(res, rej){

		var zones = obj.zones.filter(function(zon){ return zon !== null && zon !== undefined; });


		if(zones.length > 0){
			Promise.all(zones.map(function(zoneId){
				return new Promise(function(resolve, reject){
					Zone.findOne({_id:zoneId}).then(function(zon){
						resolve(zon);
					}, function(err){
						reject(err);
					});
				});
			})).then(function(zones){
				obj.zones = zones;
				// obj.save(function(err){
				// 	if(err) return rej(err);
				// 	res(obj);
				// });
				res(obj);
			}, function(err){
				rej(err);
			});
		}else{
			obj.zones = zones;
			res(obj);
		}

	});
}



CommandeSchema.methods.setZones = function(zones){
	var obj = this;
	return new Promise(function(res, rej){

		if(zones === undefined){
			zones = new Array();
		}

		zones = zones.filter(function(zon){ return zon !== null && zon !== undefined; });

		if(zones.length > 0){
			// console.log("new Array : "+zones.length);
			Promise.all(zones.map(function(zone){
				return new Promise(function(resolve, reject){
					Zone.findOne({Ville:zone['Ville']}).then(function(zon){
						resolve(zon);
					}, function(err){
						reject(err);
					});
				})
			})).then(function(zones){
				obj.zones = zones;
				res(obj);
				// obj.save(function(err){
				// 	if(err) return rej(err);
				// 	res(obj);
				// });
			}, function(err){
				console.log("Err Set Zones");
				rej(err);
			});
		}else{
			// console.log("clear Array");
			obj.zones = new Array();
			res(obj);

		}

	});
};



CommandeSchema.methods.verifCodePromo = function(){
	var obj = this;
	return new Promise(function(resolve, reject){

		// Recherche dans le fichier CodePromos.csv
		var parser = parse({}, function(err, data){
			if(err) console.warn(err);
			data.forEach(function(line){
				var code = line[0], reduc = line[1];
				if(code == obj.codePromo)
					return resolve(reduc);
			});

			resolve(0);

			// si il y a rien , on recherche le client & sa promotion
			// Promotion.findByClient(obj.client).then(function(promo){
			// 	if(promo.reduction.montant > 0)
			// 		resolve(promo.reduction.montant);
			// 	else
			// 		resolve(Math.round(obj.total * promo.reduction.percent, 2)/100);
			// }, function(err){resolve(0);});
		});

		fs.createReadStream(config.root+"/CodePromos.csv").pipe(parser);

	});
}




CommandeSchema.methods.calcTotal = function(){
	var obj = this;
	return new Promise(function(res, rej){

		if(obj.zones.length==0){
			obj.total = parseInt(0);
			res(obj);
		}

		obj.getZones().then(function(obj){

			if(obj.zones.length == 0){
				obj.total = parseInt(0);
				res(obj);
			}

			// Calcule la Somme des zones, en Net

			var sumNet = obj.zones.map(function(z){return parseInt(z['net']);})
			if(sumNet.length>0)
				sumNet = sumNet.reduce(function(a,b){return a+b;});
			else
				sumNet = 0;
			

			// Attention au + de 200g
			if(obj.poid.split("-").length > 0)
				var poid = obj.poid.split("-")[0].split("g")[0];
			else
				var poid = obj.poid.split("+")[1].split("de")[1].split("g")[0];



			// Calcule au nombre de palette
			// obj.total += obj.nbPalette*50;


			// Calcule par rapport au poid

			if(poid<=20)
				var total = sumNet*39/1000;
			else if(poid<=40)
				var total = sumNet*43/1000;
			else if(poid<=60)
				var total = sumNet*45/1000;
			else if(poid<=100)
				var total = sumNet*51/1000;
			else if(poid<=120)
				var total = sumNet*70.80/1000;
			else if(poid<=150)
				var total = sumNet*85/1000;
			else if(poid<=200)
				var total = sumNet*106.20/1000;
			else{
				// Sinon .. Sur Devis
				obj.total = -1;
				return res(obj);
			}




				
			
			// calcule Majoration par rapport au nombre NET

			if(sumNet<=10000)
				total = total * 1.2;
			else if(sumNet<=20000)
				total = total * 1.1;
			obj.total = Math.round(total*100)/100;


			obj.verifCodePromo().then(function(reduc){
				obj.total = obj.total - reduc;

				// notre part / pourcentage dégressif
				// if(obj.total<10000){
				// 	obj.tarifBluescreen = 13;
				// }else if(obj.total <= 50000){
				// 	obj.tarifBluescreen = 11;
				// }else{
				// 	obj.tarifBluescreen = 8;
				// }


				obj.tarifBluescreen = 13;



				obj.totalHT = obj.total;

				obj.total = parseFloat(obj.total*1.17); // TVA
				obj.total = Math.round(obj.total*100)/100; // Arrondi

				res(obj);
			}, function(err){
				reject(err);
			})
			// obj.save(function(err){
			// 	if(err) return rej(err);
			// 	res(obj);
			// });
			

		}, function(err){
			rej(err);
		});
	});
}


module.exports = mongoose.model('Commande', CommandeSchema);
