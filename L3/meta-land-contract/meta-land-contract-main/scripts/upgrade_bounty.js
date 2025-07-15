const { ethers, upgrades } = require("hardhat");

async function main() {
    const beaconAddress = '0xe6cd99223e209bd04de48c083746717c6519a56d';

    const [deployer] = await ethers.getSigners();
    console.log("upgrade with contracts using account:", deployer.address);

    const BountyBeacon = await ethers.getContractFactory("BountyBeacon");
    const bountyBeacon = await BountyBeacon.attach(beaconAddress);

    const BountyNew = await ethers.getContractFactory("BountyV2");
    const BountyNewDeploy = await BountyV2.deploy();
    await BountyNewDeploy.deployed()
    console.log("new bounty implementation: ", BountyNewDeploy.address)

    let tx = await bountyBeacon.upgradeTo(BountyNewDeploy.address);
    await tx.wait();

    console.log('Contract upgraded');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 