const { ethers, upgrades } = require("hardhat");

async function main() {
    const beaconAddress = '0x9F05Dda3c9E4b0461DAB06098FB670d5dcE83183';

    const [deployer] = await ethers.getSigners();
    console.log("upgrade with contracts using account:", deployer.address);

    const CrowdfundingBeacon = await ethers.getContractFactory("CrowdfundingBeacon");
    const crowdfundingBeacon = await CrowdfundingBeacon.attach(beaconAddress);

    const CrowdfundingNew = await ethers.getContractFactory("Crowdfunding");
    const CrowdfundingNewDeploy = await CrowdfundingNew.deploy();
    await CrowdfundingNewDeploy.deployed()
    console.log("new crowdfunding implementation: ", CrowdfundingNewDeploy.address)

    let tx = await crowdfundingBeacon.upgradeTo(CrowdfundingNewDeploy.address);
    await tx.wait();

    console.log('Contract upgraded');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 