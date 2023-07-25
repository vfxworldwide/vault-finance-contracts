import * as hre from 'hardhat';
import { Airdrop } from '../types/ethers-contracts/Airdrop';
import { Airdrop__factory } from '../types/ethers-contracts/factories/Airdrop__factory';
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
    
    const deployer = (await ethers.getSigners()).filter(account => account.address === "0x32f1C25148DeCbdBe69E1cc2F87E0237BC34b700")[0];
    // const deployer = (await ethers.getSigners()).filter(account => account.address === "0x12D16f3A335dfdB575FacE8e3ae6954a1C0e24f1")[0];
    
    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    const beforeBalance = await deployer.getBalance();
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const mainnet = process.env.NETWORK == "mainnet" ? true : false;
    const url = mainnet ? process.env.URL_MAIN : process.env.URL_TEST;
    const curBlock = await ethers.getDefaultProvider(url).getBlockNumber();
    const vaultAddress = mainnet ? address.mainnet.tokens.vault : address.testnet.tokens.vault;
    const airdropAddress = mainnet ? address.mainnet.airdrop : address.testnet.airdrop;

    const factory: Airdrop__factory = new Airdrop__factory(deployer);
    let airdrop: Airdrop = factory.attach(airdropAddress).connect(deployer);
    if ("Redeploy" && true) {
        airdrop = await factory.deploy(vaultAddress);
    }

    console.log('Airdrop: ', airdrop.address);

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