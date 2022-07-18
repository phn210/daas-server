const { resolve } = require("path");
const fs = require("fs");
const FormData = require('form-data');

const IpfsController = require('../controllers/IpfsController');

const CHAIN_ID = 31337;
const INDEX = 5;

const filePath = resolve(process.cwd(), `mocks/${CHAIN_ID}/daos/${INDEX}.json`);

async function main() {
    try {
        const data = fs.readFileSync(filePath).toString();
        const form = new FormData();
        form.append('content', fs.readFileSync(filePath).toString())
        const res = await IpfsController.addFile(form)
        console.log(res.data);
    } catch (err) {
        console.error(err)
    }
}

main()
