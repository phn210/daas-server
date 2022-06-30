const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventRegistrySchema = new Schema({
    chainId: {type: String},
    contract: {type: String},
    address: {type: String},
    name: {type: String}
}, {strict: false, timestamps: true})

module.exports = mongoose.model('EventRegistry', EventRegistrySchema);
