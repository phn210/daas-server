const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FollowingSchema = new Schema({
    _id: {type: String},
    daoId: {type: String},
    chainId: {type: String},
    index: {type: Number},
    address: {type: String}
}, {timestamps: true})

module.exports = mongoose.model('Following', FollowingSchema);
