const config = require('../config');

exports.getChainInfo = (chainId) => {
    return config.chains.filter(e => e["chainId"] == chainId)[0]
}

exports.getAllowedChains = () => {
    return config.allowedChains.map(e => exports.getChainInfo(e));
}

