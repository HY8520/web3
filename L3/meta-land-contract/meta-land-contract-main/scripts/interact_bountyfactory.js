const { ethers } = require("hardhat");

async function main() {
    const BountyFactory = await ethers.getContractAt("BountyFactory", address);

    let tx = await BountyFactory.createBounty(
        '0x0000000000000000000000000000000000000000',
        // ethers.utils.parseEther("0.01"),
        0,
        ethers.utils.parseEther("0.1"),
        Date.now() + 10000000000000,
        // {
        //   value: ethers.utils.parseEther("0.01"),
        // }
    );
}

main();
