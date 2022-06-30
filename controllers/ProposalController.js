const Proposal = require('../models/Proposal');

exports.update = (data) => {
    Proposal.findOneAndUpdate(
        {
            chainId: data.chainId,
            governor: data.governor,
            id: data.id
        },
        data,
        {update: true, new: true}
    )
    .then(data => {
        console.log("Proposal updated!");
        return data;
    })
    .catch(err => {
        console.error(err);
        return false;
    })
}

exports.findByDao = (req, res) => {

}