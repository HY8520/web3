// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

interface ICrowdfundingFactory {
    struct Parameters {
        address sellTokenAddress;
        address buyTokenAddress;
        uint8 sellTokenDecimals;
        uint8 buyTokenDecimals;
        bool buyTokenIsNative;
        uint256 raiseTotal;
        uint256 buyPrice;
        uint16 swapPercent;
        uint16 sellTax;
        uint256 maxBuyAmount;
        uint256 minBuyAmount;
        uint16 maxSellPercent;
        address teamWallet;
        uint256 startTime;
        uint256 endTime;
        address router;
        uint256 dexInitPrice;
    }

    function fee() external view returns (uint24);

    function feeTo() external view returns (address);

    function feeToSetter() external view returns (address);

    function transferSigner() external view returns (address);
}
