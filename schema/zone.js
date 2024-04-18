'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config/environment'),
	path = require("path"),
    fs = require("fs");

var ZoneSchema = new Schema({
	Ville: {type:String, default:''},
	region: {type:String, default:''},	
	brut: {type:Number, default:0},
	net: {type:Number, default:0},

	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now}
	
});


ZoneSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});


module.exports = mongoose.model('Zone', ZoneSchema);
