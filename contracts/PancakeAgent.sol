//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./interfaces/INovationRouter02.sol";

contract PancakeAgent is Ownable, Pausable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint public serviceFee = 10;
    uint256 public constant feeDenominator = 10000;
    address public serviceFeeWallet;

    INovationRouter02 public immutable router;

    bool private inSwap;

    modifier swapping {
        require (!inSwap, "Novation: SWAPPING");
        inSwap = true;
        _;
        inSwap = false;
    }

    constructor (address _router) {
        router = INovationRouter02(_router);
        serviceFeeWallet = msg.sender;
    }

    function getAmountOutFromBuy(address _token, uint _amountIn) public view returns (uint amountOut, uint afterTax) {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = address(_token);

        amountOut = router.getAmountsOut(_amountIn, path)[1];
        afterTax = amountOut.mul(feeDenominator.sub(serviceFee)).div(feeDenominator);
    }

    function getAmountInFromBuy(address _token, uint _amountOut) public view returns (uint amountIn, uint afterTax) {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = address(_token);

        amountIn = router.getAmountsIn(_amountOut, path)[0];
        afterTax = amountIn.mul(feeDenominator).div(feeDenominator.sub(serviceFee));
    }

    function getAmountOutFromSell(address _token, uint _amountIn) public view returns (uint amountOut, uint afterTax) {
        address[] memory path = new address[](2);
        path[0] = address(_token);
        path[1] = router.WETH();

        amountOut = router.getAmountsOut(_amountIn, path)[1];
        afterTax = amountOut.mul(feeDenominator.sub(serviceFee)).div(feeDenominator);
    }

    function getAmountInFromSell(address _token, uint _amountOut) public view returns (uint amountIn, uint afterTax) {
        address[] memory path = new address[](2);
        path[0] = address(_token);
        path[1] = router.WETH();

        amountIn = router.getAmountsIn(_amountOut, path)[0];
        afterTax = amountIn.mul(feeDenominator).div(feeDenominator.sub(serviceFee));
    }

    function buy(address _token, uint _amountOutMin) external payable {
        require (msg.value > 0, "!amount");
        _buy(_token, msg.value, _amountOutMin);
    }
    
    function _buy(address _token, uint _amountIn, uint _amountOutMin) internal swapping whenNotPaused {
        uint feeBNB = _amountIn.mul(serviceFee).div(feeDenominator);
        
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = _token;

        uint[] memory amountsOut = router.swapExactETHForTokens{value:_amountIn.sub(feeBNB)}(
            0,
            path,
            msg.sender,
            block.timestamp
        );

        require (amountsOut[1] >= _amountOutMin, "Novation: INSUFFICIENT_OUTPUT_AMOUNT");

        if (feeBNB > 0) {
            (bool success, ) = payable(serviceFeeWallet).call{
                value: address(this).balance,
                gas: 30000
            }("");
        }
    }

    function sell(address _token, uint _amountIn, uint _amountOutMin) external {
        require (_amountIn > 0, "!amount");
        
        uint before = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amountIn);
        _amountIn = IERC20(_token).balanceOf(address(this)).sub(before);
        _sell(_token, _amountIn, _amountOutMin);
    }

    function _sell(address _token, uint _amountIn, uint _amountOutMin) internal swapping whenNotPaused {
        address[] memory path = new address[](2);
        path[0] = _token;
        path[1] = router.WETH();

        if (IERC20(_token).allowance(address(this), address(router)) == 0) {
            IERC20(_token).approve(address(router), type(uint).max);
        }
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            _amountIn,
            0,
            path,
            address(this),
            block.timestamp
        );

        uint amountOut = address(this).balance;
        uint feeBNB = amountOut.mul(serviceFee).div(feeDenominator);

        require (amountOut.sub(feeBNB) >= _amountOutMin, "Novation: INSUFFICIENT_OUTPUT_AMOUNT");
        (bool success, ) = payable(msg.sender).call{
            value: amountOut.sub(feeBNB),
            gas: 30000
        }("");

        if (feeBNB > 0) {
            (success, ) = payable(serviceFeeWallet).call{
                value: address(this).balance,
                gas: 30000
            }("");
        }
    }

    function setFeeWallet(address _addr) external onlyOwner {
        serviceFeeWallet = _addr;
    }

    function setServiceFee(uint _fee) external onlyOwner {
        require (_fee <= 50, "Novation: so much fee");
        serviceFee = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        if (msg.sender != address(router)) {
            require (false, "Novation: ISN'T ALLOWED DIRECT SENDING");
        }
    }
}