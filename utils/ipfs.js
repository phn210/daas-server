const { ethers } = require("ethers");

function prepareProposal(proposal) {
    let txs = proposal.txs;
    targets = () => {
        obj = [];
        txs.forEach(tx => {obj.push(tx.target)});
        return obj;    
    }
    values = () => {
        obj = [];
        txs.forEach(tx => {obj.push(tx.value)});
        return obj;    
    }
    signatures = () => {
        obj = [];
        txs.forEach(tx => {obj.push(tx.signature)});
        return obj;    
    }
    calldatas = () => {
        obj = [];
        txs.forEach(tx => {obj.push(ethers.utils.defaultAbiCoder.encode(tx.datas.types, tx.datas.params))});
        return obj;    
    }
    return {
        targets: targets(),
        values: values(),
        signatures: signatures(),
        calldatas: calldatas(),
        descriptionHash: getDescriptionHash(proposal.ipfsHash)
    }
}

function getDescriptionHash(ipfsHash) {
    let decodedIpfsHash = ethers.utils.base58.decode(ipfsHash).slice(2);

    return '0x'+Array.from(decodedIpfsHash, byte => {
        return (Number(byte).toString(16).padStart(2, '0'));
    }).join('').toString(16);
}

function getIpfsHash(descriptionHash) {
    descriptionHash = (descriptionHash.toString()).slice(2).match(/.{1,2}/g);
    let encodedIpfsHash = Array.from(descriptionHash, byte => {
        return (parseInt(byte, 16))
    });
    encodedIpfsHash = [18, 32].concat(encodedIpfsHash);
    return ethers.utils.base58.encode(encodedIpfsHash);
}

module.exports = {
    prepareProposal,
    getDescriptionHash,
    getIpfsHash
}