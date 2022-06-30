const ethers = require('ethers')
const mongoose = require('mongoose');

const IpfsController = require('../controllers/IpfsController');

const Dao = require('../models/Dao');

exports.update = (data) => {
    const dao = {
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

    Dao.findOneAndUpdate(
        {
            chainId: data.chainId,
            id: data.id,
        },
        dao,
        {upsert: true, new: true}
    )
    .then(data => {
        console.log("DAO created.");
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