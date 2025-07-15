const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = '0xE621e122316ffa9A3Fa0FeB92Fb289B7f61B9240';

    let implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Old implementation address:", implementationAddress);

    const [deployer] = await ethers.getSigners();
    console.log("upgrade with contracts using account:", deployer.address);

    const bountyFactoryContract = await ethers.getContractFactory('BountyFactory')
    const upgraded = await upgrades.upgradeProxy(proxyAddress, bountyFactoryContract, { call: "owner" });
    await upgraded.deployed();
    console.log('Contract upgraded');

    // 获取升级后的逻辑合约地址
    implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("new implementation address:", implementationAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 