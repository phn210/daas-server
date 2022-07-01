const ethers = require('ethers')
const mongoose = require('mongoose');

const IpfsController = require('../controllers/IpfsController');

const Dao = require('../models/Dao');

const utils = require('../utils')

exports.update = (data) => {
    const dao = {
        _id: ethers.utils.hexConcat([utils.toHex(data.chainId, 10), utils.toHex(Number(data.id), 10)]),
        chainId: data.chainId,
        id: data.id,
        infoHash: data.infoHash,
        proxyAdmin: data.proxyAdmin,
        governor: data.governor,
        isRetired: data.isRetired,
        isBlacklisted: data.isBlacklisted,
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        logoUrl: data.logoUrl,
        websiteUrl: data.websiteUrl
    }

    Dao.findByIdAndUpdate(
        dao._id,
        dao,
        {upsert: true, new: true}
    )
    .then(data => {
        console.log(`DAO updated ${dao._id}`);
        return data;
    })
    .catch(err => {
        console.error(err);
        return err;
    })
}

exports.findAll = (req, res) => {
    Dao.find({})
    .then(data => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.findOne = (req, res) => {
    if (req.params.daoId < 0) return false;
    Dao.findOne({id: req.params.daoId})
    .then(data => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.findMany = (req, res) => {
    const query = Object.keys(req.params).reduce(
        (o, e) => Object.assign(o, {[e]: req.params[e]}),
        {}
    )
    Dao.find(query)
    .then(data => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.findAllInfo = (req, res) => {

}