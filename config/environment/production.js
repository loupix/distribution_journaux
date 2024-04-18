'use strict';

module.exports = {
  ip: process.env.IP || undefined,
  mongo: {
    uri: 'mongodb://localhost',
    name:'distralsa-prod'
  },
  website:"Website",
  email:"Email",
  rib:{
    adresse:"ZARE Ouest îlot 16 L - 4384 Ehlerange  ",
    name:"Distral S.A",
  	iban:"Iban",
  	bic:"Bic"
  },
  mangopay:{
    clientId:"ClientId",
    clientPassword:"ClientPassword",
    baseUrl:"https://api.mangopay.com",
    fees:1.5
  },
  port:8091,
  seed: false
};
