
var express = require('express');
var router = express.Router();
var auth = require("./lib/auth.js");


router.use("/client", require("./api/client"));
router.use("/commande", require("./api/commande"));
router.use("/paiement", require("./api/paiement"));
router.use("/promotion", require("./api/promotion"));


module.exports = router;