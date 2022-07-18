const express = require('express')
const router = express.Router();

const IpfsController = require('../controllers/IpfsController');

router.get('/:hash', IpfsController.get);
// router.post('/upload', IpfsController.upload);

module.exports = router;
