const { ethers } = require('hardhat')

async function main() {
    const abiCoder = new ethers.utils.AbiCoder();

    const contractInterface = new ethers.utils.Interface([
        "function initialize(uint256 value, string memory name)",
    ]);

    const selector = contractInterface.getSighash("initialize");
    console.log(selector);

    const encoded = abiCoder.encode(
        ["uint256", "string", "address"], // 类型数组
        [123, "Hello", "0x1234567890123456789012345678901234567890"] // 值数组
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 