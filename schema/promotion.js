'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs");


var Zone = require("./zone"),
	Client = require("./client");

var promoSchema = new Schema({
	client:{type: Schema.Types.ObjectId, ref: 'Client'},
	reduction:{
		montant:{Type:Number, default:0},
		percent:{Type:Number, default:0},
	},
	valide: {type: Boolean, default: true},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now}
});


promoSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});


promoSchema.methods.getClient = function(){
	var obj = this;
	return new Promise(function(resolve, reject){
		Client.findById(obj.client).then(function(client){
			obj.client = client;
			resolve(obj);
		}, function(err){reject(err);})
	});
};



promoSchema.statics.findByName = function(nomEntreprise){
	var obj = this;
	return new Promise(function(resolve, reject){
		Client.findOne({entreprise:nomEntreprise}).then(function(client){
			obj.findOne({client:client._id}).then(function(promo){
				resolve(promo);
			}, function(err){reject(err);})
		}, function(err){reject(err);})
	});
}



promoSchema.statics.findByClient = function(client){
	var obj = this;
	return new Promise(function(resolve, reject){
		obj.findOne({client:client}).then(function(promo){
			resolve(promo);
		}, function(err){reject(err);})
	});
}

module.exports = mongoose.model('Promotion', promoSchema);

