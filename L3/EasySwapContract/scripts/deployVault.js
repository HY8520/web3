const hre = require("hardhat");
const { deployProxy } = require("@openzeppelin/hardhat-upgrades");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log(`Deployer address: ${deployerAddress}`);

  // 1. 部署逻辑合约
  const EasySwapVault = await ethers.getContractFactory("EasySwapVault");
  const implementation = await EasySwapVault.deploy();
  await implementation.deployed();
  console.log(`Implementation deployed to: ${implementation.address}`);

  // 2. 部署代理合约并初始化
  const proxy = await deployProxy(EasySwapVault, [], {
    deployer,
    initializer: "initialize", // 调用 initialize 初始化所有者
  });
  await proxy.deployed();
  console.log(`Proxy deployed to: ${proxy.address}`);

  // ✅ 3. 关键步骤：设置 orderBook 地址（此处用部署者地址测试）
  await (await proxy.setOrderBook(deployerAddress)).wait();
  console.log(`OrderBook set to: ${deployerAddress}`);

  // 4. 验证 orderBook 配置是否正确
  const orderBook = await proxy.orderBook();
  if (orderBook !== deployerAddress) {
    throw new Error("OrderBook address not set correctly");
  }
  console.log("OrderBook configuration verified successfully");
}

main().catch((error) => {
  console.error(`Deployment failed: ${error.message}`);
  process.exit(1);
});