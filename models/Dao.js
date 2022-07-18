const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DaoSchema = new Schema({
    _id: {type: String},
    chainId: {type: String},
    index: {type: Number},
    infoHash: {type: String},
    proxyAdmin: {type: String},
    governor: {type: String},
    isRetired: {type: Boolean},
    isBlacklisted: {type: Boolean},
    name: {type: String},
    shortDescription: {type: String},
    logoUrl: {type: String}
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Dao', DaoSchema);
