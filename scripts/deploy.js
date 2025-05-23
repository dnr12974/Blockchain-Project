const hre = require("hardhat");
const { ethers } = hre;

// Helper to convert USDC amounts (6 decimals) to smallest unit
function usdc(amount) {
    return ethers.parseUnits(amount.toString(), 6);
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy(deployer.address);
    await mockUSDC.waitForDeployment();
    console.log("MockUSDC deployed to:", await mockUSDC.getAddress());

    // Deploy CarbonCredit
    const CarbonCredit = await ethers.getContractFactory("CarbonCredit");
    const carbonCredit = await CarbonCredit.deploy(
        await mockUSDC.getAddress(),
        deployer.address,
        1 // 1% fee
    );
    await carbonCredit.waitForDeployment();
    console.log("CarbonCredit deployed to:", await carbonCredit.getAddress());

    // Mint some mock USDC for testing
    const mintAmount = ethers.parseUnits("1000000", 6); // 1 million mUSDC
    await mockUSDC.mint(deployer.address, mintAmount);
    console.log("Minted", ethers.formatUnits(mintAmount, 6), "mUSDC to", deployer.address);

    // Create some initial projects
    const projects = [
        {
            name: "Kenya Reforestation",
            location: "Kenya",
            initialSupply: 1000,
            pricePerTon: ethers.parseUnits("10.50", 6)
        },
        {
            name: "India Methane Capture",
            location: "India",
            initialSupply: 500,
            pricePerTon: ethers.parseUnits("15.75", 6)
        }
    ];

    for (const project of projects) {
        const tx = await carbonCredit.mintNewProject(
            project.name,
            project.location,
            project.initialSupply,
            project.pricePerTon,
            deployer.address
        );
        await tx.wait();
        console.log("Created project:", project.name);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 