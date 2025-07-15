// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

struct Parameters {
    address depositToken;
    bool depositTokenIsNative;
    uint256 founderDepositAmount;
    uint256 applicantDepositMinAmount;
    uint256 applyDeadline;
}

// 定义IBounty 接口 , factory需要调用
interface IBounty {
    function vaultAccount() external view returns (address);
}


