# Base Carbon Canopy

**Base Carbon Canopy** is a decentralized platform for trading tokenized carbon credits in the voluntary carbon market (VCM), built on the **Base Sepolia testnet** for the **Base Build India Hackathon** (Stablecoins track). It leverages **mock USDC** as the sole medium for peer-to-peer transactions, ensuring stable, low-cost trading. The platform features a **React DApp** with a **Leaflet.js map** to visualize projects, **AutoML-driven Impact Score analysis** for projects, and a **1% fee** mechanism, addressing VCM issues like opacity, high costs, and accessibility barriers. Aligned with **SDGs 13 (Climate Action), 9 (Industry, Innovation), and 10 (Reduced Inequality)**, it empowers small-scale projects in India.

## Problem Addressed

The VCM suffers from:
- **Opacity & Fragmentation**: Lack of transparency and siloed standards erode trust.
- **High Costs**: Intermediary fees (20–30%) reduce project funding.
- **Accessibility Barriers**: Small projects and buyers face complex, costly processes.
- **Liquidity Issues**: Slow settlements and double-counting risks hinder trading.

**Base Carbon Canopy** solves these by offering a transparent, low-cost (1% fee), and accessible platform with instant settlements, AutoML-driven Impact Score analysis, and on-chain retirement to prevent double-counting, prioritizing Indian projects.

## Features
- **Tokenized Carbon Credits**: ERC-1155 tokens on Base Sepolia for transparent trading and retirement.
- **Stablecoin Payments**: Mock USDC ensures stable, predictable transactions.
- **Interactive Map**: Leaflet.js displays 5–10 Indian projects (e.g., Rajasthan reforestation).
- **Impact Score Analysis**: AutoML (Keras) generates Impact Scores for projects, offering insights into their potential.
- **Low Fees**: 1% fee in mock USDC, maximizing funds for projects.
- **User-Friendly DApp**: React interface with MetaMask for easy access.

## Application Preview / Screenshots

![Homescreen](frontend/public/basecarboncanopyhome.png)

![Map](frontend/public/bcc3.png)

![Trading](frontend/public/bcctrade.png)

![Impact Scores](frontend/public/bcc4.png)

![Architecture](frontend/public/bccarch.png)

## Technologies
- **Solidity**: Smart contracts for ERC-1155 credits and mock USDC.
- **React**: Frontend DApp for trading and visualization.
- **OpenZeppelin**: Secure ERC-1155/ERC-20 templates.
- **ethers.js**: Blockchain interactions in the DApp.
- **Leaflet.js**: Interactive project map.
- **Hardhat**: Contract development and deployment.
- **Base Sepolia**: Layer-2 testnet for low-cost transactions.
- **Keras (via TensorFlow)**: AutoML for Impact Score generation.
- **Python/pandas/scikit-learn**: Data preprocessing for AutoML.
- **Tailwind CSS**: Responsive DApp styling.
- **Chart.js**: Impact Score visualization.
- **Vercel**: DApp hosting.
- **Google Colab**: AutoML training.

## Getting Started

### Prerequisites
- **Node.js** (v18+), **pnpm** (install with `npm install -g pnpm`)
- **Python** (3.8+), **pip**
- **MetaMask** with Base Sepolia ETH (via faucet: e.g., Alchemy's Base Sepolia faucet)
- **Vercel** account
- **Google Colab** account (optional, for re-training model)

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/S1056SAR/Base-Carbon-Canopy.git
   cd Base-Carbon-Canopy
   ```

2. **Set Up Blockchain (Backend)**:
   - Navigate to the project root (if not already there).
   - Install Hardhat dependencies: `pnpm install` (this should install all workspace dependencies, including backend)
   - Create a `.env` file in the project root (next to `hardhat.config.js`) and add your `BASE_SEPOLIA_RPC_URL` and `PRIVATE_KEY`. Example:
     ```
     BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
     PRIVATE_KEY="your_metamask_private_key"
     ```
   - Deploy contracts: `npx hardhat run scripts/deploy.js --network baseSepolia`
   - **Important**: Note the deployed `CarbonCredit` and `MockUSDC` contract addresses. You will need to update these in `frontend/context/web3-context.tsx`.

3. **Set Up AutoML (Impact Scorer)**:
   - Navigate to the `automl` directory: `cd automl`
   - Install Python dependencies: `pip install pandas tensorflow scikit-learn` (Note: `autokeras` was replaced with a manual Keras model, `tensorflow` is the core dependency).
   - The pre-generated `impact_scores.json` is already included in `frontend/public/data/`.
   - To re-run the Impact Score generation (optional):
     - Ensure your dataset (e.g., `GSF Registry Projects Export 2025-05-12.csv`) is in the `automl` directory.
     - Run the script: `python impact_scorer.py`
     - Copy the newly generated `automl/impact_scores.json` to `frontend/public/data/impact_scores.json`.

4. **Set Up Frontend**:
   - Navigate to the `frontend` directory: `cd frontend` (if you are in the `automl` directory, you might need `cd ../frontend`).
   - If you haven't already, install frontend dependencies: `pnpm install` (if you ran `pnpm install` in the root, this might already be done).
   - **Crucial**: Update the placeholder contract addresses in `frontend/context/web3-context.tsx` with the addresses you noted after deploying the contracts.
   - Start DApp: `pnpm run dev`
   - The DApp should be accessible at `http://localhost:3000`.
   - To deploy to Vercel: Push your updated code (especially the contract addresses) to a Git repository and link it to Vercel.

### Usage
- Connect MetaMask to Base Sepolia.
- Access the DApp (local or Vercel URL).
- Buy/Retire credits using mock USDC.
- View projects on the Leaflet.js map.
- Check project Impact Scores in the dashboard.

## Contributing
Contributions are welcome! To contribute:
1. Fork the repo.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request.

## License
MIT License

## Contact
For inquiries, reach out via the hackathon platform or GitHub issues.
