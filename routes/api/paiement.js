var express = require('express');
var router = express.Router();
var config = require('../../config/environment'),
	auth = require("../lib/auth.js");

var Promise = require("bluebird");
var path = require("path"),
	fs = require("fs");

var mangopay = require('mangopay2-nodejs-sdk');
var api = new mangopay({
    clientId: config.mangopay.clientId,
    clientPassword: config.mangopay.clientPassword,
    // Set the right production API url. If testing, omit the property since it defaults to sandbox URL
    baseUrl: config.mangopay.baseUrl
});



var Client = require(path.join(config.root, "schema","client")),
	Paiement = require(path.join(config.root, "schema","paiement")),
	Commande = require(path.join(config.root, "schema","commande"));



router.get('/', function(req, res) {
	res.send();
});



router.post('/card', function(req, res) {
	var paiement = new Paiement({});

	Promise.all([
		paiement.getWalletClient(req.session.client),
		paiement.getWalletDistral()
	]).then(function(data){
		var client = data[0], entreprise = data[1];
		res.json(client['cardRegistration']);
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	});
});





router.put('/', function(req, res) {
	var paiement = new Paiement({});

	Promise.all([
		paiement.getWalletClient(req.session.client),
		paiement.getWalletDistral()
	]).then(function(data){
		var client = data[0], entreprise = data[1];

		// console.log(client);
		// console.log(entreprise);

		req.session.paiement = paiement;
		req.session.save(function(err){
			if(err){
				console.warn(err);
				res.status(500).send(err);
			}else{
				res.json(client);
			};
		});

		
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	});
});



router.put('/card', function(req, res) {
	var card = req.body.card;
	req.session.paiement.card = card;
	req.session.save(function(err){
		if(err) return res.status(500).send(err);
		else return res.json({error:false});
	});
	
});



// router.post('/run', function(req, res){


// 	var paiement = req.session.paiement;

// 	Paiement.findById(req.session.paiement._id).then(function(paiement){

// 		var feesAmount = parseFloat(req.session.commande.total * config.mangopay.fees/100);

// 		Promise.all([
// 			paiement.getWalletClient(req.session.client),
// 			paiement.getWalletDistral()
// 		]).then(function(data){
// 			var client = data[0], entreprise = data[1];

// 			console.log(client);
// 			console.log(entreprise);

// 			api.PayIns.create({
// 				"AuthorId":entreprise.user.Id,
// 				"CreditedWalletId":entreprise.wallet.Id,
// 				"CardId":card.Id,
// 				"DebitedFunds":{
// 					"Currency":"EUR",
// 					"Amount":paiement.total,
// 				},
// 				"Fees":{
// 					"Currency":"EUR",
// 					"Amount":feesAmount
// 				},
// 				"ReturnURL":config.website,


// 			}).then(function(payIn){
// 				console.log(payIn);
// 				res.json(payIn);


// 			}, function(err){
// 				console.warn(err);
// 				res.status(500).send(err);
// 			})
// 		}, function(err){
// 			console.warn(err);
// 			res.status(500).send(err);
// 		})
// 	}, function(err){
// 		console.warn(err);
// 		res.status(500).send(err);
// 	});
// });


router.patch('/', function(req, res){
	
});



module.exports = router;