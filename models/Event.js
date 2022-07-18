const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    _id: {type: String},
    chainId: {type: String},
    address: {type: String},
    contract: {type: String},
    name: {type: String},
    blockNumber: {type: Number},
    blockHash: {type: String},
    blockTimestamp: {type: Number},
    transactionHash: {type: String},
    logIndex: {type: Number}

}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Event', EventSchema);
