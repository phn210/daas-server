const ethers = require('ethers')

exports.toHex = (any, pad=0) => {
	let hex = ethers.utils.hexlify(any);
	return (pad) ? ethers.utils.hexZeroPad(hex, pad) : hex;
};