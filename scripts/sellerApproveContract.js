const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    // Ensure this script is run with the SELLER's private key in .env or your Hardhat config
    const [sellerSigner] = await ethers.getSigners();
    const sellerAddress = sellerSigner.address;

    console.log(`Seller account (${sellerAddress}) will attempt to approve the CarbonCredit contract.`);

    // Get the deployed CarbonCredit contract address (replace if necessary, but should be from deploy script output)
    // This should be the same address as in your frontend/lib/config.ts
    const carbonCreditContractAddress = "0x8D2c0337E3096147A6Bab9664118f88CaB3EFb46"; 
    // The operator is the CarbonCredit contract itself, allowing it to manage the seller's tokens
    const operatorAddress = carbonCreditContractAddress; 

    if (!ethers.isAddress(carbonCreditContractAddress)) {
        console.error("Invalid CarbonCredit contract address provided.");
        process.exit(1);
    }

    console.log(`Using CarbonCredit contract at: ${carbonCreditContractAddress}`);
    console.log(`Seller (${sellerAddress}) will approve operator (${operatorAddress}) for all token operations.`);

    const CarbonCreditFactory = await ethers.getContractFactory("CarbonCredit");
    const carbonCredit = CarbonCreditFactory.attach(carbonCreditContractAddress);

    try {
        // Check current approval status (optional, good for debugging)
        const isApproved = await carbonCredit.isApprovedForAll(sellerAddress, operatorAddress);
        console.log(`Current approval status for ${operatorAddress}: ${isApproved}`);

        if (isApproved) {
            console.log("Operator is already approved. No action needed.");
        } else {
            console.log("Sending setApprovalForAll transaction...");
            const tx = await carbonCredit.connect(sellerSigner).setApprovalForAll(operatorAddress, true);
            console.log("Transaction sent, waiting for confirmation...");
            await tx.wait();
            console.log("Transaction confirmed!");
            console.log(`Seller ${sellerAddress} has approved the CarbonCredit contract (${operatorAddress}) to manage their tokens.`);
            
            const newIsApproved = await carbonCredit.isApprovedForAll(sellerAddress, operatorAddress);
            console.log(`New approval status for ${operatorAddress}: ${newIsApproved}`);
        }
    } catch (error) {
        console.error("Error during setApprovalForAll operation:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 