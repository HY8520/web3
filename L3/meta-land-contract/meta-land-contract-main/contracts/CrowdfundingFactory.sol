// SPDX-License-Identifier: SimPL-2.0
pragma solidity ^0.8.0;

import { IERC20, IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./interfaces/ICrowdfundingFactory.sol";
import "./interfaces/ICrowdfunding.sol";
import "./FactoryStore.sol";
import "./Crowdfunding.sol";
import "./Error.sol";
import "./Whitelist.sol";

contract CrowdfundingFactory is OwnableUpgradeable, UUPSUpgradeable {
    event Created(address founder, address crowdfunding, ICrowdfundingFactory.Parameters paras);
    
    address public crowdfundingBeacon;
    FactoryStore store;
    Whitelist dexRouters;
    uint24 public fee;
    address public feeTo;
    address public feeToSetter;
    address public transferSigner;

    function initialize(address _feeToSetter, address _feeTo, address _transferSigner, address _beacon) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        crowdfundingBeacon = _beacon;
        store = new FactoryStore();
        dexRouters = new Whitelist();
        feeToSetter = _feeToSetter;
        transferSigner = _transferSigner;
        feeTo = _feeTo;
        fee = 500;
    }

    // UUPS升级授权函数，只有合约所有者能升级
    function _authorizeUpgrade(address) internal view override onlyOwner {}

    function createCrowdfundingContract(ICrowdfundingFactory.Parameters calldata paras) public {
        if (paras.sellTokenAddress == address(0) && paras.buyTokenAddress == address(0)) {
            revert TokenAddress();
        }

        if (paras.sellTokenAddress == paras.buyTokenAddress) {
            require(paras.buyTokenIsNative, "ERR: BUY_TOKEN_IS_NATIVE NEED TRUE");
        }

        require(paras.buyPrice > 0, "ERR: BUY PRICE");
        
        if (paras.router != address(0)) {
            require(paras.dexInitPrice > 0, "ERR: INIT PRICE OF DEX");
        }
        
        require(
            isDexRouters(paras.router) || paras.router == address(0),
            "ERR:NOT SUPPORT DEX"
        );
        
        IERC20 sellToken = IERC20(paras.sellTokenAddress);
        
        bytes memory data = abi.encodeWithSelector(
            Crowdfunding.initialize.selector,
            address(this),
            msg.sender,
            "Crowdfunding",
            "1.0",
            paras
        );
        BeaconProxy crowdfunding = new BeaconProxy(crowdfundingBeacon, data);
        
        uint256 _deposit = ICrowdfunding(address(crowdfunding)).deposit();
        require(_deposit > 0, "Sell token deposit is zero");
        
        // require(sellToken.balanceOf(msg.sender) >= _deposit, "Sell token balance is insufficient");
        // require(sellToken.allowance(msg.sender, address(this)) >= _deposit, "Sell token allowance is insufficient");
        if (sellToken.balanceOf(msg.sender) < _deposit) {
            revert TokenBalanceInsufficient("Sell");
        }
        
        if (sellToken.allowance(msg.sender, address(this)) < _deposit) {
            revert TokenAllowanceInsufficient("Sell");
        }
        
        require(
            sellToken.transferFrom(
                msg.sender,
                ICrowdfunding(address(crowdfunding)).vaultAccount(),
                _deposit
            ),
            "Sell token transferFrom failure"
        );
        
        address _address = address(crowdfunding);
        store.push(_address);
        emit Created(msg.sender, _address, paras);
    }

    function children() external view returns (address[] memory) {
        return store.children();
    }

    function isChild(address _address) external view returns (bool) {
        return store.isChild(_address);
    }

    function renounceOwnership() public override onlyOwner {}

    function getStore() external view onlyOwner returns (address) {
        return address(store);
    }

    function addToDexRouters(address _router) public onlyOwner {
        dexRouters.addToWhitelist(_router);
    }

    function isDexRouters(address _router) public view returns (bool) {
        return dexRouters.isWhitelisted(_router);
    }

    function removeFromDexRouters(address _router) public onlyOwner {
        dexRouters.removeFromWhitelist(_router);
    }

    function setFeeTo(address _feeTo) external {
        if (msg.sender != feeToSetter) {
            revert Unauthorized(msg.sender);
        }
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        if (msg.sender != feeToSetter || msg.sender != owner()) {
            revert Unauthorized(msg.sender);
        }
        feeToSetter = _feeToSetter;
    }

    function setTransferSigner(address _transferSigner) external onlyOwner {
        transferSigner = _transferSigner;
    }
}
