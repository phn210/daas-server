const express = require('express');
const router = express.Router();

const EventController = require('../controllers/EventController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is ok'});
})

router.get('/daos/', EventController.findByDao);

router.post('/', EventController.registry);

module.exports = router;