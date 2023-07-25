import * as hre from 'hardhat';
import { MockERC20 } from '../types/ethers-contracts/MockERC20';
import { MockERC20__factory } from '../types/ethers-contracts/factories/MockERC20__factory';
import { MockReflectionToken } from '../types/ethers-contracts/MockReflectionToken';
import { MockReflectionToken__factory } from '../types/ethers-contracts/factories/MockReflectionToken__factory';
import { MockDividendToken } from '../types/ethers-contracts/MockDividendToken';
import { MockDividendToken__factory } from '../types/ethers-contracts/factories/MockDividendToken__factory';
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
    
    // const deployer = (await ethers.getSigners()).filter(account => account.address === "0x06f1696f1305e151924613122830aeaA2b5AB84b")[0];
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
    const routerAddress = mainnet ? address.mainnet.router : address.testnet.router;
    const pcsrouterAddress = mainnet ? address.mainnet.pcsRouter : address.testnet.pcsRouter;
    const mocAddress1 = mainnet ? address.mainnet.tokens.vault : address.testnet.tokens.moc1;
    const mocAddress2 = mainnet ? address.mainnet.tokens.vault : address.testnet.tokens.moc2;
    const mocAddress3 = mainnet ? address.mainnet.tokens.vault : address.testnet.tokens.moc3;

    const factory1: MockERC20__factory = new MockERC20__factory(deployer);
    let moc1: MockERC20 = factory1.attach(mocAddress1).connect(deployer);
    if ("Redeploy Gernal Token" && false) {
        moc1 = await factory1.deploy("Test Token4", "TEST4", toWei("1000000", 9), 9);
    }
    console.log('MockERC20: ', moc1.address);

    const factory2: MockReflectionToken__factory = new MockReflectionToken__factory(deployer);
    let moc2: MockReflectionToken = factory2.attach(mocAddress2).connect(deployer);
    if ("Redeploy Reflection Token" && true) {
        moc2 = await factory2.deploy("CryptoFan Token(Test)", "CFT", pcsrouterAddress);
    }
    console.log('MockReflectionToken: ', moc2.address);

    const factory3: MockDividendToken__factory = new MockDividendToken__factory(deployer);
    let moc3: MockDividendToken = factory3.attach(mocAddress3).connect(deployer);
    if ("Redeploy Dividend Token" && false) {
        moc3 = await factory3.deploy("Test Token2", "TEST2", 
                routerAddress, 
                pcsrouterAddress,
                mainnet ? "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56":"0x228CB512d18DA79e49dD378aF9722fa76a605cE3",
                );
    }
    console.log('MockDividendToken: ', moc3.address);

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