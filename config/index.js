exports.allowedChains = [
    31337
]

exports.chains = require('./allowedChains.js')
exports.CONSTANTS = require('./constants');

this.allowedChains.map(e => exports[[e]] = require(`./${e}.js`))