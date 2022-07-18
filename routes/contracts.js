const express = require('express');
const router = express.Router();

const DaoController = require('../controllers/DaoController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is OK!'});
})

router.get('/:daoId', DaoController.findContractsByDAO);

module.exports = router;