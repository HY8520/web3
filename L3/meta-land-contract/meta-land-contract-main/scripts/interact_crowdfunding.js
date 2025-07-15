const { ethers } = require("hardhat");

async function main() {
    const proxyAddress = "c1b55f4a6cbe0c6647646497c70080db4f16bb5d";

    let tx;
    const provider = ethers.provider;
    const admin = new ethers.Wallet(process.env.SEPOLIA_PK_ONE, ethers.provider);
    const user1 = new ethers.Wallet(process.env.SEPOLIA_PK_TWO, ethers.provider);
    // console.log(user1.address, admin.address)    

    
}

main();
