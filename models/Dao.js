const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DaoSchema = new Schema({
    chainId: {type: String},
    id: {type: Number},
    infoHash: {type: String},
    proxyAdmin: {type: String},
    governor: {type: String},
    isRetired: {type: Boolean},
    isBlacklisted: {type: Boolean},
    name: {type: String},
    shortDescription: {type: String},
    description: {type: String},
    logoUrl: {type: String},
    websiteUrl: {type: String}
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Dao', DaoSchema);
