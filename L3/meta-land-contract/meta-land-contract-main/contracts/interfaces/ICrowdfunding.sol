// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

interface ICrowdfunding {
    function deposit() external view returns (uint256);

    function vaultAccount() external view returns (address);
}
