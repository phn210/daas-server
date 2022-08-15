const ethers = require('ethers');

const { CONSTANTS } = require('../config');

const IpfsController = require('./IpfsController');
const DaoController = require('./DaoController');
const ProposalController = require('./ProposalController');
const ContractController = require('./ContractController');

const Event = require('../models/Event');
const EventRegistry = require('../models/EventRegistry');

const utils = require('../utils');
const ipfsUtils = require('../utils/ipfs');

const specialEventListeners = {
    'DAOCreated': daoCreatedListener,
    'DAOUpdated': daoUpdatedListener,
    'AdminChanged': adminChangedListener,
    'NewTimelockSet': newTimelockListener,
    'ProposalCreated': proposalCreatedListener,
    'ProposalQueued': proposalUpdatedListener,
    'ProposalExecuted': proposalUpdatedListener,
    'ProposalCancelled': proposalUpdatedListener
}

// exports.testEventListening = () => {
//     ContractController.providers[31337].map(provider => {
//         console.log('test', provider.listenerCount('DAOCreated'))
//     });
// }

exports.testListeners = (req, res) => {
    const contract = ContractController.contracts[97]["governor"].attach("0x2Ef6DbFD41CD78C796B782a830BCB4c8A90bbC2A");
    const filter = contract.filters["ProposalCreated"]();
    const data = ContractController.providers[97].map(provider => {return provider.listenerCount(filter)})
    res.status(200).send({'data': data})
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
        event = ContractController.contracts[event.chainId][String(event.contract).toLowerCase()].interface.parseLog(event);
        save_event.name = event.name
        getInfo(save_event, '', event.args)
        return save_event;
    } catch (err) {
        console.error(err);
        return false;
    }
}

const createEventListener = async (eventRegistry) => {
    try {
        let contract = ContractController.contracts[eventRegistry.chainId][eventRegistry.contract.toLowerCase()].attach(eventRegistry.address);
        let filter = contract.filters[eventRegistry.name]();
        let listener = specialEventListeners[eventRegistry.name] ?? (() => {return;});

        ContractController.providers[eventRegistry.chainId].map(provider => {
            provider.on(filter, async (event) => {
                const save_event = {};
                Object.assign(save_event, event);
                save_event.chainId = eventRegistry.chainId;
                save_event.contract = eventRegistry.contract;
                save_event.blockTimestamp = (await ContractController.providers[eventRegistry.chainId][0].getBlock(save_event.blockNumber)).timestamp;
                const logData = await logEvent(save_event);
                Object.assign(save_event, logData == false ? {} : logData);
                delete save_event.data;
                delete save_event.topics;
                delete save_event.removed;
                return await Promise.all([listener(save_event), eventListener(save_event)]);
            });
            return ;
        });
    } catch (err) {
        throw err;
    }
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

        DaoController.update(daoInfo)
        Object.keys(ContractController.contracts[dao.chainId].governor.interface.events)
        .filter(e => ![
            // "VoteCast(address,uint256,uint8,uint256,string)", 
            "Initialized(uint8)"
        ].includes(e))
        .map(e => {
            exports.register({
                chainId: dao.chainId,
                contract: 'Governor',
                address: dao.governor,
                name: ContractController.contracts[dao.chainId].governor.interface.events[e]?.name
            })
        })

        const governor = ContractController.contracts[dao.chainId].governor.attach(dao.governor);
        const timelock = await governor.timelocks(0);

        Object.keys(ContractController.contracts[dao.chainId].timelock.interface.events)
        .filter(e => ![
            // "TransactionExecuted(bytes32,address,uint256,string,bytes,uint256)", 
            // "TransactionQueued(bytes32,address,uint256,string,bytes,uint256)", 
            // "TransactionCancelled(bytes32,address,uint256,string,bytes,uint256)", 
            "Initialized(uint8)"
        ].includes(e))
        .map(e => {
            exports.register({
                chainId: dao.chainId,
                contract: 'Timelock',
                address: timelock,
                name: ContractController.contracts[event.chainId]['timelock'].interface.events[e]?.name
            })
        })
    } catch (err) {
        throw err;
    }
}

async function daoUpdatedListener(event) {

}

async function adminChangedListener(event) {

}

