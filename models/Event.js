const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    name: {type: String},
    chainId: {type: String},
    blockNumber: {type: Number},
    transactionHash: {type: String}
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Event', EventSchema);
