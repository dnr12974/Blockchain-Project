const { expect } = require("chai");
const { ethers } = require("hardhat");

// Helper to convert USDC amounts (6 decimals) to smallest unit
function usdc(amount) {
    return ethers.parseUnits(amount.toString(), 6);
}

// Helper to convert standard 18 decimal tokens to smallest unit (if needed for other tokens)
// function tokens(amount) {
//     return ethers.parseUnits(amount.toString(), 18);
// }

describe("CarbonCanopy Contracts", function () {
    let deployer, owner, user1, user2, user3;
    let mockUSDC, carbonCredit;
    const tradingFeePercentage = 1; // 1%

    beforeEach(async function () {
        // Get signers
        [deployer, owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDCFactory = await ethers.getContractFactory("MockUSDC", deployer);
        mockUSDC = await MockUSDCFactory.deploy(owner.address); // Owner of MockUSDC is 'owner'
        await mockUSDC.waitForDeployment();

        // Deploy CarbonCredit
        const CarbonCreditFactory = await ethers.getContractFactory("CarbonCredit", deployer);
        carbonCredit = await CarbonCreditFactory.deploy(
            await mockUSDC.getAddress(),
            owner.address, // Owner of CarbonCredit is 'owner'
            tradingFeePercentage
        );
        await carbonCredit.waitForDeployment();
    });

    describe("MockUSDC Deployment & Basic Functions", function () {
        it("Should have correct name, symbol, and decimals", async function () {
            expect(await mockUSDC.name()).to.equal("Mock USDC");
            expect(await mockUSDC.symbol()).to.equal("mUSDC");
            expect(await mockUSDC.decimals()).to.equal(6);
        });

        it("Should allow owner to mint mUSDC", async function () {
            const mintAmount = usdc(1000);
            await mockUSDC.connect(owner).mint(user1.address, mintAmount);
            expect(await mockUSDC.balanceOf(user1.address)).to.equal(mintAmount);
        });

        it("Should not allow non-owner to mint mUSDC", async function () {
            const mintAmount = usdc(1000);
            await expect(mockUSDC.connect(user1).mint(user2.address, mintAmount))
                .to.be.revertedWithCustomError(mockUSDC, "OwnableUnauthorizedAccount").withArgs(user1.address);
        });

        it("Should allow transfers and approvals", async function () {
            const mintAmount = usdc(100);
            await mockUSDC.connect(owner).mint(user1.address, mintAmount);

            // Transfer
            const transferAmount = usdc(50);
            await mockUSDC.connect(user1).transfer(user2.address, transferAmount);
            expect(await mockUSDC.balanceOf(user2.address)).to.equal(transferAmount);
            expect(await mockUSDC.balanceOf(user1.address)).to.equal(mintAmount - transferAmount);

            // Approve and transferFrom
            const approveAmount = usdc(20);
            await mockUSDC.connect(user1).approve(user3.address, approveAmount);
            expect(await mockUSDC.allowance(user1.address, user3.address)).to.equal(approveAmount);
            await mockUSDC.connect(user3).transferFrom(user1.address, user2.address, approveAmount);
            expect(await mockUSDC.balanceOf(user2.address)).to.equal(transferAmount + approveAmount);
        });
    });

    // More test suites for CarbonCredit will follow
    describe("CarbonCredit: Project Minting", function () {
        const projectName = "Kenya Reforestation";
        const projectLocation = "Kenya";
        const initialSupply = 1000; // 1000 tons
        const projectId = 0;

        it("Should allow owner to mint a new project", async function () {
            // Owner mints project 0 to user1
            await expect(carbonCredit.connect(owner).mintNewProject(projectName, projectLocation, initialSupply, user1.address))
                .to.emit(carbonCredit, "ProjectCreated")
                .withArgs(projectId, projectName, projectLocation, initialSupply);

            // Check project info
            const info = await carbonCredit.projectInfo(projectId);
            expect(info.name).to.equal(projectName);
            expect(info.location).to.equal(projectLocation);
            expect(info.totalTons).to.equal(initialSupply);

            // Check balance
            expect(await carbonCredit.balanceOf(user1.address, projectId)).to.equal(initialSupply);

            // Check next project ID
            expect(await carbonCredit.nextProjectId()).to.equal(1);
        });

        it("Should not allow non-owner to mint a new project", async function () {
            await expect(carbonCredit.connect(user1).mintNewProject(projectName, projectLocation, initialSupply, user2.address))
                .to.be.revertedWithCustomError(carbonCredit, "OwnableUnauthorizedAccount").withArgs(user1.address);
        });

        it("Should require initial supply > 0", async function () {
            await expect(carbonCredit.connect(owner).mintNewProject(projectName, projectLocation, 0, user1.address))
                .to.be.revertedWith("CarbonCredit: Initial supply must be greater than zero");
        });

        it("Should require a valid recipient address", async function () {
            await expect(carbonCredit.connect(owner).mintNewProject(projectName, projectLocation, initialSupply, ethers.ZeroAddress))
                .to.be.revertedWith("CarbonCredit: Invalid address to mint to");
        });
    });

    describe("CarbonCredit: Trading (buyCredits)", function () {
        const projectId = 0;
        const initialSupply = 1000; // User1 (seller) starts with 1000 credits
        const pricePerTon = usdc(10); // $10 per credit/ton (in smallest mUSDC unit)
        const buyerInitialUSDC = usdc(5000); // User2 (buyer) starts with 5000 mUSDC

        beforeEach(async function () {
            // 1. Owner mints project 0 credits to user1 (seller)
            await carbonCredit.connect(owner).mintNewProject("Test Project", "Test Location", initialSupply, user1.address);

            // 2. Owner mints mockUSDC to user2 (buyer)
            await mockUSDC.connect(owner).mint(user2.address, buyerInitialUSDC);

            // 3. Seller (user1) approves CarbonCredit contract to manage their tokens
            await carbonCredit.connect(user1).setApprovalForAll(await carbonCredit.getAddress(), true);

            // 4. Buyer (user2) approves CarbonCredit contract to spend their mockUSDC
            // Approve for a large amount to cover multiple potential test buys
            await mockUSDC.connect(user2).approve(await carbonCredit.getAddress(), ethers.MaxUint256);
        });

        it("Should allow a user to buy credits successfully", async function () {
            const amountToBuy = 100;
            const totalCost = BigInt(amountToBuy) * BigInt(pricePerTon);
            const fee = (totalCost * BigInt(tradingFeePercentage)) / 100n;
            const amountToSeller = totalCost - fee;

            const ownerInitialBalance = await mockUSDC.balanceOf(owner.address);
            const sellerInitialBalance = await mockUSDC.balanceOf(user1.address);

            await expect(carbonCredit.connect(user2).buyCredits(projectId, amountToBuy, pricePerTon, user1.address))
                .to.emit(carbonCredit, "CreditTraded")
                .withArgs(projectId, amountToBuy, pricePerTon, user1.address, user2.address);

            // Check balances after trade
            // Seller (user1)
            expect(await carbonCredit.balanceOf(user1.address, projectId)).to.equal(initialSupply - amountToBuy);
            expect(await mockUSDC.balanceOf(user1.address)).to.equal(sellerInitialBalance + amountToSeller);

            // Buyer (user2)
            expect(await carbonCredit.balanceOf(user2.address, projectId)).to.equal(amountToBuy);
            expect(await mockUSDC.balanceOf(user2.address)).to.equal(buyerInitialUSDC - totalCost);

            // Owner (fee receiver)
            expect(await mockUSDC.balanceOf(owner.address)).to.equal(ownerInitialBalance + fee);
        });

        it("Should fail if seller has insufficient credits", async function () {
            const amountToBuy = initialSupply + 1; // More than seller owns
            await expect(carbonCredit.connect(user2).buyCredits(projectId, amountToBuy, pricePerTon, user1.address))
                .to.be.revertedWith("CarbonCredit: Seller has insufficient balance");
        });

        it("Should fail if buyer has insufficient mUSDC balance", async function () {
            const highPrice = usdc(10000); // Price higher than buyer's balance
            const amountToBuy = 1;
            await expect(carbonCredit.connect(user2).buyCredits(projectId, amountToBuy, highPrice, user1.address))
                .to.be.revertedWith("CarbonCredit: Buyer has insufficient USDC balance"); // Or ERC20InsufficientBalance if checked first
        });

        it("Should fail if buyer has insufficient mUSDC allowance", async function () {
            // Reset allowance to be less than required
            const amountToBuy = 10;
            const requiredAllowance = BigInt(amountToBuy) * BigInt(pricePerTon);
            await mockUSDC.connect(user2).approve(await carbonCredit.getAddress(), requiredAllowance - 1n);

            await expect(carbonCredit.connect(user2).buyCredits(projectId, amountToBuy, pricePerTon, user1.address))
                .to.be.revertedWith("CarbonCredit: Check USDC allowance for buyer"); // Or ERC20InsufficientAllowance
        });

        it("Should fail if buyer tries to buy from themselves", async function () {
            const amountToBuy = 10;
            // User1 tries to buy from User1
            await expect(carbonCredit.connect(user1).buyCredits(projectId, amountToBuy, pricePerTon, user1.address))
                .to.be.revertedWith("CarbonCredit: Buyer cannot be the seller");
        });

        it("Should fail if amount is zero", async function () {
            await expect(carbonCredit.connect(user2).buyCredits(projectId, 0, pricePerTon, user1.address))
                .to.be.revertedWith("CarbonCredit: Amount must be greater than zero");
        });

        it("Should fail if seller did not approve the contract", async function (){
            // User3 is seller, has credits, but did NOT approve contract
            const supplyForUser3 = 50;
            await carbonCredit.connect(owner).mintNewProject("Project B", "Location B", supplyForUser3, user3.address);
            const projectIdUser3 = 1; // Second project

             // Buyer (user2) has USDC and allowance

             // Log approval status
             const isApproved = await carbonCredit.isApprovedForAll(user3.address, await carbonCredit.getAddress());
             console.log(`      DEBUG: Is user3 approved for CarbonCredit contract? ${isApproved}`);

             await expect(carbonCredit.connect(user2).buyCredits(projectIdUser3, 10, pricePerTon, user3.address))
                 .to.be.revertedWithCustomError(carbonCredit, "ERC1155MissingApprovalForAll"); // More specific revert check
        });
    });

    describe("CarbonCredit: Retiring Credits", function () {
        const projectId = 0;
        const initialSupply = 500;

        beforeEach(async function () {
            // Mint credits to user1 who will retire them
            await carbonCredit.connect(owner).mintNewProject("Retire Project", "Location R", initialSupply, user1.address);
        });

        it("Should allow a token holder to retire their credits", async function () {
            const amountToRetire = 100;
            await expect(carbonCredit.connect(user1).retireCredits(projectId, amountToRetire))
                .to.emit(carbonCredit, "CreditRetired")
                .withArgs(projectId, amountToRetire, user1.address);

            // Check balance after retirement
            expect(await carbonCredit.balanceOf(user1.address, projectId)).to.equal(initialSupply - amountToRetire);
        });

        it("Should fail if trying to retire zero credits", async function () {
            await expect(carbonCredit.connect(user1).retireCredits(projectId, 0))
                .to.be.revertedWith("CarbonCredit: Amount must be greater than zero");
        });

        it("Should fail if trying to retire more credits than owned", async function () {
            const amountToRetire = initialSupply + 1;
            await expect(carbonCredit.connect(user1).retireCredits(projectId, amountToRetire))
                .to.be.reverted; // ERC1155InsufficientBalance expected
        });

        it("Should fail if retiring credits not owned", async function () {
            const amountToRetire = 50;
            // user2 attempts to retire user1's credits
            await expect(carbonCredit.connect(user2).retireCredits(projectId, amountToRetire))
                .to.be.reverted; // ERC1155InsufficientBalance expected
        });
    });

    describe("CarbonCredit: URI Management", function () {
        it("Should return the placeholder URI", async function () {
            const projectId = 0;
            // Need to mint a project first for the URI to be potentially relevant, although our implementation is static
            await carbonCredit.connect(owner).mintNewProject("URI Test", "Location U", 100, owner.address);
            expect(await carbonCredit.uri(projectId)).to.equal("https://api.basecarboncanopy.example/metadata/{id}.json");
        });
    });
}); 