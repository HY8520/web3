require("@nomicfoundation/hardhat-ignition");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    bscTestnet: {
      url:"https://optimism-sepolia.infura.io/v3/ef2b2ef0e8a346b380d76fd180fa42a6",
      accounts:[process.env.PRIVATE_KEY]
    },
    sepolia: {
      url:"https://eth-sepolia.g.alchemy.com/v2/GOMFOBqhhAUd0x3yDlAi1pyACsyOskHM",
      accounts:[process.env.PRIVATE_KEY]
    },
  },
  solidity: {
    optimizer: {
      enabled: false,
      runs: 50,
    },
    compilers: [
      {
        version: "0.4.18",
        settings: {
          evmVersion: "berlin"
        }
      },
      {
        version: "0.5.16",
        settings: {
          evmVersion: "berlin"
        }
      },
      {
        version: "0.6.6",
        settings: {
          evmVersion: "berlin",
          optimizer: {
            enabled: true,
            runs: 1
          },
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1
          },
          // evmVersion: "shanghai"
        }
      },
    ],
  },
};
