import express from 'express';
import Web3 from 'web3';
import { Request, Response } from 'express';
import { configDotenv } from 'dotenv';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(express.json());
app.use(cors());
configDotenv();

// Web3 setup with Sepolia RPC URL
const web3 = new Web3(new Web3.providers.HttpProvider('https://sepolia-rollup.arbitrum.io/rpc'));

const contractAddress = process.env.CONTRACT_ADDRESS || '0x8f110cdd3155cba2b1c97051c9128d2aef125b0f';
const contractABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "user_address", "type": "address" }
        ],
        "name": "giveCoinsTo",
        "outputs": [
            { "name": "", "type": "bool" }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "user_address", "type": "address" }
        ],
        "name": "getCoinBalanceFor",
        "outputs": [
            { "name": "", "type": "uint256" }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
const contract = new web3.eth.Contract(contractABI, contractAddress);


const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
    console.error('PRIVATE_KEY env var is required');
    process.exit(1);
}

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to Dapps Over Apps',
        contractAddress: contractAddress,
        routes: [
            {
                method: 'POST',
                route: '/give-coins',
                description: 'Give Dapps Over Apps coins to a user',
                body: {
                    userAddress: 'string'
                }
            },
            {
                method: 'GET',
                route: '/coin-balance/:address',
                description: 'Get Dapps Over Apps coin balance for a user',
                params: {
                    address: 'string'
                }
            }
        ]
    })
});

// Route to give dappsoverapps coins
app.post('/give-coins', async (req: Request, res: Response) => {
    const { userAddress } = req.body;

    if (!web3.utils.isAddress(userAddress)) {
        return res.status(400).send('Invalid user address');
    }

    try {
        const tx = await contract.methods.giveCoinsTo(userAddress).send({ from: web3.eth.defaultAccount });

        console.log(tx);
        res.status(200).json({
            status: true,
            message: 'Coins given successfully',
            data: {
                txHash: tx.transactionHash,
                receivingAddress: tx.to,
                blockHash: tx.blockHash,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Error giving coins'
        });
    }
});

// Route to get dappsoverapps coin balance
app.get('/coin-balance/:address', async (req: Request, res: Response) => {
    const { address } = req.params;

    if (!web3.utils.isAddress(address)) {
        return res.status(400).json({
            status: false,
            message: 'Invalid address'
        })
    }

    try {
        const balance = await contract.methods.getCoinBalanceFor(address).call();
        res.status(200).json({
            status: true,
            balance: Number(balance)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: 'Error getting balance'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
