import * as hre from 'hardhat';
import { Launchpad } from '../types/ethers-contracts/Launchpad';
import { Launchpad__factory } from '../types/ethers-contracts/factories/Launchpad__factory';
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
    const launchpadAddress = mainnet ? address.mainnet.launchpad : address.testnet.launchpad;
    const routerAddress = mainnet ? address.mainnet.router : address.testnet.router;
    const pcsAddress = mainnet ? address.mainnet.pcsRouter : address.testnet.pcsRouter;

    const factory: Launchpad__factory = new Launchpad__factory(deployer);
    let launchpad: Launchpad = factory.attach(launchpadAddress).connect(deployer);
    if ("Redeploy" && true) {
        launchpad = await factory.deploy(routerAddress, pcsAddress);
    }

    console.log('Launchpad: ', launchpad.address);

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