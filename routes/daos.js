const express = require('express');
const router = express.Router();

const DaoController = require('../controllers/DaoController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is OK!'});
})

router.get('/', DaoController.findAll);
router.get('/:daoId', DaoController.findOne);

module.exports = router;