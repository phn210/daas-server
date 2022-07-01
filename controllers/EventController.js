const ethers = require('ethers');

const config = require('../config');

const IpfsController = require('./IpfsController');
const DaoController = require('./DaoController');
const ProposalController = require('./ProposalController');

const Event = require('../models/Event');
const EventRegistry = require('../models/EventRegistry');

const utils = require('../utils');
const ipfsUtils = require('../utils/ipfs');
const { mongo, default: mongoose } = require('mongoose');

var providers = []
var contracts = []
var specialEventListeners = {
    'DAOCreated': daoCreatedListener,
    'DAOUpdated': daoUpdatedListener,
    'AdminChanged': adminChangedListener,
    'NewTimelockSet': newTimelockListener,
    'ProposalCreated': proposalCreatedListener,
    'ProposalQueued': proposalUpdatedListener,
    'ProposalExecuted': proposalUpdatedListener,
    'ProposalCancelled': proposalUpdatedListener
}

function getChainInfo(chainId) {
    return config.chains.filter(e => e["chainId"] == chainId)[0]
}

async function createEventListener(eventRegistry) {
    try {
        let contract = new ethers.Contract(
            eventRegistry.address,
            config[eventRegistry.chainId][String(eventRegistry.contract).toLowerCase()].interface,
            providers[eventRegistry.chainId]
        )
        let filter = contract.filters[eventRegistry.name]();
        let listener = specialEventListeners[eventRegistry.name] ?? eventListener
        contract.provider.on(filter, async (event) => {
            const save_event = {}
            Object.assign(save_event, event)
            save_event.chainId = eventRegistry.chainId;
            save_event.contract = eventRegistry.contract;
            save_event.blockTimestamp = (await providers[save_event.chainId].getBlock(save_event.blockNumber)).timestamp;
            const logData = await logEvent(save_event);
            Object.assign(save_event, logData == false ? {} : logData);
            delete save_event.data;
            delete save_event.topics;
            listener(save_event)
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

const init = () => {
    config.allowedChains.map(e => {
        chainInfo = getChainInfo(e);
        providers[e] = new ethers.providers[chainInfo.rpc[0].startsWith('ws') ? 'WebSocketProvider' : 'JsonRpcProvider'](chainInfo.rpc[0]);
        contracts[e] = [];
        Object.keys(config[e]).filter(elm => elm != "").map(elm => contracts[e][elm] = new ethers.Contract(config[e][elm].address, config[e][elm].interface, providers[e]));

        registry({
            contract: 'DAOFactory',
            address: config[e]['daofactory'].address,
            name: 'DAOCreated',
            chainId: e
        })
    })
}

function eventListener(event) {
    createEvent(event);
}

async function daoCreatedListener(event) {
    const dao = {
        chainId: event.chainId,
        id: event.id,
        infoHash: event.dao_infoHash,
        proxyAdmin: event.dao_proxyAdmin,
        governor: event.dao_governor,
        isRetired: event.dao_isRetired,
        isBlacklisted: event.dao_isBlacklisted
    }
    const daoInfo = {}
    try {
        Object.assign(daoInfo, (await IpfsController.getFile(ipfsUtils.getIpfsHash(dao.infoHash))).data)
        Object.assign(daoInfo, dao)
    } catch (err) {
        console.error(err)
    }

    DaoController.update(daoInfo)
    Object.keys(contracts[dao.chainId]['governor'].interface.events)
    .filter(e => ![
        // "VoteCast(address,uint256,uint8,uint256,string)", 
        "Initialized(uint8)"
    ].includes(e))
    .map(e => {
        registry({
            contract: 'Governor',
            address: dao.governor,
            name: contracts[event.chainId]['governor'].interface.events[e]?.name,
            chainId: event.chainId
        })
    })

    const governor = new ethers.Contract(
        dao.governor,
        config[dao.chainId]['governor'].interface,
        providers[dao.chainId]
    )
    const timelock = await governor.timelock()

    Object.keys(contracts[event.chainId]['timelock'].interface.events)
    .filter(e => ![
        // "TransactionExecuted(bytes32,address,uint256,string,bytes,uint256)", 
        // "TransactionQueued(bytes32,address,uint256,string,bytes,uint256)", 
        // "TransactionCancelled(bytes32,address,uint256,string,bytes,uint256)", 
        "Initialized(uint8)"
    ].includes(e))
    .map(e => {
        registry({
            contract: 'Timelock',
            address: timelock,
            name: contracts[event.chainId]['timelock'].interface.events[e]?.name,
            chainId: event.chainId
        })
    })

    await eventListener(event);
}

async function daoUpdatedListener(event) {

    await eventListener(event);
}

async function adminChangedListener(event) {

    await eventListener(event);
}

async function newTimelockListener(event) {

    await eventListener(event);
}

async function proposalCreatedListener(event) {
    const proposal = {
        chainId: event.chainId,
        governor: event.address,
        id: event.proposalId,
        index: event.index,
        proposer: event.proposer,
        startBlock: event.startBlock,
        endBlock: event.endBlock,
        descriptionHash: event.descriptionHash,
        states: [
            {
                name: 'Created',
                ts: event.blockTimestamp
            }
        ]
    }

    const proposalInfo = {}
    try {
        Object.assign(proposalInfo, (await IpfsController.getFile(ipfsUtils.getIpfsHash(proposal.descriptionHash))).data);
        Object.assign(proposalInfo, proposal)
    } catch (err) {
        console.error(err)
    }
    console.log(proposalInfo)
    ProposalController.update(proposalInfo)

    await eventListener(event);
}

async function proposalUpdatedListener(event) {

    await eventListener(event);
}

const getInfo = (obj, key, value) => {
    if (Array.isArray(value)) {
        let keys = Object.keys(value)
        let stringKey = keys.filter(k => k.match(/[a-zA-Z]/) != null).length > 0
        let values = Object.values(value)
        let indexes = stringKey ? [...Array(keys.length).keys()].splice(keys.length/2) : [...Array(keys.length).keys()];

        indexes = indexes.map(e => {
            return getInfo(obj, key === '' ? keys[e] : key+'_'+keys[e], values[e])
        })

    } else {
        obj[key] = value.toString();
    }
}

const logEvent = async (event) => {
    try {
        save_event = {};
        event = new ethers.utils.Interface(config[event["chainId"]][String(event["contract"]).toLowerCase()].interface).parseLog(event);
        save_event["name"] = event["name"]
        getInfo(save_event, '', event.args)
        return save_event;
    } catch (err) {
        console.error(err);
        return false;
    }
}

const registry = (data) => {
    let eventRegistry = {
        contract: data.contract,
        address: data.address,
        name: data.name,
        chainId: data.chainId
    }

    EventRegistry.updateOne(
        eventRegistry,
        eventRegistry,
        {upsert: true, new: true}
    )
    .then(data => {
        if (createEventListener(eventRegistry)) return true;
        else return false;
    }).catch(err => {
        console.error(err)
        return false;
    })
}

const createEvent = (data) => {
    data._id = ethers.utils.hexConcat([
        utils.toHex(data.chainId, 10),
        data.address,
        utils.toHex(data.logIndex, 4),
        data.transactionHash
    ])
    Event.findByIdAndUpdate(
        data._id,
        data,
        {upsert: true, new: true}
    )
    .then(data => {
        // console.log(`Event created ${data._id}`);
        return true;
    }).catch(err => {

        console.error(err)
        return false;
    })
};

exports.registry = (req, res) => {
    registry({
        contract: req.body.contract,
        address: req.body.address,
        name: req.body.name,
        chainId: req.body.chainId
    })
    .then(res => {
        res.status(200).send(data)
    })
    .catch(err => {
        res.status(500).send({
            message:
            err.message
        });
    })
}

exports.findByDao = (req, res) => {
    const query = {
        chainId: req.query.chainId,
        address: { $in: req.query.addresses},
        name: { $nin: ["VoteCast", "TransactionQueued", "TransactionExecuted", "TransactionCancelled"]}
    }
    Event.find(query).sort()
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

init()