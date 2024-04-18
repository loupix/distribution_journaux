'use strict';

module.exports = {
  seed: false,
  mongo: {
    uri: 'mongodb://localhost',
    name:'distralsa-dev'
  },
  website:"http://127.0.0.1:8086",
  email:"Email",
  rib:{
    adresse:"test",
    name:"test",
    iban:"Iban",
  	bic:"Bic"
  },
  mangopay:{
  	clientId:"ClientId",
  	clientPassword:"ClientPassword",
    baseUrl:"https://api.sandbox.mangopay.com",
  	fees:1.5
  },
  port:8086
};
