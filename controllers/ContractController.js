const ethers = require('ethers');
const config = require('../config');

const EventController = require('./EventController');

const utils = require('../utils');
const EventRegistry = require('../models/EventRegistry');

exports.providers = {};
exports.contracts = {};

function getChainInfo(chainId) {
    return config.chains.filter(e => e["chainId"] == chainId)[0]
}

const initialize = () => {
    try {
        config.allowedChains.map(e => {
            chainInfo = getChainInfo(e);
            exports.providers[e] = chainInfo.rpc.map(url => new ethers.providers['JsonRpcProvider'](url))
            exports.contracts[e] = Object.keys(config[e])
                                    .filter(elm => elm != "")
                                    .reduce((obj, elm) => { 
                                        obj[elm] = new ethers.Contract(
                                            config[e][elm].address, 
                                            config[e][elm].interface, 
                                            exports.providers[e][0]
                                        );
                                        return obj;
                                    }, {});
            EventController.register({
                chainId: e,
                contract: 'DAOFactory',
                address: config[e]['daofactory'].address,
                name: 'DAOCreated'
            })
            EventController.registerAllExisted();
            // const eventRegistries = await EventController.findAllRegistries();
            // eventRegistries.map(e => {
            //     EventController.register(e)
            //     return ;
            // })
        })
    } catch (err) {
        throw err;
    }
}

exports.getContracts = async (data) => {
    let daoContracts = {};
    if (!config.allowedChains.includes(data.chainId)) throw {message: "Not supported chain!"};
    let daoRecord = await exports.contracts[data.chainId].daofactory.daos(data.index);
    if (daoRecord.governor == config.CONSTANTS.ZERO_ADDRESS) throw {message: "DAO not existed"};
    let governor = new ethers.Contract(
        daoRecord.governor,
        config[data.chainId].governor.interface,
        this.providers[data.chainId][0]
    )

    const [timelocks, votes] = await Promise.all([governor.getTimelocks(), governor.votes()]);
    
    daoContracts.governor = governor.address;
    daoContracts.timelocks = timelocks;
    daoContracts.votes = votes;
    switch(daoRecord.standard) {
        case 0:
            daoContracts.standard = 'ERC20Votes';
            break;
        case 1:
            daoContracts.standard = 'ERC721Votes';
            break;
    }

    return daoContracts;
}

try {
    initialize();
} catch (err) {
    console.error(err);
    process.exit();
}
