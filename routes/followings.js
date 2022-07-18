const express = require('express');
const router = express.Router();

const FollowingController = require('../controllers/FollowingController');

router.get('/test', (req, res) => {
    res.json({message: 'Test is OK!'});
})

router.get('/:address', FollowingController.findByAddress);
router.post('/', FollowingController.create);
router.delete('/', FollowingController.delete);
router.get('/', FollowingController.nonce);

module.exports = router;