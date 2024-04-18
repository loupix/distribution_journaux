var express = require('express');
var router = express.Router();
var config = require('../config/environment'),
	auth = require("./lib/auth.js");
/* GET home page. */



var Promise = require("bluebird");
var path = require("path"),
	request = require('request'),
	fs = require("fs");



var mangopay = require('mangopay2-nodejs-sdk');
var api = new mangopay({
    clientId: config.mangopay.clientId,
    clientPassword: config.mangopay.clientPassword,
    // debugMode:true,
    // Set the right production API url. If testing, omit the property since it defaults to sandbox URL
    baseUrl: config.mangopay.baseUrl
});




var Client = require(path.join(config.root, "schema","client")),
	Paiement = require(path.join(config.root, "schema","paiement")),
	Commande = require(path.join(config.root, "schema","commande"));





router.post('/', function(req, res) {

	// req.session.destroy();
	// res.send();
	var errors = {'02625':"Invalid card number", '02626':"Invalid date. Use mmdd format", '02627':"Invalid CCV number",'02628':"Transaction refused", '02101':"Internal Error", '02632':"Method GET is not allowed", '09102':"Account is locked or inactive",'01902':"This card is not active", '02624':"Card expired", '09104':"Client certificate is disabled", '09201':"You do not have permissions to make this API call",'02631':"Delay exceeded"};


	if(req.query.errorCode !== undefined){
		var errorCode = req.query.errorCode;
		res.render('reglement', { req:req, title: 'Distral S.A - Valider', errorCode:errorCode, error:errors[errorCode] });
	}else if(req.session.paiement === undefined || req.session.paiement === null){
		res.redirect("/");
	}



	var montantTotal = req.session.commande.total * 100; // Mangopay prend en Centimes, donc je rajoute 2 zéro.
	var feesAmount = parseFloat(montantTotal * req.session.commande.tarifBluescreen/100);

	// paiement.montant = parseFloat(montantTotal);
	// paiement.fees = parseFloat(feesAmount);

	var client = req.session.paiement.client;


	var paiement = new Paiement({client:req.session.client});

	Promise.all([
		paiement.getWalletDistral()
	]).then(function(data){
		var entreprise = data[0];

		api.CardRegistrations.get(req.body.idCard).then(function(card){

			// console.log('\n\r client');
			// console.log(client);

			// console.log('\n\r entreprise');
			// console.log(entreprise);


			// console.log('\n\r card');
			// console.log(card);


			req.session.paiement.card = card;
			req.session.save(function(err){
				if(err) console.warn(err);
			});

			if(card.Status=="ERROR"){
				// return res.redirect(card.CardRegistrationURL);
				if(card.ResultCode == '105202') {

					message = 'Le numéro de CB est éronné';
				}
				else if(card.ResultCode == '105203') {

					message = 'La date de CB est érronée';
				}
				else if(card.ResultCode == '105204') {

					message = 'Le code de sécurité de CB est érroné';
				}
				else {

					message = 'Une erreur est survenue. Veuillez réssayer plus tard!';
				}

		    	return res.send("Erreur Card "+card.ResultCode+"     "+card.ResultMessage+"<br /><br /><h2>"+message+"</h2>");
			}

			api.PayIns.create({
				"Tag":"Réglement Distral.lu",
				"PaymentType":"CARD",
				"ExecutionType":"DIRECT",
				"ExecutionDetails":{
					"SecureModeReturnURL":config.website,
					"CardId":card.CardId,
					"SecureMode":"DEFAULT",
				},
				"AuthorId":client.user.Id,
				"CreditedWalletId":entreprise.wallet.Id,
				"DebitedWalletId":client.wallet.Id,
				"CardId":card.CardId,
				"DebitedFunds":{
					"Currency":"EUR",
					"Amount":montantTotal,
				},
				"Fees":{
					"Currency":"EUR",
					"Amount":feesAmount
				},
				'SecureModeReturnURL':config.website+"/reglement/secure",
				'ReturnURL':config.website,

			}).then(function(payIn){

				console.log('\n\r-- payIn --');
				console.log(payIn);


				if(payIn.Status=="CREATED"){
					// Redirection vers 3D Secure ?
					return res.redirect(payIn.SecureModeRedirectURL);
				}else if(payIn.Status=="ERROR" || payIn.Status=="FAILED"){
					message = 'Une erreur est survenue. Veuillez réssayer plus tard!';
					return res.send("Erreur PayIn "+payIn.ResultCode+"     "+payIn.ResultMessage+"<br /><br /><h2>"+message+"</h2>");
				}


				// Virement ver Distral

				api.PayOuts.create({
					"AuthorId":entreprise.user.Id,
					"DebitedFunds":{
						"Currency":"EUR",
						"Amount":payIn.CreditedFunds.Amount,
					},
					"Fees":{
						"Currency":"EUR",
						"Amount":0
					},
					'PaymentType': 'BANK_WIRE',
					"BankAccountId":entreprise.bank.Id,
					"DebitedWalletId":entreprise.wallet.Id,
					// "CreditedWalletId":client.wallet.Id,
				}).then(function(payOut){
					console.log(' \n\r-- payOut --');
					console.log(payOut);


					if(payOut.Status=="ERROR" || payOut.Status=="FAILED"){
						message = 'Une erreur est survenue. Veuillez réssayer plus tard!';
						return res.send("Erreur "+payOut.ResultCode+"     "+payOut.ResultMessage+"<br /><br /><h2>"+message+"</h2>");
					}


					paiement.mangoPay.payInId = parseInt(payIn.Id);
					paiement.mangoPay.payOutId = parseInt(payOut.Id);
					paiement.percentFees = parseFloat(req.session.commande.tarifBluescreen);
					
					if(card.Status=="VALIDATED" && payIn.Status=="SUCCEEDED" && payOut.Status=="CREATED")
						paiement.valide=true;
					else{
						paiement.valide=false;
						paiement.mangoPay.erreurs.PayIn = payIn.ResultMessage;
						paiement.mangoPay.erreurs.PayOut = payOut.ResultMessage;
						paiement.mangoPay.erreurs.card = card.ResultMessage;
					}

					paiement.save(function(err){
						if(err) console.warn(err);
						console.log("Paiement Enregistrer");
					});

					req.session.save(function(err){
						if(err) res.status(500).send(err);
						else res.render('reglement', { req:req, title: 'Distral S.A - Réglement Validé', 
								client:client, entreprise:entreprise,
								payIn:payIn, payOut:payOut, card:card, error:false });
					});

				}, function(err){
					console.warn(err);
					paiement.mangoPay.erreurs.payOut = err;
					res.status(500).send(err);
				});

			}, function(err){
				console.warn(err);
				paiement.mangoPay.erreurs.payIn = err;
				res.status(500).send(err);
			});
		}, function(err){
			console.warn(err);
			res.status(500).send(err);
		});
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	});
});







