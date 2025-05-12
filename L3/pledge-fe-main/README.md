app.pledger.finance

## technology

react、react-router、mobx、webpack5、less

## Project construction:

### Initial environment:

1. install [Node.js](https://nodejs.org/en/download/);
2. Global installation **yarn** Package manager;

```bash
$ npm install -g yarn
```

3. In the project directory, execute the following command：

```bash
$ yarn install
```

### development · function:

Execute the following command in the project update directory.

```bash
$ yarn dev
```

### Establish production environment：

Execute the following command in the project update directory to build resources for execution in the production environment。

```bash
$ yarn build
```

> Constructed resources are located in **"Project root/dist"**

### janets smart contract configs

```json
{
  "escrow": "0x983cb0b10cB6e590F968eB9095c156d655172b9D",
  "portfolios": "0x140691DDAF73942326fEae1Bb1720799d38198dB",
  "erc1155trade": "0xCFB94E2744896Ea900c9DC79F1ECCdee8377C1F1"
}
```

### Add the Binance Chain network tutorial to the wallet

https://academy.binance.com/zh/articles/connecting-metamask-to-binance-smart-chain

### Binance Api DOC

https://docs.binance.org/smart-chain/wallet/wallet_api.html

### MetaMask configuration network environment

> BSC main network environment:

```
Network Name: Smart Chain

New RPC URL (New RPC URL): https://bsc-dataseed.binance.org/

Smart chain ID (ChainID): 56

Symbol: BNB

Block Explorer URL: https://bscscan.com
```

> BSC test network environment:

```
Network Name: Smart Chain - Testnet

New RPC URL (New RPC URL): https://data-seed-prebsc-1-s1.binance.org:8545/

Smart chain ID (ChainID): 97

Symbol: BNB

Block Explorer URL: https://testnet.bscscan.com
```
