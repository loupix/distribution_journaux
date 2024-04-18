'use strict';


var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs"),
    jadeCompiler = require('../routes/lib/jadeCompiler');

var mongoose = require('mongoose');

mongoose.Promise = require('bluebird');
mongoose.connect(config.mongo.uri, config.mongo.options);


var nodemailer = require('nodemailer');


let smtpConfig = {
    host: 'mail.infomaniak.com',
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: 'noreply@distral.lu',
        pass: 'Passw0ord123!'
    }
};



var transporter = nodemailer.createTransport(smtpConfig);



var Client = require(path.join(config.root, "schema","client")),
	Paiement = require(path.join(config.root, "schema","paiement")),
	Commande = require(path.join(config.root, "schema","commande")),
	Paiement = require(path.join(config.root, "schema","paiement"));



// let listEmail = Array("marco.regnery@kuechengalerie.lu", "reflex@colot.lu","a.champion@dcpostalservice.lu");

let cmdIds = Array("5ad06cd49d1a9e42ff0283b2");

// var clients = listEmail.map(function(e){
// 	Client.find({"email":e}, function(err, cli){
// 		if(err) console.log(err);
// 		return cli;
// 	});
// });


// console.log(clients);


let sendMail = function(commande, client){
	console.log(client);
	commande.calcTotal().then(function(cmd){
		cmd.getZones().then(function(cmd){
			if(cmd.zones.length > 0)
				var totalNet = cmd.zones.map(function(z){return z.net}).reduce(function(a,b){return a+b});
			else
				var totalNet = 0;

			var options = {client:client, commande:cmd, totalNet:totalNet, moment:require('moment')};
			jadeCompiler.compile("email_commande", options, function(err, html){
				if(err) return res.status(500).send(err);


				var promLoic = new Promise(function(resolve, reject){
					transporter.sendMail({
						from: 'Distral SA <noreply@distral.lu>',
						to: "loic5488@gmail.com",
						subject: "Nouvelle commande DISTRAL",
						html: html
					}, function(err, rep){
						if(err) reject(err);
						else resolve(rep);
					});
				});


				promLoic.then(function(reps){
					console.log(reps)
				}, function(err){
					console.warn(err);
				});
			});
		});
	});
}

cmdIds.forEach(function(id){
	Commande.findOne({_id:id}, function(err, commande){
		if(err) console.warn(err);
		Client.findOne({_id:commande.client}, function(err, client){
			sendMail(commande, client);
		});
	});
});




// Commande.find({total:{$gt:800, $lt:2000}}, function(err, commandes){
// 	console.log(commandes.map(function(c){return c.total;}));
// });

// Paiement.find({}, function(err, paiements){
// 	if(err) console.warn(err);

// 	// console.log(paiements);
// 	paiements.forEach(function(p){
// 		// console.log(p.commande);
// 		if(p.commande != undefined){
// 			Commande.findOne({_id:p.commande}, function(err, commande){
// 				if(err) console.warn(err);
// 				Client.findOne({_id:p.client}, function(err, client){
// 					if(client != null){
// 						console.log(client.email);
// 						console.log(commande._id);
// 						console.log(commande.zones.length+"  "+commande.total);
// 						console.log("\r\n");
						
// 					}
// 					// console.log(commande);
// 				})
				



// 			});
// 		}
// 		// console.log(p.commande);
// 	})
	
	

// 	// console.log(clients);
// });