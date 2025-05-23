// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CarbonCredit
 * @dev ERC1155 contract for tokenizing carbon credits from various projects.
 * Each token ID represents a different carbon offset project.
 * Includes functionality for minting, trading (with mock USDC), and retiring credits.
 */
contract CarbonCredit is ERC1155, Ownable {
    // Mock USDC contract address - will be set in the constructor
    IERC20 public immutable mockUSDC;

    // Fee percentage (e.g., 1 for 1%)
    uint256 public tradingFeePercentage; // 1% = 1

    // Mapping to store project metadata (kept simple for hackathon)
    // projectId => ProjectInfo
    struct ProjectInfo {
        string name;
        string location; // e.g., "Kenya" or specific coordinates as string
        uint256 totalTons; // Initial amount minted
        uint256 pricePerTon;
    }
    mapping(uint256 => ProjectInfo) public projectInfo;
    uint256 public nextProjectId; // Counter for new projects

    // Events
    event ProjectCreated(uint256 indexed projectId, string name, string location, uint256 totalTons, uint256 pricePerTon);
    event CreditTraded(uint256 indexed projectId, uint256 amount, uint256 pricePerTon, address indexed seller, address indexed buyer);
    event CreditRetired(uint256 indexed projectId, uint256 amount, address indexed owner);

    /**
     * @dev Constructor initializes the contract, sets the owner, mock USDC address, and trading fee.
     * @param _mockUsdcAddress The address of the mock USDC ERC20 token contract.
     * @param _initialOwner The address that will own the contract.
     * @param _feePercentage The percentage fee for trades (e.g., 1 for 1%).
     */
    constructor(address _mockUsdcAddress, address _initialOwner, uint256 _feePercentage) ERC1155("") Ownable(_initialOwner) {
        require(_mockUsdcAddress != address(0), "CarbonCredit: Invalid mock USDC address");
        mockUSDC = IERC20(_mockUsdcAddress);
        tradingFeePercentage = _feePercentage;
    }

    // --- URI Management (Placeholder) ---
    /**
     * @dev Returns the URI for a given token ID. For the hackathon, returns a static base URI.
     * A more robust implementation would point to decentralized storage (e.g., IPFS).
     */
    function uri(uint256 /*_id*/) public view override returns (string memory) {
        // In a real application, this would return metadata URL like ipfs://<hash>/{id}.json
        // For hackathon, return empty or a placeholder base URI
        return "https://api.basecarboncanopy.example/metadata/{id}.json"; // Placeholder
    }

    // --- Minting Function (Owner only) ---
    /**
     * @dev Mints new carbon credit tokens for a new project. Only callable by the owner.
     * @param _name Name of the carbon offset project.
     * @param _location Location of the project.
     * @param _initialSupply Total number of carbon credits (tons) to mint for this project.
     * @param _pricePerTon The price per ton of the carbon credits.
     * @param _to Address to mint the initial supply to (usually the project owner or a treasury).
     */
    function mintNewProject(
        string memory _name,
        string memory _location,
        uint256 _initialSupply,
        uint256 _pricePerTon,
        address _to
    ) public onlyOwner {
        require(_initialSupply > 0, "CarbonCredit: Initial supply must be greater than zero");
        require(_to != address(0), "CarbonCredit: Invalid address to mint to");
        require(_pricePerTon > 0, "CarbonCredit: Price per ton must be greater than zero");

        uint256 projectId = nextProjectId;
        projectInfo[projectId] = ProjectInfo({
            name: _name,
            location: _location,
            totalTons: _initialSupply,
            pricePerTon: _pricePerTon
        });

        // Mint the ERC1155 tokens. The projectId is used as the token ID.
        // Data field is empty for this basic implementation.
        _mint(_to, projectId, _initialSupply, "");

        emit ProjectCreated(projectId, _name, _location, _initialSupply, _pricePerTon);

        nextProjectId++;
    }

    // --- Trading Function ---
    /**
     * @dev Allows a buyer to purchase carbon credits from a seller.
     * The seller must have approved this contract to transfer their tokens (setApprovalForAll).
     * The buyer must have approved this contract to spend their mockUSDC.
     * @param _projectId The ID of the project/token to buy.
     * @param _amount The number of tokens to buy.
     * @param _seller The address of the seller.
     */
    function buyCredits(
        uint256 _projectId,
        uint256 _amount,
        address _seller
    ) public {
        require(_seller != address(0), "CarbonCredit: Invalid seller address");
        // require(_seller != msg.sender, "CarbonCredit: Buyer cannot be the seller"); // TEMPORARILY DISABLED FOR LOCAL TESTING
        require(_amount > 0, "CarbonCredit: Amount must be greater than zero");
        require(projectInfo[_projectId].totalTons > 0, "CarbonCredit: Project does not exist");

        uint256 pricePerTon = projectInfo[_projectId].pricePerTon;
        uint256 totalCost = _amount * pricePerTon;
        uint256 fee = (totalCost * tradingFeePercentage) / 100;
        uint256 amountToSeller = totalCost - fee;

        require(
            mockUSDC.allowance(msg.sender, address(this)) >= totalCost,
            "CarbonCredit: Insufficient USDC allowance"
        );
        require(
            mockUSDC.balanceOf(msg.sender) >= totalCost,
            "CarbonCredit: Insufficient USDC balance"
        );
        require(
            balanceOf(_seller, _projectId) >= _amount,
            "CarbonCredit: Seller has insufficient credits"
        );

        // Transfer USDC
        require(
            mockUSDC.transferFrom(msg.sender, _seller, amountToSeller),
            "CarbonCredit: USDC transfer to seller failed"
        );
        require(
            mockUSDC.transferFrom(msg.sender, owner(), fee),
            "CarbonCredit: USDC fee transfer failed"
        );

        // Transfer Carbon Credits: seller -> buyer
        // Requires seller to have called setApprovalForAll(address(this), true)
        // We call the public safeTransferFrom, which ensures the approval check is done.
        // The contract itself (address(this)) needs to be approved by the seller.
        this.safeTransferFrom(_seller, msg.sender, _projectId, _amount, "");

        emit CreditTraded(_projectId, _amount, pricePerTon, _seller, msg.sender);
    }

    // --- Retirement Function ---
    /**
     * @dev Retires (burns) a specified amount of carbon credits for a given project ID.
     * Only the owner of the tokens can retire them.
     * @param _projectId The ID of the project/token to retire.
     * @param _amount The number of tokens to retire.
     */
    function retireCredits(uint256 _projectId, uint256 _amount) public {
        require(_amount > 0, "CarbonCredit: Amount must be greater than zero");
        require(
            balanceOf(msg.sender, _projectId) >= _amount,
            "CarbonCredit: Insufficient credits to retire"
        );

        _burn(msg.sender, _projectId, _amount);

        emit CreditRetired(_projectId, _amount, msg.sender);
    }

    // --- Helper Functions ---
    /**
     * @dev Calculates the fee amount for a trade.
     * @param _totalAmount The total value of the trade in mock USDC.
     * @return The fee amount.
     */
    function _calculateFee(uint256 _totalAmount) internal view returns (uint256) {
        return (_totalAmount * tradingFeePercentage) / 100;
    }

    /**
     * @dev Allows a buyer to get project information.
     * @param _projectId The ID of the project to get information about.
     * @return name The project name
     * @return location The project location
     * @return totalTons The total tons of carbon credits
     * @return pricePerTon The price per ton in USDC
     */
    function getProjectInfo(uint256 _projectId) public view returns (
        string memory name,
        string memory location,
        uint256 totalTons,
        uint256 pricePerTon
    ) {
        ProjectInfo memory info = projectInfo[_projectId];
        return (info.name, info.location, info.totalTons, info.pricePerTon);
    }

    // TODO: Implement view functions if needed (e.g., getProjectInfo)

} 