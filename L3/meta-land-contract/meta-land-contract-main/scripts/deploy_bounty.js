const { ethers, upgrades } = require("hardhat");

// bounty factory也是uups，基本和bountyFactory一样
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 部署逻辑合约
    const Bounty = await ethers.getContractFactory("Bounty");
    const BountyDeploy = await Bounty.deploy();
    await BountyDeploy.deployed();
    console.log("bounty implementation: ", BountyDeploy.address);

    // 部署beacon合约
    const BountyBeacon = await ethers.getContractFactory("BountyBeacon");
    const BountyBeaconDeploy = await BountyBeacon.deploy(BountyDeploy.address);
    console.log("beacon address: ", BountyBeaconDeploy.address);

    // 部署工厂合约
    const BountyFactory = await ethers.getContractFactory("BountyFactory");
    const BountyFactoryDeploy = await upgrades.deployProxy(BountyFactory, [BountyBeaconDeploy.address], {
        initializer: 'initialize',
        kind: 'uups'
    });
    await BountyFactoryDeploy.deployed();
    console.log("bountyFactory proxy address:", await BountyFactoryDeploy.address);

    const BountyFactoryImpl = await upgrades.erc1967.getImplementationAddress(BountyFactoryDeploy.address);
    console.log("bountyFactory implementation address:", BountyFactoryImpl);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 