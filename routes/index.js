const express = require("express");
const router = express.Router();

router.use('/daos/', require("./daos"));
router.use('/events/', require('./events'));
router.use('/proposals/', require('./proposals'));
router.use('/ipfs/', require('./ipfs'));

module.exports = router;