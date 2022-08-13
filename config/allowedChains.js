require("dotenv").config();
const INFURA_API_KEY = process.env.INFURA_NODE_ID;

module.exports = [
    {
        "name": "Ethereum Testnet Rinkeby",
        "chainId": 4,
        "shortName": "rin",
        "networkId": 4,
        "nativeCurrency": {
            "name": "Rinkeby Ether",
            "symbol": "RIN",
            "decimals": 18
        },
        "rpc": [
            `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
            "https://ethereum-rinkeby-rpc.allthatnode.com/",
            // "https://rinkeby-light.eth.linkpool.io"
        ],
        "faucets": [
            "https://faucet.rinkeby.io"
        ],
        "infoURL": "https://www.rinkeby.io",
        "explorer": "https://rinkeby.etherscan.io/"
    },
    {
        "name": "Binance Smart Chain Testnet",
        "chainId": 97,
        "shortName": "bnbt",
        "networkId": 97,
        "nativeCurrency": {
            "name": "Binance Chain Native Token",
            "symbol": "tBNB",
            "decimals": 18
        },
        "rpc": [
            // "https://nd-006-375-626.p2pify.com/7d7fc1a2b5dd8f7a51697c940dd6fe33",
            "https://data-seed-prebsc-2-s1.binance.org:8545",
            "https://data-seed-prebsc-1-s2.binance.org:8545",
            "https://data-seed-prebsc-1-s3.binance.org:8545"
        ],
        "faucets": [
            "https://testnet.binance.org/faucet-smart"
        ],
        "infoURL": "https://testnet.binance.org/",
        "explorer": "https://testnet.bscscan.com/"
    },
    {
        "name": "Localhost",
        "chainId": 31337,
        "shortName": "loc",
        "networkId": 31337,
        "nativeCurrency": {
            "name": "ETH",
            "symbol": "ETH",
            "decimals": 18
        },
        "rpc": [
            "http://localhost:8545/",
            "http://localhost:8546/"
        ],
        "faucets": [],
        "infoURL": "http://localhost:80/",
        "explorer": ""
    }
]