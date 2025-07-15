const { ethers } = require("hardhat");

async function main() {
    const token1 = "0x5b0F3358aDA3f41A8B5BeF2a3B64E98a3128b3e4";
    const token2 = "0x383443EbEbF29b094A978662C6dC33eedbC72Ff5";

    const proxyAddress = "0x64006e4f21dd41c4e17249C7eD2Cd22E88f4F9a8";
    const CrowdfundingFactory = await ethers.getContractAt("CrowdfundingFactory", proxyAddress);
    const sellTokenAddress = token1;
    const buyTokenAddress = token1;
    const dex = "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2";

    const admin = new ethers.Wallet(process.env.SEPOLIA_PK_ONE, ethers.provider);
    const user1 = new ethers.Wallet(process.env.SEPOLIA_PK_TWO, ethers.provider);

    // const ERC20Token = await ethers.getContractFactory("TokenERC20");
    // const token1Deploy = await ERC20Token.deploy(ethers.utils.parseEther("10000"), "Test Token A", "TTA");
    // await token1Deploy.deployed()
    // console.log("token1 address: ", token1Deploy.address);

    // const token2Deploy = await ERC20Token.deploy(ethers.utils.parseEther("10000"), "Test Token B", "TTB");
    // await token2Deploy.deployed()
    // console.log("token2 address: ", token2Deploy.address);

    // const ERC20Sell = await ethers.getContractAt("TokenERC20", sellTokenAddress);

    // let tx;

    // const balance =  await ERC20Sell.balanceOf(admin.address)
    // console.log(balance)

    // tx = await CrowdfundingFactory.addToDexRouters(dex);
    // await tx.wait();
    // console.log("add dex router: ", tx.hash);

    const sellTokenIns = await ethers.getContractAt("TokenERC20", sellTokenAddress);
    tx = await sellTokenIns.approve(proxyAddress, ethers.constants.MaxUint256);
    await tx.wait();

    tx = await CrowdfundingFactory.createCrowdfundingContract([
        sellTokenAddress, 
        buyTokenAddress, 
        18,     // sellTokenDecimals
        18,     // buyTokenDecimals
        false,  // buyTokenIsNative
        ethers.utils.parseEther("100"), // raiseTotal
        ethers.utils.parseEther("10"),  // buyPrice
        2000,    // swapPercent / 10000
        300,     // sellTax / 10000
        ethers.utils.parseEther("10"),  // maxBuyAmount
        ethers.utils.parseEther("0.00001"),   // minBuyAmount
        3000,    // maxSellPercent / 10000
        admin.address, // teamWallet
        1749031335 + 10000,  // startTime
        1749031335 + 30000, // endTime
        dex,    // router
        ethers.utils.parseEther("10") // dexInitPrice
    ]);
    await tx.wait();
    console.log("create crowdfunding: ", tx.hash);
}

main();
