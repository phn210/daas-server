const ethers = require('ethers');

const config = require('../config');

const IpfsController = require('./IpfsController');
const DaoController = require('./DaoController');
const ProposalController = require('./ProposalController');

const Event = require('../models/Event');
const EventRegistry = require('../models/EventRegistry');

const ipfsUtils = require('../utils/ipfs');

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

function createEventListener(eventRegistry) {
    let contract = new ethers.Contract(
        eventRegistry.address,
        config[eventRegistry.chainId][String(eventRegistry.contract).toLowerCase()].interface,
        providers[eventRegistry.chainId]
    )
    let filter = contract.filters[eventRegistry.name]();
    let listener = specialEventListeners[eventRegistry.name] ?? eventListener
    contract.provider.on(filter, async (event) => {
        event["chainId"] = eventRegistry.chainId;
        event["contract"] = eventRegistry.contract;
        event = await logEvent(event);
        listener(event)
    });
}

const init = () => {
    config.allowedChains.map(e => {
        chainInfo = getChainInfo(e);
        providers[e] = new ethers.providers[chainInfo.rpc[0].startsWith('ws') ? 'WebSocketProvider' : 'JsonRpcProvider'](chainInfo.rpc[0]);
        contracts[e] = [];
        Object.keys(config[e]).filter(elm => elm != "").map(elm => contracts[e][elm] = new ethers.Contract(config[e][elm].address, config[e][elm].interface, providers[e]));

        exports.registry({
            contract: 'DAOFactory',
            address: config[e]['daofactory'].address,
            name: 'DAOCreated',
            chainId: e
        })
    })
}

function eventListener(event) {
    exports.create(event);
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

    const daoInfo = (await IpfsController.getFile(ipfsUtils.getIpfsHash(dao.infoHash))).data
    try {
        Object.assign(daoInfo, dao)
    } catch (err) {
        console.error(err)
    }
    DaoController.update(daoInfo)

    Object.keys(contracts[event.chainId]['governor'].interface.events)
    .filter(e => ![
        // "VoteCast(address,uint256,uint8,uint256,string)", 
        "Initialized(uint8)"
    ].includes(e))
    .map(e => {
        exports.registry({
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

    console.log(Object.keys(contracts[event.chainId]['timelock'].interface.events));
    Object.keys(contracts[event.chainId]['timelock'].interface.events)
    .filter(e => ![
        // "TransactionExecuted(bytes32,address,uint256,string,bytes,uint256)", 
        // "TransactionQueued(bytes32,address,uint256,string,bytes,uint256)", 
        // "TransactionCancelled(bytes32,address,uint256,string,bytes,uint256)", 
        "Initialized(uint8)"
    ].includes(e))
    .map(e => {
        exports.registry({
            contract: 'Timelock',
            address: timelock,
            name: contracts[event.chainId]['timelock'].interface.events[e]?.name,
            chainId: event.chainId
        })
    })

    eventListener(event)
}

function daoUpdatedListener() {

}

function adminChangedListener() {

}

function newTimelockListener() {

}

async function proposalCreatedListener(event) {
    const proposal = {
        chainId: event.chainId,
        id: event.proposalId,
        index: event.index,
        descriptionHash: event.descriptionHash,
        proposer: event.proposer
    }

    const proposalInfo = (await IpfsController.getFile(ipfsUtils.getIpfsHash(proposal.descriptionHash))).data
    try {
        Object.assign(proposalInfo, proposal)
    } catch (err) {
        console.error(err)
    }
    ProposalController.update(proposalInfo)

    eventListener(event)
}

function proposalUpdatedListener() {

}

const getInfo = (obj, key, value) => {
    if (Array.isArray(value)) {
        keys = Object.keys(value)
        values = Object.values(value)
        indexes = [...Array(keys.length).keys()].splice(keys.length/2);
        indexes.map(e => getInfo(obj, key == '' ? keys[e] : key+'_'+keys[e], values[e]))
    } else {
        obj[key] = value.toString();
    }
}

const logEvent = async (event) => {
    save_event = {};
    save_event["blockNumber"] = event["blockNumber"]
    save_event["blockTimestamp"] = (await providers[event["chainId"]].getBlock(event["blockNumber"])).timestamp
    save_event["transactionHash"] = event["transactionHash"]
    save_event["chainId"] = event["chainId"]
    save_event["address"] = event["address"]
    event = new ethers.utils.Interface(config[event["chainId"]][String(event["contract"]).toLowerCase()].interface).parseLog(event);
    save_event["name"] = event["name"]
    getInfo(save_event, '', event.args)
    return save_event;
}

exports.registry = (data) => {
    let eventRegistry = {
        contract: data.contract,
        address: data.address,
        name: data.name,
        chainId: data.chainId
    }

    EventRegistry.findOneAndUpdate(
        eventRegistry,
        eventRegistry,
        {upsert: true, new: true}
    )
    .then(data => {
        // res.status(200).send(data)
        console.log('Event registried.')
        createEventListener(eventRegistry);
        return true;
    }).catch(err => {
        // res.status(500).send({
        //     message:
        //     err.message || "Some error occurred while creating the Event."
        // });
        console.error(err)
        return false;
    })
}

exports.create = (data) => {
    // console.log(eventData);
    // const event = new Event(eventData)
    Event.findOneAndUpdate(
        {
            transactionHash: data['transactionHash'],
            name: data['name']
        },
        data,
        {upsert: true, new: true}
    )
    .then(data => {
        // res.status(200).send(data)
        console.log('Event created.');
        return true;
    }).catch(err => {
        // res.status(500).send({
        //     message:
        //     err.message || "Some error occurred while creating the Event."
        // });
        console.error(err)
        return false;
    })
};
  
exports.findOne = (query) => {
    Event.findOne(query)
    .then(event => { return event; } )
    .catch(err => {
        console.err(err);
        return false;
    })
};

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