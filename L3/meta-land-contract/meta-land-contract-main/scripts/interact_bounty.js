const { ethers } = require("hardhat");
const { config: dotenvConfig } = require("dotenv")

async function main() {
    let tx;
    const provider = await ethers.provider;
    const admin = new ethers.Wallet(process.env.SEPOLIA_PK_ONE, ethers.provider);
    const user1 = new ethers.Wallet(process.env.SEPOLIA_PK_TWO, ethers.provider);
    // console.log(user1.address, admin.address)

    const bountyProxy = "0x9862FDe1A4C2d263f672A6130B1f1fc5fA4CF137";

    const bountyContract = await ethers.getContractFactory("Bounty");
    const bountyInsUser1 = await bountyContract.attach(bountyProxy).connect(user1);
    const bountyInsAdmin = await bountyContract.attach(bountyProxy).connect(admin);

    // tx = await bountyInsAdmin.deposit("1000", { value:ethers.utils.parseEther("0.000000000000001") })
    // await tx.wait()
    // console.log("admin deposit")

    // const vault = await bountyInsAdmin.vaultAccount()
    // console.log("vault address: ", vault)

    // const vaultBalance = await provider.getBalance(vault)
    // console.log("vault balance: ", vaultBalance)

    const state = await bountyInsUser1.state();
    console.log(state)

    // tx = await bountyInsUser1.applyFor("1000", { value: ethers.utils.parseEther("0.000000000000001") })
    // await tx.wait();
    // console.log("applyFor: ", tx.hash);

    // tx = await bountyInsAdmin.approveApplicant(user1.address);
    // await tx.wait();
    // console.log("approveApplicant: ", tx.hash)

    // tx = await bountyInsAdmin.unapproveApplicant(user1.address);
    // await tx.wait();
    // console.log("unapproveApplicant: ", tx.hash)
}

main();