router.get('/secure', function(req, res) {
	var errors = {'02625':"Invalid card number", '02626':"Invalid date. Use mmdd format", '02627':"Invalid CCV number",'02628':"Transaction refused", '02101':"Internal Error", '02632':"Method GET is not allowed", '09102':"Account is locked or inactive",'01902':"This card is not active", '02624':"Card expired", '09104':"Client certificate is disabled", '09201':"You do not have permissions to make this API call",'02631':"Delay exceeded"};


	if(req.query.errorCode !== undefined){
		var errorCode = req.query.errorCode;
		res.render('reglement', { req:req, title: 'Distral S.A - Valider', errorCode:errorCode, error:errors[errorCode] });
	}else if(req.session.paiement === undefined || req.session.paiement === null){
		res.redirect("/");
	}

	var client = req.session.paiement.client, 
		entreprise = req.session.paiement.entreprise,
		card = req.session.paiement.card;


	var paiement = new Paiement({client:req.session.client});

	paiement.getWalletDistral().then(function(entreprise){

		api.PayIns.get(req.query.transactionId).then(function(payIn){

			console.log('\n\r -- payIn Secure --');
			console.log(payIn);


			if(payIn.Status=="ERROR" || payIn.Status=="FAILED"){
				message = 'Une erreur est survenue. Veuillez réssayer plus tard!';
				return res.send("Erreur PayIn "+payIn.ResultCode+"     "+payIn.ResultMessage+"<br /><br /><h2>"+message+"</h2>");
			}

			api.PayOuts.create({
				"AuthorId":entreprise.user.Id,
				"DebitedFunds":{
					"Currency":"EUR",
					"Amount":payIn.CreditedFunds.Amount,
				},
				"Fees":{
					"Currency":"EUR",
					"Amount":0
				},
				'PaymentType': 'BANK_WIRE',
				"BankAccountId":entreprise.bank.Id,
				"DebitedWalletId":entreprise.wallet.Id,
				"CreditedWalletId":client.wallet.Id,
			}).then(function(payOut){
				console.log(' \n\r -- payOut Secure --');
				console.log(payOut);


				if(payOut.Status=="ERROR" || payOut.Status=="FAILED"){
					message = 'Une erreur est survenue. Veuillez réssayer plus tard!';
					return res.send("Erreur PayOut "+payOut.ResultCode+"     "+payOut.ResultMessage+"<br /><br /><h2>"+message+"</h2>");
				}

				// Enregistre le paiement dans la BDD



				paiement.mangoPay.payInId = parseInt(payIn.Id);
				paiement.mangoPay.payOutId = parseInt(payOut.Id);




				if(payIn.Status=="SUCCEEDED" && payOut.Status=="CREATED")
					paiement.valide=true;
				else{
					paiement.valide=false;
					paiement.mangoPay.erreurs.PayIn = payIn.ResultMessage;
					paiement.mangoPay.erreurs.PayOut = payOut.ResultMessage;
				}

				paiement.save(function(err){
					if(err) console.warn(err);
					console.log("Paiement Enregistrer");
				});

				var card = req.session.paiement.card;
				req.session.save(function(err){
					if(err){
						console.warn(err);
						res.status(500).send(err);
					}
					else res.render('reglement', { req:req, title: 'Distral S.A - Réglement Validé', payIn:payIn, 
						card:card,payOut:payOut, error:false });
				});

			}, function(err){
				console.warn(err);
				res.status(500).send(err);
			});
		}, function(err){
			console.warn(err);
			res.status(500).send(err);
		});
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	});
});
		


module.exports = router;