const express = require('express');
const router = express.Router();

const ProposalController = require('../controllers/ProposalController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is OK!'});
})

router.get('/:daoId', ProposalController.findByDAO);

module.exports = router;