// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

error TokenAddress();
error Unauthorized(address _sender);
error TokenBalanceInsufficient(string _type);
error TokenAllowanceInsufficient(string _type);
error Transfer(string _type);
error ZeroAmount();
error AmountExceedsMaximum();
error AmountLTMinimum();
error PriceIsMismatch();
error TransferLiquidity(string _type);
error TransferLiquiditySignatureVerificationFailed();
error HandleFeeError();

error Canceled();
error NotStarted();
error HasEnded();
error HasStarted();
error StatusIsEnded();
error AddLiquidityFailed();
error RefundSellTokenFailed();
error RefundBuyTokenFailed();
