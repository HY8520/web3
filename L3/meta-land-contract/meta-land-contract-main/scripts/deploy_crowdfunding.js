const { ethers } = require('hardhat')


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 部署逻辑合约
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    const CrowdfundingDeploy = await Crowdfunding.deploy();
    await CrowdfundingDeploy.deployed();
    console.log("crowdfunding implementation: ", CrowdfundingDeploy.address);

    // 部署beacon合约
    const CrowdfundingBeacon = await ethers.getContractFactory("CrowdfundingBeacon");
    const CrowdfundingBeaconDeploy = await CrowdfundingBeacon.deploy(CrowdfundingDeploy.address);
    console.log("beacon address: ", CrowdfundingBeaconDeploy.address);

    // 部署工厂合约
    const CrowdfundingFactory = await ethers.getContractFactory("CrowdfundingFactory");
    const CrowdfundingFactoryDeploy = await upgrades.deployProxy(CrowdfundingFactory,
        [deployer.address, deployer.address, deployer.address, CrowdfundingBeaconDeploy.address],
        {
            initializer: 'initialize',
            kind: 'uups'
        });
    await CrowdfundingFactoryDeploy.deployed();
    console.log("crowdfundingFactory proxy address:", await CrowdfundingFactoryDeploy.address);

    const CrowdfundingFactoryImpl = await upgrades.erc1967.getImplementationAddress(CrowdfundingFactoryDeploy.address);
    console.log("crowdfundingFactory implementation address:", CrowdfundingFactoryImpl);
}


main()