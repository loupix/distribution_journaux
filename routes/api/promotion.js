var express = require('express');
var router = express.Router();
var config = require('../../config/environment'),
	auth = require("../lib/auth.js"),
	authAdmin = require("../lib/authAdmin.js");

var Promise = require("bluebird");
var path = require("path"),
	fs = require("fs")
	csv = require('csv'),
    parse = require('csv-parse');


var Client = require(path.join(config.root, "schema","client")),
	Commande = require(path.join(config.root, "schema","commande")),
	Promotion = require(path.join(config.root, "schema","promotion"));


router.post('/get', function(req, res) {
	var id = req.body.id;
	Promotion.findById(id).then(function(prom){res.json(prom);}, function(err){res.status(500).send(err);});
});


router.post('/getAll', function(req, res) {
	Promotion.find().then(function(proms){
		var promProms = proms.map(function(promo){
			return new Promise(function(resolve, reject){
				promo.getClient().then(function(prom){
					resolve(prom);
				}, function(err){reject(err);})
			})
		});
		Promise.all(promProms).then(function(allProms){
			res.json(allProms);
		}, function(err){
			console.warn(err);
			res.status(500).send(err);
		})
	}, function(err){
		console.warn(err);
		res.status(500).send(err);
	})
});


router.put("/", auth, function(req, res){
	var prom = new Promotion();

	var reduction = {montant:parseFloat(req.body.promotion.reduction.montant), 
			percent:parseFloat(req.body.promotion.reduction.percent)};

	prom.client = req.body.promotion.entreprise;
	prom.reduction = reduction;
	prom.valide = req.body.valide;
	prom.save(function(err){
		if(err) return res.status(500).send(err);
		prom.getClient().then(function(promo){
			return res.json(promo);
		}, function(err){
			return res.status(500).send(err);
		})
	})
});




router.patch("/", auth, function(req, res){
	var prom = req.body.promotion;
	Promotion.findById(prom._id).then(function(prom){
		prom.client = req.body.promotion.entreprise;
		prom.reduction = {montant:parseFloat(req.body.promotion.reduction.montant), 
				percent:parseFloat(req.body.promotion.reduction.percent)};
		prom.valide = req.body.valide;
		prom.save(function(err){
			if(err) return res.status(500).send(err);
			return res.json(prom);
		});
	}, function(err){return res.status(500).send(err);});
});



router.delete("/", auth, function(req, res){
	var promId = req.query.promId;
	Promotion.findById(promId).then(function(prom){
		prom.remove().then(function(){
			res.json({error:false});
		}, function(err){
			res.status(500).send(err);
		});
	}, function(err){
		res.status(500).send(err);
	});
});


module.exports = router;