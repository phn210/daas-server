const ethers = require('ethers');

const DaoController = require('./DaoController');

const Proposal = require('../models/Proposal');

const { CONSTANTS } = require('../config');
const utils = require('../utils');

exports.resolveProposalId = (proposalId) => {
    const obj = {};
    let i = 0;
    try {
        if (proposalId.length != CONSTANTS.PADDING.CHAINID*2 + CONSTANTS.PADDING.ADDRESS*2 + CONSTANTS.PADDING.PROPOSALID*2+2)
            throw {message: 'Invalid proposalId length'};
        obj.chainId = Number(ethers.utils.hexDataSlice(proposalId, i, i+= CONSTANTS.PADDING.CHAINID));
        obj.governor = ethers.utils.hexDataSlice(proposalId, i, i+= CONSTANTS.PADDING.ADDRESS);
        obj.id = ethers.utils.hexDataSlice(proposalId, i, i+= CONSTANTS.PADDING.PROPOSALID);    
    } catch (err) {
        console.error(err);
        throw err;
    }
    return obj;
}

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

exports.findOne = async (req, res) => {
    try {
        exports.resolveProposalId(req.params.proposalId);
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
        return 0;
    }

    Proposal.findById(req.params.proposalId)
    .then(data => {
        res.status(200).send({'data': data})
    })
    .catch(err => {
        res.status(500).send({
            message: err.message
        });
        return 0;
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
        res.status(200).send({'data': data})
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
        return 0;
    })
}