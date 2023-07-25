import * as hre from 'hardhat';
import { NovationFactory } from '../types/ethers-contracts/NovationFactory';
import { NovationFactory__factory } from '../types/ethers-contracts/factories/NovationFactory__factory';
import address from '../address';

require("dotenv").config();

const { ethers } = hre;

const toEther = (val: any) => {
    return ethers.utils.formatEther(val);
}

const toWei = (val: any, unit = 18) => {
    return ethers.utils.parseUnits(val, unit);
}

async function deploy() {
    console.log((new Date()).toLocaleString());
    
    // const deployer = (await ethers.getSigners()).filter(account => account.address === "0x32f1C25148DeCbdBe69E1cc2F87E0237BC34b700")[0];
    const deployer = (await ethers.getSigners()).filter(account => account.address === "0x12D16f3A335dfdB575FacE8e3ae6954a1C0e24f1")[0];
    
    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    const beforeBalance = await deployer.getBalance();
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const mainnet = process.env.NETWORK == "mainnet" ? true : false;
    const url = mainnet ? process.env.URL_MAIN : process.env.URL_TEST;
    const curBlock = await ethers.getDefaultProvider(url).getBlockNumber();
    const factoryAddress = mainnet ? address.mainnet.factory : address.testnet.factory;
    const bnbAddress = mainnet ? address.mainnet.bnb : address.testnet.bnb;

    const factory: NovationFactory__factory = new NovationFactory__factory(deployer);
    let novationFactory: NovationFactory = factory.attach(factoryAddress).connect(deployer);
    if ("Redeploy" && true) {
        novationFactory = await factory.deploy(deployer.address, bnbAddress);
    }

    const initCodePairHash = await novationFactory.INIT_CODE_PAIR_HASH();
    console.log(initCodePairHash.toString());

    console.log('NovationFactory: ', novationFactory.address);

    const afterBalance = await deployer.getBalance();
    console.log(
        "Deployed cost:",
         (beforeBalance.sub(afterBalance)).toString()
    );
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })