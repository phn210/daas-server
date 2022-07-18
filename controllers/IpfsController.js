const axios = require('axios');
require("dotenv").config();

const IPFS_GET_URL = process.env.IPFS_GET_URL
const IPFS_SET_URL = process.env.IPFS_SET_URL
const INFURA_PROJECT_ID = process.env.INFURA_IPFS_ID
const INFURA_PROJECT_SECRET = process.env.INFURA_IPFS_SECRET

// exports.add = (req, res) => {
//     addFile(req.body)
//     .then(data => {
//         res.status(200).send(data)
//     }).catch(err => {
//         res.status(500).send({
//             message:
//             err.message || "Some error occurred while uploading IPFS."
//         });
//     })
// }

exports.get = (req, res) => {
    getFile(req.params.hash)
    .then(data => {
        res.status(200).send(data)
    }).catch(err => {
        res.status(500).send({
            message:
            err.message || "Some error occurred while retrieving IPFS."
        });
    })
}

const addFile = async (data) => {
    return await axios.post(
        IPFS_SET_URL + '/add',
        data,
        {
            headers: {
                'Authorization': 'Basic ' + btoa(INFURA_PROJECT_ID + ':' + INFURA_PROJECT_SECRET),
            },
            file: {
                path: '.'
            }
        }
    )
}

exports.addFile = addFile;

const getFile = async (ipfsHash) => {
    return await axios.get(IPFS_GET_URL + `/${ipfsHash}`)
}

exports.getFile = getFile;