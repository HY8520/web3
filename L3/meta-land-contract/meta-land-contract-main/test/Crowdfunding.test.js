const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Crowdfunding", function () {
    let deployer, addr1, addr2, addr3;
    let crowdfundingFactory;

    let sellTokenAddress;
    let buyTokenAddress;

    let crowdfundingFactoryProxyAddress;
    let crowdfundingAddress;
    let crowdfundingAddress2;
    let crowdfunding;
    let crowdfunding2;

    let teamWallet = new ethers.Wallet(process.env.SEPOLIA_PK_ONE, ethers.provider);
    let routerAddress = "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2"; //SwapRouter
    let startTime, endTime;
    

    beforeEach(async function () {
        [deployer, addr1, addr2, addr3, ...addrs] = await ethers.getSigners(); // 10000 ETH

        // deploy crowdfunding
        const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
        const crowdfundingDeploy = await Crowdfunding.deploy();
        await crowdfundingDeploy.deployed();
        crowdfundingAddress = crowdfundingDeploy.address;
        // console.log("crowdfunding address: ", crowdfundingAddress)

        // deploy crowdfunding beacon
        const CrowdfundingBeacon = await ethers.getContractFactory("CrowdfundingBeacon");
        const crowdfundingBeaconDeploy = await CrowdfundingBeacon.deploy(crowdfundingAddress);
        await crowdfundingBeaconDeploy.deployed();
        let crowdfundingBeaconAddress = crowdfundingBeaconDeploy.address
        // console.log("crowdfunding beacon address: ", crowdfundingBeaconAddress)

        // deploy crowdfunding factory
        CrowdfundingFactory = await ethers.getContractFactory("CrowdfundingFactory");
        const CrowdfundingFactoryProxyDeploy = await upgrades.deployProxy(CrowdfundingFactory, [deployer.address, deployer.address, deployer.address, crowdfundingBeaconAddress], {
            initializer: 'initialize',
            kind: 'uups'
        })
        await CrowdfundingFactoryProxyDeploy.deployed();
        crowdfundingFactoryProxyAddress = await CrowdfundingFactoryProxyDeploy.address;
        // console.log("crowdfundingFactory proxy address:", crowdfundingFactoryProxyAddress);

        crowdfundingFactory = await CrowdfundingFactory.attach(crowdfundingFactoryProxyAddress)

        const crowdfundingFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(crowdfundingFactoryProxyAddress);
        // console.log("crowdfundingFactory implementation address:", crowdfundingFactoryImplAddress);

        const SellTokenFactory = await ethers.getContractFactory("ERC20Token");
        SellToken = await SellTokenFactory.deploy("Sell Token", "SToken");
        await SellToken.deployed();
        sellTokenAddress = SellToken.address;
        // console.log("sellTokenAddress address:", sellTokenAddress);
        await SellToken.connect(deployer).mint(addr1.address, ethers.utils.parseEther("1000"));
        await SellToken.connect(addr1).approve(crowdfundingFactoryProxyAddress, ethers.utils.parseEther("1000"));

        const BuyTokenFactory = await ethers.getContractFactory("ERC20Token");
        BuyToken = await BuyTokenFactory.deploy("Buy Token", "BToken");
        await BuyToken.deployed();
        buyTokenAddress = BuyToken.address;
        // console.log("buyTokenAddress address:", buyTokenAddress);
        await BuyToken.connect(deployer).mint(addr2.address, ethers.utils.parseEther("1000"));

        const { time } = require("@nomicfoundation/hardhat-network-helpers");
        const now = await time.latest();
        startTime = now + time.duration.days(1);
        endTime = now + time.duration.days(3);

        await crowdfundingFactory.connect(deployer).addToDexRouters(routerAddress);
        tx = await crowdfundingFactory.connect(addr1).createCrowdfundingContract([
            sellTokenAddress, //sellTokenAddress
            sellTokenAddress, //buyTokenAddress，sellTokenAddress = buyTokenAddress
            18,     // sellTokenDecimals
            18,     // buyTokenDecimals
            true,   // buyTokenIsNative
            ethers.utils.parseEther("100"), // raiseTotal, 众筹目标额，以buyToken计
            ethers.utils.parseEther("2"),  // buyPrice，项目方token的购买价格，以buyToken计
            1,    // swapPercent，众筹结束时需要放入流动性池的buyToken的比例，value= (buyAmount * swapPercent) / 10000
            1,     // sellTax 众筹阶段卖出时的税率，需要除以10000, value= (sellAmount * sellTax) / 10000
            ethers.utils.parseEther("10"),  // maxBuyAmount，最大买入额
            ethers.utils.parseEther("0.001"),   // minBuyAmount,最小买入额
            1000,    // maxSellPercent, 众筹阶段最大卖出比例，需要除以10000
            teamWallet.address, // teamWallet，团队钱包地址，用来接收除放入流动性池之外的buyToken
            startTime,  // startTime，众筹开始时间
            endTime,    // endTime，众筹结束时间
            routerAddress,    // router，去中心化交易所的router地址，如果是自动添加流动性，则需要指定交易所的router合约的地址
            ethers.utils.parseEther("1") // dexInitPrice，去中心化交易所的初始价格
        ]);
        const receipt = await tx.wait();
        const event = receipt.logs.map(log => {
            try {
                return crowdfundingFactory.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).find(e => e?.name === 'Created');
        expect(event).to.not.be.undefined;

        crowdfundingAddress = event.args.crowdfunding
        // console.log("crowdfundingAddress:", crowdfundingAddress);
        crowdfunding = await ethers.getContractAt("Crowdfunding", crowdfundingAddress);

        tx2 = await crowdfundingFactory.connect(addr1).createCrowdfundingContract([
            sellTokenAddress, //sellTokenAddress
            buyTokenAddress, //buyTokenAddress，sellTokenAddress != buyTokenAddress
            18,     // sellTokenDecimals
            18,     // buyTokenDecimals
            false,   // buyTokenIsNative
            ethers.utils.parseEther("100"), // raiseTotal, 众筹目标额，以buyToken计
            ethers.utils.parseEther("2"),  // buyPrice，项目方token的购买价格，以buyToken计
            1,    // swapPercent，众筹结束时需要放入流动性池的buyToken的比例，value= (buyAmount * swapPercent) / 10000
            1,     // sellTax 众筹阶段卖出时的税率，需要除以10000, value= (sellAmount * sellTax) / 10000
            ethers.utils.parseEther("10"),  // maxBuyAmount，最大买入额
            ethers.utils.parseEther("0.001"),   // minBuyAmount,最小买入额
            1000,    // maxSellPercent, 众筹阶段最大卖出比例，需要除以10000
            teamWallet.address, // teamWallet，团队钱包地址，用来接收除放入流动性池之外的buyToken
            startTime,  // startTime，众筹开始时间
            endTime,    // endTime，众筹结束时间
            routerAddress,    // router，去中心化交易所的router地址，如果是自动添加流动性，则需要指定交易所的router合约的地址
            ethers.utils.parseEther("1") // dexInitPrice，去中心化交易所的初始价格
        ]);
        const receipt2 = await tx2.wait();
        const event2 = receipt2.logs.map(log => {
            try {
                return crowdfundingFactory.interface.parseLog(log);
            } catch (e) {
                return null;
            }
        }).find(e => e?.name === 'Created');
        expect(event2).to.not.be.undefined;

        crowdfundingAddress2 = event2.args.crowdfunding
        // console.log("crowdfundingAddress2:", crowdfundingAddress2);
        crowdfunding2 = await ethers.getContractAt("Crowdfunding", crowdfundingAddress2);

        await BuyToken.connect(addr2).approve(crowdfundingAddress2, ethers.utils.parseEther("1000"));
    })

    describe("buy", function () {

        it("buy successful (buyTokenIsNative=true)", async function () {
            let maxBuyAmount = await crowdfunding.connect(addr1).maxBuyAmount()
            expect(maxBuyAmount._buyAmount).to.equal(ethers.utils.parseEther("10"));
            expect(maxBuyAmount._sellAmount).to.equal(ethers.utils.parseEther("20"));

            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            tx = await crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("1"),
                ethers.utils.parseEther("2"),
                { value: ethers.utils.parseEther("1") }
            );
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Buy');

            expect(event).to.not.be.undefined;
            expect(event.args.caller).to.equal(addr2.address);
            expect(event.args.buyAmount).to.equal(ethers.utils.parseEther("1"));
            expect(event.args.sellAmount).to.equal(ethers.utils.parseEther("2"));
            expect(event.args.buyTokenBalance).to.equal(ethers.utils.parseEther("1"));
            expect(event.args.sellTokenBalance).to.equal(ethers.utils.parseEther("198"));
            expect(event.args.swapPoolBalance).to.equal(ethers.utils.parseEther("0.0001")); // 0.0001 = 1 * 1 / 10000

            let state = await crowdfunding.connect(addr2).state()
            expect(state._raiseTotal).to.equal(ethers.utils.parseEther("100")); // 众筹目标额(以buyToken计)
            expect(state._raiseAmount).to.equal(ethers.utils.parseEther("1")); // 众筹已筹金额(以buyToken计)
            expect(state._swapPoolAmount).to.equal(ethers.utils.parseEther("0.0001")); // 放入流动性池的buyToken的金额
            expect(state._buyTokenBalance).to.equal(ethers.utils.parseEther("0.0001")); // CrowdfundingStore内的余额
            expect(state._status).to.equal(1); // 0-Pending, 1-Upcoming, 2-Live, 3-Ended, 4-Cancel
            expect(state._dexInitPrice).to.equal(ethers.utils.parseEther("1")); // 去中心化交易所的初始价格

            let crowdfundingStoreAddress = await crowdfunding.connect(addr2).vaultAccount()
            // console.log("crowdfundingStoreAddress:", crowdfundingStoreAddress)
            let crowdfundingStore = await ethers.getContractAt("CrowdfundingStore", crowdfundingStoreAddress)
            let total = await crowdfundingStore.connect(crowdfunding.address).getTotal(addr2.address)
            expect(total[0]).to.equal(ethers.utils.parseEther("1")); // 记录用户历史累计购买buyToken的数量
            expect(total[1]).to.equal(ethers.utils.parseEther("2")); // 记录用户历史累计购买sellToken的数量

            let amount = await crowdfundingStore.connect(crowdfunding.address).getAmount(addr2.address)
            expect(amount[0]).to.equal(ethers.utils.parseEther("1")); // 记录用户当前buyToken的数量
            expect(amount[1]).to.equal(ethers.utils.parseEther("2")); // 记录用户当前sellToken的数量


            let parameters = await crowdfunding.connect(addr2).parameters()
            // console.log("parameters:", parameters)
            expect(parameters[0]).to.equal(sellTokenAddress);
            expect(parameters[1]).to.equal(sellTokenAddress);
            expect(parameters[2]).to.equal(18);
            expect(parameters[3]).to.equal(ethers.utils.parseEther("2"));
            expect(parameters[4]).to.equal(1);
            expect(parameters[5]).to.equal(ethers.utils.parseEther("10"));
            expect(parameters[6]).to.equal(ethers.utils.parseEther("0.001"));
            expect(parameters[7]).to.equal(1000);
            expect(parameters[8]).to.equal(ethers.utils.parseEther("1"));

            let depositAmount = await crowdfunding.connect(addr2).deposit()
            // console.log("depositAmount:", depositAmount)
            expect(depositAmount).to.equal(ethers.utils.parseEther("200.01"));
        })

        it("buy failed (ZeroAmount)", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            await expect(crowdfunding.connect(addr2).buy(
                0,
                ethers.utils.parseEther("2"),
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(
                crowdfunding,
                "ZeroAmount"
            )
        })

        it("buy failed (PriceIsMismatch)", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            await expect(crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("1"),
                ethers.utils.parseEther("4"),
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(
                crowdfunding,
                "PriceIsMismatch"
            )
        })

        it("buy failed (AmountLTMinimum)", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            await expect(crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("0.0001"),
                ethers.utils.parseEther("0.0002"),
                { value: ethers.utils.parseEther("0.0001") }
            )).to.be.revertedWithCustomError(
                crowdfunding,
                "AmountLTMinimum"
            )
        })

        it("buy failed (AmountExceedsMaximum)", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            await expect(crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("11"),
                ethers.utils.parseEther("22"),
                { value: ethers.utils.parseEther("11") }
            )).to.be.revertedWithCustomError(
                crowdfunding,
                "AmountExceedsMaximum"
            )
        })

        it("buy failed (msg.value is not valid)", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            await expect(crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("1"),
                ethers.utils.parseEther("2"),
                { value: ethers.utils.parseEther("0.5") }
            )).to.be.revertedWith("msg.value is not valid")
        })

        it("buy successful (buyTokenIsNative=false)", async function () {

            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));
            tx = await crowdfunding2.connect(addr2).buy(
                ethers.utils.parseEther("1"),
                ethers.utils.parseEther("2")
            );
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding2.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Buy');
            expect(event).to.not.be.undefined;
            expect(event.args.caller).to.equal(addr2.address);
            expect(event.args.buyAmount).to.equal(ethers.utils.parseEther("1"));
            expect(event.args.sellAmount).to.equal(ethers.utils.parseEther("2"));
            expect(event.args.buyTokenBalance).to.equal(ethers.utils.parseEther("1"));
            expect(event.args.sellTokenBalance).to.equal(ethers.utils.parseEther("198"));
            expect(event.args.swapPoolBalance).to.equal(ethers.utils.parseEther("0.0001")); // 0.0001 = 1 * 1 / 10000

            let state = await crowdfunding2.connect(addr2).state()
            expect(state._raiseTotal).to.equal(ethers.utils.parseEther("100")); // 众筹目标额(以buyToken计)
            expect(state._raiseAmount).to.equal(ethers.utils.parseEther("1")); // 众筹已筹金额(以buyToken计)
            expect(state._swapPoolAmount).to.equal(ethers.utils.parseEther("0.0001")); // 放入流动性池的buyToken的金额
            expect(state._buyTokenBalance).to.equal(ethers.utils.parseEther("0.0001")); // CrowdfundingStore内的余额
            expect(state._status).to.equal(1); // 0-Pending, 1-Upcoming, 2-Live, 3-Ended, 4-Cancel
            expect(state._dexInitPrice).to.equal(ethers.utils.parseEther("1")); // 去中心化交易所的初始价格

            let crowdfundingStoreAddress = await crowdfunding2.connect(addr2).vaultAccount()
            // console.log("crowdfundingStoreAddress:", crowdfundingStoreAddress)
            let crowdfundingStore = await ethers.getContractAt("CrowdfundingStore", crowdfundingStoreAddress)
            let total = await crowdfundingStore.connect(crowdfunding2.address).getTotal(addr2.address)
            expect(total[0]).to.equal(ethers.utils.parseEther("1")); // 记录用户历史累计购买buyToken的数量
            expect(total[1]).to.equal(ethers.utils.parseEther("2")); // 记录用户历史累计购买sellToken的数量

            let amount = await crowdfundingStore.connect(crowdfunding2.address).getAmount(addr2.address)
            expect(amount[0]).to.equal(ethers.utils.parseEther("1")); // 记录用户当前buyToken的数量
            expect(amount[1]).to.equal(ethers.utils.parseEther("2")); // 记录用户当前sellToken的数量


            let parameters = await crowdfunding.connect(addr2).parameters()
            // console.log("parameters:", parameters)
            expect(parameters[0]).to.equal(sellTokenAddress);
            expect(parameters[1]).to.equal(sellTokenAddress);
            expect(parameters[2]).to.equal(18);
            expect(parameters[3]).to.equal(ethers.utils.parseEther("2"));
            expect(parameters[4]).to.equal(1);
            expect(parameters[5]).to.equal(ethers.utils.parseEther("10"));
            expect(parameters[6]).to.equal(ethers.utils.parseEther("0.001"));
            expect(parameters[7]).to.equal(1000);
            expect(parameters[8]).to.equal(ethers.utils.parseEther("1"));

            let depositAmount = await crowdfunding.connect(addr2).deposit()
            // console.log("depositAmount:", depositAmount)
            expect(depositAmount).to.equal(ethers.utils.parseEther("200.01"));
        })
    })

    describe("sell", function () {

        it("sell successful", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(1));

            // buy 5 buyToken, 10 sellToken
            tx = await crowdfunding.connect(addr2).buy(
                ethers.utils.parseEther("5"),
                ethers.utils.parseEther("10"),
                { value: ethers.utils.parseEther("5") }
            );
            const receipt1 = await tx.wait();
            const event1 = receipt1.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Buy');
            expect(event1).to.not.be.undefined;
            expect(event1.args.swapPoolBalance).to.equal(ethers.utils.parseEther("0.0005")); // 0.0005 = 5 * 1 / 10000

            let maxSellAmount = await crowdfunding.connect(addr2).maxSellAmount()
            expect(maxSellAmount._buyAmount).to.equal(ethers.utils.parseEther("0.0005"));
            expect(maxSellAmount._sellAmount).to.equal(ethers.utils.parseEther("0.001"));

            // sell 0.5 sellToken, 1 buyToken
            sellToken = await ethers.getContractAt("ERC20Token", sellTokenAddress);
            await sellToken.connect(addr2).approve(crowdfundingAddress, ethers.utils.parseEther("1"));
            tx = await crowdfunding.connect(addr2).sell(
                ethers.utils.parseEther("0.0005"),
                ethers.utils.parseEther("0.001")
            );
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Sell');
            expect(event).to.not.be.undefined;
            expect(event.args.caller).to.equal(addr2.address);
            expect(event.args.buyAmount).to.equal(ethers.utils.parseEther("0.0005"));
            expect(event.args.sellAmount).to.equal(ethers.utils.parseEther("0.001"));
            expect(event.args.buyTokenBalance).to.equal(ethers.utils.parseEther("4.9995")); // 4.9995 = 5 - 0.0005
            expect(event.args.sellTokenBalance).to.equal(ethers.utils.parseEther("190.001")); // 190.001 = 190 + 0.001
            expect(event.args.swapPoolBalance).to.equal(ethers.utils.parseEther("0.00000005")); // 0.00000005 = 0.0005 - 0.00049995
        })
    })

    describe("cancel", function () {
        it("cancel successful", async function () {
            tx = await crowdfunding.connect(addr1).cancel();
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Cancel');
            expect(event).to.not.be.undefined;
            expect(event.args.caller).to.equal(addr1.address);
            expect(event.args.status).to.equal(4);
        })
    })

    describe("remove", function () {
        it("remove successful", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(4));
            tx = await crowdfunding.connect(addr1).remove();
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'Remove');
            expect(event).to.not.be.undefined;
            expect(event.args.caller).to.equal(addr1.address);
            expect(event.args.status).to.equal(3);
        })
    })

    describe("updateParas", function () {
        it("updateParas successful", async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            await time.increase(time.duration.days(2));
            let newEndTime = now + time.duration.days(5);
            tx = await crowdfunding.connect(addr1).updateParas(newEndTime);
            const receipt = await tx.wait();
            const event = receipt.logs.map(log => {
                try {
                    return crowdfunding.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            }).find(e => e?.name === 'UpdateParas');
            expect(event).to.not.be.undefined;
            expect(event.args.endTime).to.equal(newEndTime)
        })
    })
})