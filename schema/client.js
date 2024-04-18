'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs");

var Place = require("./place");

var ClientSchema = new Schema({
	lang: {type:String, default:'fr'},

	entreprise: {type:String, default:''},

	adresse: {type:String, default:''},
	ville: {type:String, default:''},
	pays: {type:String, default:''},

	activite: {type:String, default:''},
	email: {type:String, default:''},
	telephone: {type:String, default:''},
	numTva: {type:String, default:0},
	numTvaIntra: {type:String, default:0},

	mangoPay:{
		userId:{type:Number, default:0},
		walletId:{type:Number, default:0},
		cardRegistrationId:{type:Number, default:0},
	},
	
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now}
	
});


ClientSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});



ClientSchema.methods.getAdresse = function(){
	var obj = this;
	return new Promise(function(resolve, reject){
		Place.findById(obj.adresse).then(function(place){
			obj.adresse = place;
			resolve(place);
		}, function(err){
			reject(err);
		})
	});
};

module.exports = mongoose.model('Client', ClientSchema);
