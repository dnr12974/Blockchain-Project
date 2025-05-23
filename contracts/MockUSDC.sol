// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Basic ERC20 token to simulate USDC on testnets where it's unavailable.
 * Includes an owner-only mint function for distributing tokens to test accounts.
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    /**
     * @dev Constructor sets the token name, symbol, decimals, and initial owner.
     * Mimics USDC with 6 decimals.
     */
    constructor(address initialOwner) ERC20("Mock USDC", "mUSDC") Ownable(initialOwner) {
        // Standard USDC has 6 decimals
        // Note: OpenZeppelin's ERC20 preset handles decimals, but it's good practice
        // to be aware. The default preset uses 18 decimals. If 6 are strictly needed,
        // we would override the decimals() function or use ERC20Permit.
        // For simplicity in the hackathon, we'll assume the standard 18 decimals
        // or rely on the frontend/contract interaction to handle conversions if needed,
        // but explicitly state 6 here for clarity with real USDC.
    }

    /**
     * @dev Mints tokens to a specified address. Only callable by the owner.
     * @param to The address to receive the minted tokens.
     * @param amount The amount of tokens to mint (in wei, considering decimals).
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * Overriding the default 18 to match USDC's 6 decimals.
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function mintForTesting(address to, uint256 amount) public {
        _mint(to, amount);
    }
} 