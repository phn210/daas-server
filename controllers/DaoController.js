const ethers = require('ethers')
const mongoose = require('mongoose');

const IpfsController = require('../controllers/IpfsController');
const ContractController = require('../controllers/ContractController');

const Dao = require('../models/Dao');
const Proposal = require('../models/Proposal');

const { CONSTANTS } = require('../config');
const utils = require('../utils');

exports.resolveDaoId = (daoId) => {
    let obj = {};
    let i = 0;
    try {
        if (daoId.length != CONSTANTS.PADDING.CHAINID*2 + CONSTANTS.PADDING.DAOINDEX*2 + 2)
            throw {message: "Invalid daoId's length"};
        obj.chainId = Number(ethers.utils.hexDataSlice(daoId, i, i+= CONSTANTS.PADDING.CHAINID));
        obj.index = Number(ethers.utils.hexDataSlice(daoId, i, i+= CONSTANTS.PADDING.DAOINDEX));    
    } catch (err) {
        console.error(err);
        throw err;
    }
    return obj;
}

exports.update = (data) => {
    const dao = {
        _id: ethers.utils.hexConcat([
            utils.toHex(Number(data.chainId), CONSTANTS.PADDING.CHAINID),
            utils.toHex(Number(data.id), CONSTANTS.PADDING.DAOINDEX)
        ]),
        chainId: data.chainId,
        index: data.id,
        infoHash: data.infoHash,
        proxyAdmin: data.proxyAdmin,
        governor: data.governor,
        isRetired: data.isRetired,
        isBlacklisted: data.isBlacklisted,
        name: data.name,
        shortDescription: data.shortDescription,
        logoUrl: data.logoUrl
    }

    Dao.findByIdAndUpdate(
        dao._id,
        dao,
        {upsert: true, new: true}
    )
    .then(data => {
        console.log(data)
        console.log(`DAO updated ${dao._id}`);
        return data;
    })
    .catch(err => {
        throw err;
    })
}

exports.findAll = (req, res) => {
    Dao.find({})
    .then(data => {
        res.status(200).send({'data': data})
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.findOne = (req, res) => {
    try {
        exports.resolveDaoId(req.params.daoId);
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
        return 0;
    }

    Dao.findById(req.params.daoId)
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

exports.findContractsByDAO = (req, res) => {
    exports.getContracts(req.params.daoId)
    .then(data => {
        res.status(200).send({'data': data})
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.getContracts = async (daoId) => {
    try {
        daoId = exports.resolveDaoId(daoId);
        return await ContractController.getContracts(daoId);
    } catch(err) {
        console.error(err)
        throw(err);
    }
}