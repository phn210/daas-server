const ethers = require('ethers');

const Proposal = require('../models/Proposal');

const utils = require('../utils');

exports.update = (data) => {
    // console.log(data);
    const proposal = {
        _id: ethers.utils.hexConcat([
            utils.toHex(data.chainId, 10),
            data.governor,
            utils.toHex(ethers.BigNumber.from(data.id)),
        ]),
        chainId: data.chainId,
        governor: data.governor,
        id: data.id,
        index: data.index,
        proposer: data.proposer,
        startBlock: data.startBlock,
        endBlock: data.endBlock,
        descriptionHash: data.descriptionHash,
        states: data.states,
        title: data.title
    }

    Proposal.findByIdAndUpdate(
        proposal._id,
        proposal,
        {update: true, new: true}
    )
    .then(data => {
        console.log("Proposal updated!");
        return data;
    })
    .catch(err => {
        console.error(err);
        return false;
    })
}

exports.findByDao = (req, res) => {

}