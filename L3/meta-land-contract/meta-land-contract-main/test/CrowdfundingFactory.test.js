const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("CrowdfundingFactory", function () {
    let deployer, addr1, addr2, addr3;

    let crowdfundingFactory;
    let ERC20Token;
    let sellTokenAddress;
    let crowdfundingFactoryProxyAddress;
    let CrowdfundingFactory;

    beforeEach(async function () {
        [deployer, addr1, addr2, addr3, ...addrs] = await ethers.getSigners(); // 10000 ETH

        // deploy crowdfunding
        const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
        const crowdfundingDeploy = await Crowdfunding.deploy();
        await crowdfundingDeploy.deployed();
        let crowdfundingAddress = crowdfundingDeploy.address
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

        const ERC20TokenFactory1 = await ethers.getContractFactory("ERC20Token");
        ERC20Token = await ERC20TokenFactory1.deploy("MetaLand Test Token", "MLT");
        await ERC20Token.deployed();
        sellTokenAddress = ERC20Token.address;
        // console.log("erc20Token address:", sellTokenAddress);

        await ERC20Token.connect(deployer).mint(addr1.address, ethers.utils.parseEther("1000"));
        await ERC20Token.connect(addr1).approve(crowdfundingFactoryProxyAddress, ethers.utils.parseEther("1000"));
        // console.log("addr1's erc20Token balance:", await ERC20Token.connect(addr1).balanceOf(addr1.address));
    })

    it("upgrade successfully", async function () {
        const oldImplAddress = await upgrades.erc1967.getImplementationAddress(crowdfundingFactoryProxyAddress);
        console.log("oldImplAddress: ", oldImplAddress)

        const oldStore = await crowdfundingFactory.getStore();
        const oldBeacon = await crowdfundingFactory.crowdfundingBeacon();

        const newFactory = await CrowdfundingFactory.deploy();
        await newFactory.deployed();

        const tx = await crowdfundingFactory.upgradeToAndCall(newFactory.address, '0x');
        await tx.wait()

        const newImplAddress = await upgrades.erc1967.getImplementationAddress(crowdfundingFactoryProxyAddress);
        console.log("newImplAddress: ", newImplAddress)

        const newStore = await crowdfundingFactory.getStore();
        const newBeacon = await crowdfundingFactory.crowdfundingBeacon();

        expect(oldImplAddress).to.not.eq(newImplAddress);
        expect(oldStore).to.eq(newStore);
        expect(oldBeacon).to.eq(newBeacon);
    });

    describe("CrowdfundingFactory", function () {
        let teamWallet = new ethers.Wallet(process.env.SEPOLIA_PK_ONE, ethers.provider);
        let routerAddress = "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2"; //SwapRouter
        let startTime, endTime;

        beforeEach(async function () {
            const { time } = require("@nomicfoundation/hardhat-network-helpers");
            const now = await time.latest();
            startTime = now + time.duration.days(1);
            endTime = now + time.duration.days(3);
        })

        it("createCrowdfundingContract successfully", async function () {
            await crowdfundingFactory.connect(deployer).addToDexRouters(routerAddress);
            tx = await crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                sellTokenAddress, //sellTokenAddress
                sellTokenAddress, //buyTokenAddress，sellTokenAddress = buyTokenAddress
                18,     // sellTokenDecimals
                18,     // buyTokenDecimals
                true,  // buyTokenIsNative
                ethers.utils.parseEther("100"), // raiseTotal, 众筹目标额，以buyToken计
                ethers.utils.parseEther("2"),  // buyPrice，表示每个sellToken需要支付多少buyToken
                1000,    // swapPercent 众筹结束时需要放入流动性池的buyToken的比例，需要除以10000
                100,     // sellTax 众筹阶段卖出时的税率，需要除以10000
                ethers.utils.parseEther("10"),  // maxBuyAmount，最大买入额
                ethers.utils.parseEther("0.001"),   // minBuyAmount,最小买入额
                1000,    // maxSellPercent, 众筹阶段最大卖出比例，需要除以10000
                teamWallet.address, // teamWallet，团队钱包地址，用来接收除放入流动性池之外的buyToken
                startTime,  // startTime，众筹开始时间
                endTime, // endTime，众筹结束时间
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
            expect(event.args.founder).to.equal(addr1.address);
            console.log("event.args.crowdfunding:", event.args.crowdfunding);
            // console.log("event.args.paras:", event.args.paras);
            expect(event.args.paras[0]).to.equal(sellTokenAddress);
            expect(event.args.paras[1]).to.equal(sellTokenAddress);
            expect(event.args.paras[2]).to.equal(18);
            expect(event.args.paras[3]).to.equal(18);
            expect(event.args.paras[4]).to.equal(true);
            expect(event.args.paras[5]).to.equal(ethers.utils.parseEther("100"));
            expect(event.args.paras[6]).to.equal(ethers.utils.parseEther("2"));
            expect(event.args.paras[7]).to.equal(1000);
            expect(event.args.paras[8]).to.equal(100);
            expect(event.args.paras[9]).to.equal(ethers.utils.parseEther("10"));
            expect(event.args.paras[10]).to.equal(ethers.utils.parseEther("0.001"));
            expect(event.args.paras[11]).to.equal(1000);
            expect(event.args.paras[12]).to.equal(teamWallet.address);
            expect(event.args.paras[13]).to.equal(startTime);
            expect(event.args.paras[14]).to.equal(endTime);
            expect(event.args.paras[15]).to.equal(routerAddress);
            expect(event.args.paras[16]).to.equal(ethers.utils.parseEther("1"));

            // test isChild()
            let isChild = await crowdfundingFactory.connect(addr1).isChild(event.args.crowdfunding)
            expect(isChild).to.equal(true);

            // test children()
            let children = await crowdfundingFactory.connect(addr1).children()
            expect(children.length).to.equal(1);

            // test getStore()
            let storeAddress = await crowdfundingFactory.connect(deployer).getStore()
            expect(storeAddress).to.not.be.undefined;
        })

        it("createCrowdfundingContract error, TokenBalanceInsufficient", async function () {
            await crowdfundingFactory.connect(deployer).addToDexRouters(routerAddress);
            await ERC20Token.connect(deployer).mint(addr2.address, ethers.utils.parseEther("2000"));
            await ERC20Token.connect(addr2).approve(crowdfundingFactoryProxyAddress, ethers.utils.parseEther("2000"));
            // need deposit 2100
            await expect(crowdfundingFactory.connect(addr2).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                true,
                ethers.utils.parseEther("1000"),
                ethers.utils.parseEther("2"),
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress,
                ethers.utils.parseEther("1")
            ])).to.be.revertedWithCustomError(
                crowdfundingFactory,
                "TokenBalanceInsufficient"
            ).withArgs("Sell");
        })

        it("createCrowdfundingContract error, TokenAllowanceInsufficient", async function () {
            await crowdfundingFactory.connect(deployer).addToDexRouters(routerAddress);
            await ERC20Token.connect(deployer).mint(addr2.address, ethers.utils.parseEther("2200"));
            await ERC20Token.connect(addr2).approve(crowdfundingFactoryProxyAddress, ethers.utils.parseEther("2000"));
            // need deposit 2100
            await expect(crowdfundingFactory.connect(addr2).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                true,
                ethers.utils.parseEther("1000"),
                ethers.utils.parseEther("2"),
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress,
                ethers.utils.parseEther("1")
            ])).to.be.revertedWithCustomError(
                crowdfundingFactory,
                "TokenAllowanceInsufficient"
            ).withArgs("Sell");
        })

        it("createCrowdfundingContract error, ERR: BUY_TOKEN_IS_NATIVE NEED TRUE", async function () {
            await expect(crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                false,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("0"),  // buyPrice, need > 0
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress,
                ethers.utils.parseEther("1")
            ])).to.be.revertedWith("ERR: BUY_TOKEN_IS_NATIVE NEED TRUE");
        })

        it("createCrowdfundingContract error, ERR: BUY PRICE", async function () {
            await expect(crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                true,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("0"),  // buyPrice, need > 0
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress,
                ethers.utils.parseEther("1")
            ])).to.be.revertedWith("ERR: BUY PRICE");
        })

        it("createCrowdfundingContract error, ERR: INIT PRICE OF DEX", async function () {
            await expect(crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                true,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("10"),
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress,
                ethers.utils.parseEther("0") //dexInitPrice, need > 0
            ])).to.be.revertedWith("ERR: INIT PRICE OF DEX");
        })

        it("createCrowdfundingContract error, ERR:NOT SUPPORT DEX", async function () {
            await expect(crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                sellTokenAddress,
                sellTokenAddress,
                18,
                18,
                true,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("10"),
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress, // router, need in dexRouters
                ethers.utils.parseEther("1")
            ])).to.be.revertedWith("ERR:NOT SUPPORT DEX");
        })

        it("createCrowdfundingContract error, TokenAddress", async function () {
            await expect(crowdfundingFactory.connect(addr1).createCrowdfundingContract([
                ethers.constants.AddressZero,
                ethers.constants.AddressZero,
                18,
                18,
                true,
                ethers.utils.parseEther("100"),
                ethers.utils.parseEther("10"),
                1000,
                100,
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("0.001"),
                1000,
                teamWallet.address,
                startTime,
                endTime,
                routerAddress, // router, need in dexRouters
                ethers.utils.parseEther("1")
            ])).to.be.revertedWithCustomError(crowdfundingFactory, "TokenAddress");
        })

        it("addToDexRouters and removeFromDexRouters successfully", async function () {
            await crowdfundingFactory.connect(deployer).addToDexRouters(routerAddress);
            let isDexRouters = await crowdfundingFactory.connect(deployer).isDexRouters(routerAddress)
            // console.log("isDexRouters:", isDexRouters)
            expect(isDexRouters).to.equal(true);
            await crowdfundingFactory.connect(deployer).removeFromDexRouters(routerAddress);
            isDexRouters = await crowdfundingFactory.connect(deployer).isDexRouters(routerAddress)
            // console.log("isDexRouters:", isDexRouters)
            expect(isDexRouters).to.equal(false);
        })

        it("addToDexRouters and removeFromDexRouters error", async function () {
            await expect(crowdfundingFactory.connect(addr1).addToDexRouters(routerAddress))
                .to.be.revertedWithCustomError(
                    crowdfundingFactory,
                    "OwnableUnauthorizedAccount"
                );

            await expect(crowdfundingFactory.connect(addr1).removeFromDexRouters(routerAddress))
                .to.be.revertedWithCustomError(
                    crowdfundingFactory,
                    "OwnableUnauthorizedAccount"
                );
        })

        it("test setFeeTo", async function () {
            await crowdfundingFactory.connect(deployer).setFeeTo(addr1.address)
            const currentFeeTo = await crowdfundingFactory.feeTo()
            expect(currentFeeTo).to.equal(addr1.address);

            await expect(crowdfundingFactory.connect(addr2).setFeeTo(addr3.address))
                .to.be.revertedWithCustomError(
                    crowdfundingFactory,
                    "Unauthorized"
                );
        })

        it("test setFeeToSetter", async function () {
            await crowdfundingFactory.connect(deployer).setFeeToSetter(addr1.address)
            const currentFeeToSetter = await crowdfundingFactory.feeToSetter()
            expect(currentFeeToSetter).to.equal(addr1.address);

            await expect(crowdfundingFactory.connect(addr2).setFeeToSetter(addr3.address))
                .to.be.revertedWithCustomError(
                    crowdfundingFactory,
                    "Unauthorized"
                );
        })

        it("test setTransferSigner", async function () {
            await crowdfundingFactory.connect(deployer).setTransferSigner(addr1.address)
            const currentTransferSigner = await crowdfundingFactory.transferSigner()
            expect(currentTransferSigner).to.equal(addr1.address);

            await expect(crowdfundingFactory.connect(addr1).setTransferSigner(addr3.address))
                .to.be.revertedWithCustomError(crowdfundingFactory, "OwnableUnauthorizedAccount");
        })
    })
})