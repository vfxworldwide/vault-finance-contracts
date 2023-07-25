import * as hre from 'hardhat';
import { TefiDistributor } from '../../types/ethers-contracts/TefiDistributor';
import { TefiDistributor__factory } from '../../types/ethers-contracts/factories/TefiDistributor__factory';
import address from '../../address';

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
    const routerAddress = mainnet ? address.mainnet.router : address.testnet.router;
    const swapAddress = mainnet ? address.mainnet.swap : address.testnet.swap;
    const tokenAddress = mainnet ? address.mainnet.tokens.tefi : address.testnet.tokens.tefi;
    const distAddress = mainnet ? address.mainnet.tokens.tefi : address.testnet.distributors.tefi;

    const factory: TefiDistributor__factory = new TefiDistributor__factory(deployer);
    let dist: TefiDistributor = factory.attach(distAddress).connect(deployer);
    if ("Redeploy" && true) {
        dist = await factory.deploy(tokenAddress, routerAddress, swapAddress, "0x06f1696f1305e151924613122830aeaA2b5AB84b");
    }

    console.log('TefiDistributor: ', dist.address);

    // await dist.setBuyFees([200, 0, 0, 0, 200]);
    // await dist.setSellFees([400, 0, 0, 100, 400]);

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