export const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532 in hex

export const CARBON_CREDIT_CONTRACT_ADDRESS = "0x7Bd6321f99C6511348B0E65eC1250F02A0b7eF34";
export const MOCK_USDC_CONTRACT_ADDRESS = "0x2908dA8E7936b11Bc9e730b0a8B4B6Bb7f591Dae";

if (CARBON_CREDIT_CONTRACT_ADDRESS.startsWith("0xYOUR_") || MOCK_USDC_CONTRACT_ADDRESS.startsWith("0xYOUR_")) {
  console.warn("Please replace placeholder contract addresses in frontend/lib/config.ts");
}

// This should be the address of the account that deployed the contracts and owns the CarbonCredit contract (receives fees)
export const CONTRACT_OWNER_ADDRESS = "0x5d3Cd01f5f1646cd52ccb00edeFF5f3943e7F60d";

// This is the address that initially receives the minted project tokens and acts as the seller.
// In a real scenario, this could be various project owners.
// For the hackathon, it's a single account you control that is different from the buyer.
export const DEFAULT_SELLER_ADDRESS = "0x2A25Fa4bDC059079f36Aa38539086AD337b6FdaD";

// You can also add RPC URL if needed, though usually provider handles this via wallet
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org"; 