var express = require('express');
var router = express.Router();
var config = require('../config/environment'),
	auth = require("./lib/auth.js"),
	pdf = require('./lib/createPdf.js');
/* GET home page. */



var Promise = require("bluebird");
var path = require("path"),
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



router.get('/', auth, function(req, res) {
	// req.session.destroy();
  res.render('index', { req:req, title: 'Distral S.A - Accueil' });
});



router.get('/accueil', auth, function(req, res) {
	if (!req.xhr || req.headers.accept.indexOf('json') < -1)
		res.redirect("/");
	res.render('accueil', { req:req, title: 'Distral S.A - Accueil' });
});


router.get('/commande', function(req, res) {
	if (!req.xhr || req.headers.accept.indexOf('json') < -1)
		res.redirect("/");
	res.render('commande', { req:req, title: 'Distral S.A - Commander' });
});


router.get('/paiement', function(req, res) {
	if (!req.xhr || req.headers.accept.indexOf('json') < -1)
		res.redirect("/");

	if(req.session.client == undefined || req.session.client == null)
		res.redirect("/accueil");

	if(req.session.commande == undefined || req.session.commande == null)
		res.redirect("/commande");

	Paiement.create({client:req.session.client, commande:req.session.commande}, function(err, paiement){
		if(err) res.status(500).send(err)

		Promise.all([
			paiement.getWalletClient(),
			paiement.getWalletDistral()
		]).then(function(data){
			var client = data[0], entreprise = data[1];
			req.session.paiement = {client:client, entreprise:entreprise};
			req.session.save(function(err){
				if(err) res.status(500).send(err);
				else res.render('paiement', { req:req, title: 'Distral S.A - Valider', client:client, entreprise:entreprise, config:config });
			});
			
		}, function(err){
			console.warn(err);
			res.status(500).send(err);
		});
	});

});




router.get('/validation', function(req, res) {
	if (!req.xhr || req.headers.accept.indexOf('json') < -1)
		res.redirect("/");
	res.render('validation', { req:req, title: 'Distral S.A - Terminer' });
});


router.get('/cgvpaiement', function(req, res) {
	var filename = "CGU_MANGOPAY_France.pdf"; 
	filename = encodeURIComponent(filename);

	fs.readFile(config.root+'/CGU_MANGOPAY_France.pdf', function (err,data){

		res.setHeader('Content-disposition', 'inline; filename="' + filename + '"');
		res.setHeader('Content-type', 'application/pdf');
		res.send(data);
	});

});



router.get('/carte', function(req, res) {
	var commande = req.session.commande;
	Commande.findOne({_id:commande._id}, function(err, cmd){
		if(err)	res.status(500).send(err);

		cmd.getZones().then(function(cmd){

			// Creer un .PDF

			res.setHeader('Content-type', 'application/pdf');
			var newPdf = pdf.create(cmd.zones);
			newPdf.pipe(res);
			newPdf.end();


		}, function(err){
			res.status(504).send(err)
		});
	});
});


router.use("/reglement", require("./reglement"));
router.use("/admin", require("./admin"));


module.exports = router;