async function newTimelockListener(event) {

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
        Object.assign(proposalInfo, proposal);
        ProposalController.update(proposalInfo)
    } catch (err) {
        throw err;
    }
}

async function proposalUpdatedListener(event) {

}

exports.resolveEventId = (eventId) => {
    const obj = {};
    let i = 0;
    try {
        if (eventId.length != CONSTANTS.PADDING.CHAINID*2 + CONSTANTS.PADDING.ADDRESS*2 + CONSTANTS.PADDING.TXHASH*2 + CONSTANTS.PADDING.LOGINDEX*2+2)
            throw {message: 'Invalid eventId length'};
        obj.chainId = Number(ethers.utils.hexDataSlice(eventId, i, i+= CONSTANTS.PADDING.CHAINID));
        obj.address = ethers.utils.hexDataSlice(eventId, i, i+= CONSTANTS.PADDING.ADDRESS);
        obj.transactionHash = ethers.utils.hexDataSlice(eventId, i, i+= CONSTANTS.PADDING.TXHASH);
        obj.logIndex = ethers.utils.hexDataSlice(eventId, i, i+= CONSTANTS.PADDING.LOGINDEX);    
    } catch (err) {
        console.error(err);
        throw err;
    }
    return obj;
}

const createEvent = (data) => {
    try {
        data._id = ethers.utils.hexConcat([
            utils.toHex(Number(data.chainId), CONSTANTS.PADDING.CHAINID),
            utils.toHex(data.address, CONSTANTS.PADDING.ADDRESS),
            utils.toHex(data.transactionHash, CONSTANTS.PADDING.TXHASH),
            utils.toHex(Number(data.logIndex), CONSTANTS.PADDING.LOGINDEX)
        ])
    } catch (err) {
        throw err;
    }
    
    Event.findByIdAndUpdate(
        data._id,
        data,
        {upsert: true, new: true}
    )
    .then(data => {
        console.log(`Event created ${data._id}`);
        return true;
    }).catch(err => {
        throw err;
    })
};

exports.findOne = async (req, res) => {
    try {
        exports.resolveEventId(req.params.eventId);
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
        return 0;
    }

    Event.findById(req.params.eventId)
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

exports.findByDao = async (req, res) => {
    const dao = {}, query = {};
    try {
        Object.assign(dao, DaoController.resolveDaoId(req.params.daoId));
        dao.contracts = await DaoController.getContracts(req.params.daoId);
        Object.assign(query, {
            chainId: dao.chainId,
            address: { $in: Object.values(dao.contracts).flat() },
            name: { $nin: ["VoteCast", "TransactionQueued", "TransactionExecuted", "TransactionCancelled"]}    
        })
    } catch (err) {
        res.status(500).send({
            message: err.message
        });
        return 0;
    }

    Event.find(query).sort()
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

exports.register = (data) => {
    const eventRegistry = {};
    try {
        let topic = ContractController.contracts[data.chainId][data.contract.toLowerCase()]
                ?.filters[data.name]()
                .topics[0];
        Object.assign(eventRegistry, {
            _id: ethers.utils.hexConcat([
                utils.toHex(Number(data.chainId), CONSTANTS.PADDING.CHAINID),
                utils.toHex(data.address, CONSTANTS.PADDING.ADDRESS),
                utils.toHex(topic, CONSTANTS.PADDING.TOPIC)
            ]),
            contract: data.contract,
            address: data.address,
            name: data.name,
            chainId: data.chainId
        })
    } catch (err) {
        throw err;
    }

    EventRegistry.findByIdAndUpdate(
        eventRegistry._id,
        eventRegistry,
        {upsert: true, new: true}
    )
    .then(data => {
        createEventListener(data);
        return data;
    }).catch(err => {
        throw err;
    })
}

exports.registry = (req, res) => {
    exports.register({
        chainId: req.body.chainId,
        contract: req.body.contract,
        address: req.body.address,
        name: req.body.name
    })
    .then(res => {
        res.status(200).send({'data': data})
    })
    .catch(err => {
        res.status(500).send({
            message: err.message
        });
        return 0;
    })
}

exports.findAllRegistries = async () => {
    return await EventRegistry.find({})   
}

exports.registerAllExisted = () => {
    EventRegistry.find({})
    .then(data => {
        data.map(e => createEventListener(e));
        return data;
    })
    .catch(error => {
        throw error;
    })
}