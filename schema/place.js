'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs");

var PlaceSchema = new Schema({
	adresse: {type:String, required: true},
	ville: {type:String, required: true},
	pays: {type:String, required: true},
	codePostal: {type:Number, required: true},
	latitude: {type:Schema.Types.Number, required: true},
	longitude: {type:Schema.Types.Number, required: true},
	googleId: {type:String},
	createdAt: {type: Date},
	updatedAt: {type: Date}
});

PlaceSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

module.exports = mongoose.model('Place', PlaceSchema);