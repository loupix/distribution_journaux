'use strict';

var express = require('express');
var router = express.Router();
var auth = require("./lib/authAdmin.js"),
	config = require('../config/environment');


// Anti Brute Force !!
var ExpressBrute = require('express-brute'),
	MongoStore = require('express-brute-mongo'),
	MongoClient = require('mongodb').MongoClient;

var path = require("path"),
    fs = require("fs");

var store = new MongoStore(function (ready) {
	MongoClient.connect(config.mongo.uri, function(err, db) {
		if (err) throw err;
		db = db.db(config.mongo.name)
		ready(db.collection('bruteforce-store'));
	});
});

var bruteforce = new ExpressBrute(store, {
	freeRetries:10,
	failCallback:function(req, res, next, nextValidRequestDate){
		req.toastr.error("Trop d'essaie effectuer");
		var now = new Date();
		var delta_time = new Date(now - nextValidRequestDate);
		req.toastr.error("Prochaine tentative : "+delta_time.toTimeString());
		res.redirect("/admin");
	}
});


var Client = require(path.join(config.root, "schema","client")),
	Paiement = require(path.join(config.root, "schema","paiement")),
	Commande = require(path.join(config.root, "schema","commande"));


/* GET home page. */
router.get('/', function(req, res) {
	// if(req.session.isAuthenticated !== undefined && req.session.isAuthenticated == true)
	// 	res.redirect("/admin/index")
	res.render('admin/accueil', {req:req, title: 'Admin accueil' });
});

router.post('/', bruteforce.prevent, function(req, res) {
	res.redirect("/admin/index");
});


router.get('/index', auth, function(req, res) {
	res.render('admin/index', {req:req, title: 'Admin catégorie' });
});



router.use(function(err, req, res, next){
	if(err){
		console.error(err.stack);
		if(req.toastr !== undefined)
			req.toastr.error(err.message);
		// res.status(500).send(err.message);
		res.redirect("/admin");
	}else{
		return next();
	};
})


module.exports = router;