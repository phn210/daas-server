const ethers = require('ethers');

const DaoController = require('./DaoController');

const Proposal = require('../models/Proposal');

const { CONSTANTS } = require('../config');
const utils = require('../utils');

exports.update = (data) => {
    const proposal = {};
    try {
        Object.assign(proposal, {
            _id: ethers.utils.hexConcat([
                utils.toHex(Number(data.chainId), CONSTANTS.PADDING.CHAINID),
                utils.toHex(data.governor, CONSTANTS.PADDING.ADDRESS),
                utils.toHex(ethers.BigNumber.from(data.id), CONSTANTS.PADDING.PROPOSALID),
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
        })
    } catch (err) {
        throw err;
    }

    Proposal.findByIdAndUpdate(
        proposal._id,
        proposal,
        {upsert: true, new: true}
    )
    .then(data => {
        console.log(`Proposal updated ${data._id}!`);
        return data;
    })
    .catch(err => {
        throw err;
    })
}

exports.findByDAO = async (req, res) => {
    const dao = {}, query = {};

    try {
        Object.assign(dao, DaoController.resolveDaoId(req.params.daoId));
        dao.contracts = await DaoController.getContracts(req.params.daoId);
        
        Object.assign(query, {
            chainId: dao.chainId,
            governor: dao.contracts.governor
        })
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
        return 0;
    }
    
    Proposal.find(query).sort()
    .then(data => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
        return 0;
    })
}