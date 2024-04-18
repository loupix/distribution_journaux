var express = require('express');
var router = express.Router();
var config = require('../../config/environment'),
	auth = require("../lib/auth.js");

var Promise = require("bluebird");
var path = require("path"),
	fs = require("fs")
	csv = require('csv'),
    parse = require('csv-parse');


var Client = require(path.join(config.root, "schema","client")),
	Commande = require(path.join(config.root, "schema","commande"));


router.post('/get', function(req, res) {
	res.send()
});



router.post('/getAll', function(req, res) {
	Client.find().then(function(clients){
		res.json(clients);
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	})
});


router.get('/getMe', auth,  function(req, res) {

	req.session.commande.getZones().then(function(cmd){
		cmd.calcTotal().then(function(cmd){
			req.session.commande = cmd;
			res.json({client:req.session.client, commande:cmd});
		}, function(err){
			console.warn(err);
			res.status(500).send(err);
		})
		
	}, function(err){
		console.warn(err);
		res.status(500).json(err);
	});
});


router.put('/', auth, function(req, res) {
	var coordonnee = req.body.coordonnee;
	
	Client.create(coordonnee).then(function(client){
		res.json(client);
	});
});


router.patch('/', auth, function(req, res) {
	var clientId = req.body.clientId,
		coordonnee = req.body.coordonnee;

	Client.findOne({_id:clientId}).then(function(clientDb){
		clientDb.entreprise = coordonnee.entreprise;
		clientDb.adresse = coordonnee.adresse;
		clientDb.ville = coordonnee.ville;
		clientDb.pays = coordonnee.pays;
		clientDb.email = coordonnee.email;
		clientDb.activite = coordonnee.activite;
		clientDb.telephone = coordonnee.telephone;
		clientDb.numTva = coordonnee.numTva;

		clientDb.save(function(err){
			if(err) res.status(500).send(err);
			else res.json(clientDb);
		})
	})
});






router.patch('/lang', auth, function(req, res) {
	var lang = req.body.lang;


	var parser = parse({}, function(err, data){
		if(err) console.warn(err);

		var langs = {'fr':new Array(), 'en':new Array(), 'de':new Array()}
		data.forEach(function(txt){
			langs['fr'].push(txt[0]);
			langs['en'].push(txt[1]);
			langs['de'].push(txt[2]);
		});



		Client.findOne({_id:req.session.client._id}).then(function(clientDb){
			clientDb.lang = lang;
			clientDb.save(function(err){
					if(err) res.status(500).send(err);
					else res.json({client:clientDb, langs:langs[lang]});
				})
			})
	});



	fs.createReadStream(config.root+"/public/data/traduction.csv").pipe(parser);

	
});







router.get('/lang', auth, function(req, res) {
	var lang = req.session.client.lang;


	var parser = parse({}, function(err, data){
		if(err) console.warn(err);

		var langs = {'fr':new Array(), 'en':new Array(), 'de':new Array()}
		data.forEach(function(txt){
			langs['fr'].push(txt[0]);
			langs['en'].push(txt[1]);
			langs['de'].push(txt[2]);
		});



		Client.findOne({_id:req.session.client._id}).then(function(clientDb){
			res.json({client:clientDb, langs:langs[lang]});
		}, function(err){
			res.status(500).send(err);
		});
	});


	fs.createReadStream(config.root+"/public/data/traduction.csv").pipe(parser);

	
});

module.exports = router;