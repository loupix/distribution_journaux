'use strict';

module.exports = {
  seed: false,
  mongo: {
    uri: 'mongodb://localhost/distralsa-dev'
  },
  website:"https://app.distral.lu",
  email:"loic5488@gmail.com",
  rib:{
    adresse:"test",
    name:"test",
    iban:"DE23100000001234567890",
  	bic:"MARKDEF1100"
  },
  mangopay:{
  	clientId:"bluescreenprod",
  	clientPassword:"2O7bf9msFZQEBZ6t0WR6wqNsHPe1ShiYjVQFrf0rUN0AurkEZn",
    baseUrl:"https://api.mangopay.com",
  	fees:1.5
  },
  port:8084
};
