const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = '0x64006e4f21dd41c4e17249C7eD2Cd22E88f4F9a8';

    let implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Old implementation address:", implementationAddress);

    const [deployer] = await ethers.getSigners();
    console.log("upgrade with contracts using account:", deployer.address);

    const crowdfundingFactoryContract = await ethers.getContractFactory('CrowdfundingFactory')
    const upgraded = await upgrades.upgradeProxy(proxyAddress, crowdfundingFactoryContract, { call: "owner" });
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