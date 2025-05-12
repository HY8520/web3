const {ethers} = require("hardhat");



let multiSignatureAddress = ["0x23f020fef2972d45B3E79a63CD578A26fb7445f5",
                            "0xf6590415deC9e2685161C4ca16B7AA00e0e0568F",
                            "0x4361F953A83a0919a86ECef5b007A32585cFe4Bc"];
let threshold = 2;


async function main() {

  const [deployerMax,,,,deployerMin] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployerMax.address
  );

  console.log("Account balance:", (await deployerMax.getBalance()).toString());

  const multiSignatureToken = await ethers.getContractFactory("multiSignature");
  const multiSignature = await multiSignatureToken.connect(deployerMax).deploy(multiSignatureAddress, threshold);

  console.log("multiSignature address:", multiSignature.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });