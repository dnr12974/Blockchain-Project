const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MockUSDC contract with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  // For ERC20 contracts, constructor arguments are usually name and symbol if not hardcoded.
  // If your MockUSDC.sol takes constructor arguments (e.g., for initial supply to deployer), add them:
  // const mockUSDC = await MockUSDC.deploy(initialSupplyToOwner); or
  // const mockUSDC = await MockUSDC.deploy("Mock USDC", "MUSDC"); if it takes these.
  // The provided MockUSDC.sol (1.7KB, 43 lines) probably hardcodes these or omits initial supply for owner.

  await mockUSDC.waitForDeployment();

  console.log("MockUSDC contract deployed to:", mockUSDC.target);
  console.log("IMPORTANT: Update this address in frontend/lib/config.ts for MOCK_USDC_CONTRACT_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 