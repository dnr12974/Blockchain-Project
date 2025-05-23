const hre = require("hardhat");

async function main() {
  const mockUSDCDeployedAddress = "0x946AE933678d71c19FcA39226dB734025d11B00E";
  const myTestWalletAddress = "0x5d3Cd01f5f1646cd52ccb00edeFF5f3943e7F60d";
  const amountToMintHumanReadable = "1000000";
  const decimals = 6;
  const amountInSmallestUnit = hre.ethers.parseUnits(amountToMintHumanReadable, decimals);

  if (mockUSDCDeployedAddress === "PASTE_YOUR_DEPLOYED_MOCK_USDC_ADDRESS_HERE" || mockUSDCDeployedAddress === "") {
    console.error("Error: mockUSDCDeployedAddress is not set in scripts/mintMyWallet.js");
    process.exit(1);
  }

  const [ownerSigner] = await hre.ethers.getSigners();

  if (!ownerSigner) {
    console.error("Could not get ownerSigner. Check .env PRIVATE_KEY and hardhat.config.js");
    process.exit(1);
  }
  console.log("Using signer account:", ownerSigner.address);
  console.log("Signer balance:", (await hre.ethers.provider.getBalance(ownerSigner.address)).toString());

  // Get the contract ABI (Interface)
  const MockUSDCArtifact = await hre.artifacts.readArtifact("MockUSDC");
  const mockUSDCInterface = new hre.ethers.Interface(MockUSDCArtifact.abi);

  // Encode the function data for the mint call
  const mintFunctionData = mockUSDCInterface.encodeFunctionData("mint", [
    myTestWalletAddress, // to
    amountInSmallestUnit // amount
  ]);

  console.log(`Attempting to mint ${amountToMintHumanReadable} MockUSDC to ${myTestWalletAddress} via raw transaction...`);

  try {
    const tx = await ownerSigner.sendTransaction({
      to: mockUSDCDeployedAddress,
      data: mintFunctionData,
      // gasLimit: ethers.utils.hexlify(100000) // Optional: set gas limit if needed
    });

    console.log("Mint transaction sent, waiting for confirmation... Tx hash:", tx.hash);
    await tx.wait();
    console.log("Tokens minted successfully!");

    // Verify balance (optional, requires contract instance)
    const MockUSDC = await hre.ethers.getContractAt("MockUSDC", mockUSDCDeployedAddress, ownerSigner);
    const balance = await MockUSDC.balanceOf(myTestWalletAddress);
    console.log(`New MockUSDC balance for ${myTestWalletAddress}: ${hre.ethers.formatUnits(balance, decimals)}`);

  } catch (error) {
    console.error("Error during minting process:", error);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    console.error(`Make sure the signer account (${ownerSigner.address}) has minting permissions and enough ETH for gas.`);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error in main:", error);
    process.exit(1);
  }); 