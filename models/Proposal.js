const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
    _id: {type: String},
    chainId: {type: String},
    governor: {type: String},
    id: {type: String},
    index: {type: Number},
    proposer: {type: String},
    startBlock: {type: Number},
    endBlock: {type: Number},
    descriptionHash: {type: String},
    states: [
        {
            name: {type: String},
            ts: {type: Number}
        }
    ],
    title: {type: String}
}, {
    strict: false,
    timestamps: true
})

module.exports = mongoose.model('Proposal', ProposalSchema);