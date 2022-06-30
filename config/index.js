exports.allowedChains = [
    31337
]

exports.chains = require('./chains.js')

this.allowedChains.map(e => exports[[e]] = require(`./${e}.js`))