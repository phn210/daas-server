const express = require('express');
const router = express.Router();

const EventController = require('../controllers/EventController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is ok'});
})

router.get('/numberOfListners', EventController.testListeners);
router.get('/:daoId', EventController.findByDao);
router.get('/details/:eventId', EventController.findOne);
router.post('/', EventController.registry);

module.exports = router;