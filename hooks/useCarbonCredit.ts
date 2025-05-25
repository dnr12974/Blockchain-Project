import { useState, useEffect, useCallback } from 'react';
import { ethers, Contract, BigNumberish, formatUnits, Interface } from 'ethers';
import { CARBON_CREDIT_CONTRACT_ADDRESS, MOCK_USDC_CONTRACT_ADDRESS, BASE_SEPOLIA_CHAIN_ID } from '../lib/config';
import CarbonCreditAbiJson from '../abis/CarbonCredit.json'; // Assuming this is the raw JSON
import MockUsdcAbiJson from '../abis/MockUSDC.json'; // Added MockUSDC ABI
import { Project, TokenBalance, CombinedEvent, TradeEvent, RetireEvent } from '../lib/types';
import projectsData from '@/public/data/projects.json'; // Use alias path

// Placeholder for useWallet hook - replace with your actual wallet hook
interface WalletState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}
const useWallet = (): WalletState => {
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null, signer: null, address: null, isConnected: false, chainId: null,
  });

  useEffect(() => {
    console.log("[useWallet - CarbonCredit] useEffect triggered");
    let mounted = true;

    const getWalletData = async (currentProvider: ethers.BrowserProvider) => {
      if (!mounted) return;
      console.log("[useWallet - CarbonCredit] getWalletData called");
      try {
        const currentAccounts = walletState.address ? [walletState.address] : await currentProvider.send("eth_requestAccounts", []);
        console.log("[useWallet - CarbonCredit] Accounts:", currentAccounts);

        if (currentAccounts.length > 0) {
          const signer = await currentProvider.getSigner();
          const network = await currentProvider.getNetwork();
          if (!mounted) return;
          console.log("[useWallet - CarbonCredit] Signer:", !!signer, "Address:", currentAccounts[0], "Network:", network.chainId);
          setWalletState({
            provider: currentProvider,
            signer,
            address: currentAccounts[0],
            isConnected: true,
            chainId: Number(network.chainId),
          });
        } else {
          if (!mounted) return;
          console.log("[useWallet - CarbonCredit] No accounts found");
          setWalletState({ provider: null, signer: null, address: null, isConnected: false, chainId: walletState.chainId });
        }
      } catch (err) {
        if (!mounted) return;
        console.error("[useWallet - CarbonCredit] Error in getWalletData:", err);
        setWalletState(prev => ({ ...prev, isConnected: false, signer: null, address: null, provider: null }));
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (!mounted) return;
      console.log("[useWallet - CarbonCredit] accountsChanged event (via window.ethereum):", accounts);
      if (window.ethereum) {
          const eventProvider = new ethers.BrowserProvider(window.ethereum);
          getWalletData(eventProvider);
      }
    };

    const handleChainChanged = (newChainIdHex: string) => {
      if (!mounted) return;
      console.log("[useWallet - CarbonCredit] chainChanged event (via window.ethereum), newChainIdHex:", newChainIdHex);
      if (window.ethereum) {
          const eventProvider = new ethers.BrowserProvider(window.ethereum);
          getWalletData(eventProvider);
      }
    };

    if (typeof window.ethereum !== 'undefined') {
      const initialProvider = new ethers.BrowserProvider(window.ethereum);
      getWalletData(initialProvider);
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } else {
      console.log('[useWallet - CarbonCredit] MetaMask is not installed!');
    }

    return () => {
      mounted = false;
      if (typeof window.ethereum !== 'undefined' && window.ethereum.removeListener) {
        console.log("[useWallet - CarbonCredit] Cleaning up EIP-1193 event listeners");
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);
  return walletState;
};
// End placeholder for useWallet hook

const CarbonCreditInterface = new Interface(CarbonCreditAbiJson); // Assuming CarbonCreditAbiJson is directly the ABI array
const MockUsdcInterface = new Interface(MockUsdcAbiJson); // ABI is direct array

export const useCarbonCredit = () => {
  const { signer, address, provider, chainId, isConnected } = useWallet();
  const [carbonContract, setCarbonContract] = useState<Contract | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<CombinedEvent[]>([]);
  const projects: Project[] = projectsData;

  console.log("[useCarbonCredit] Hook init. Signer:", signer, "Address:", address, "ChainID:", chainId, "Provider:", provider, "Connected:", isConnected);

  useEffect(() => {
    console.log("[useCarbonCredit] Contract setup effect. Signer:", signer, "ChainID:", chainId);
    if (signer && chainId === BASE_SEPOLIA_CHAIN_ID && CARBON_CREDIT_CONTRACT_ADDRESS && !CARBON_CREDIT_CONTRACT_ADDRESS.startsWith("0xYOUR")) {
      console.log("[useCarbonCredit] Creating contract instance with address:", CARBON_CREDIT_CONTRACT_ADDRESS);
      const contract = new ethers.Contract(CARBON_CREDIT_CONTRACT_ADDRESS, CarbonCreditInterface, signer);
      setCarbonContract(contract);
      console.log("[useCarbonCredit] Contract instance created:", contract);
    } else {
      console.log("[useCarbonCredit] Conditions not met for contract creation. Signer:", !!signer, "ChainID OK:", chainId === BASE_SEPOLIA_CHAIN_ID, "Address OK:", CARBON_CREDIT_CONTRACT_ADDRESS && !CARBON_CREDIT_CONTRACT_ADDRESS.startsWith("0xYOUR"));
      setCarbonContract(null);
    }
  }, [signer, chainId]);

  const getProjectName = useCallback((projectId: string): string => {
    const project = projects.find(p => p.id.toString() === projectId.toString());
    return project ? project.name : 'Unknown Project';
  }, [projects]);

  const fetchTokenBalances = useCallback(async () => {
    console.log("[useCarbonCredit] fetchTokenBalances called. Contract:", carbonContract, "Address:", address, "Projects Count:", projects.length);
    if (carbonContract && address && projects.length > 0) {
      try {
        const balancesPromises = projects.map(async (project) => {
          console.log(`[useCarbonCredit] Fetching balance for project ID: ${project.id}`);
          const balanceBn = await carbonContract.balanceOf(address, project.id); 
          console.log(`[useCarbonCredit] Raw balance for project ID ${project.id}:`, balanceBn?.toString());
          return {
            projectId: project.id.toString(),
            projectName: project.name,
            amount: formatUnits(balanceBn, 0), 
          };
        });
        const resolvedBalances: TokenBalance[] = await Promise.all(balancesPromises);
        console.log("[useCarbonCredit] Resolved balances:", resolvedBalances);
        setTokenBalances(resolvedBalances.filter(b => parseInt(b.amount) > 0));
      } catch (error) {
        console.error("[useCarbonCredit] Error fetching token balances:", error);
        setTokenBalances([]);
      }
    }
     else {
      console.log("[useCarbonCredit] fetchTokenBalances conditions not met.");
    }
  }, [carbonContract, address, projects]); // Removed getProjectName as it's not directly used here, but used in event processing

  useEffect(() => {
    console.log("[useCarbonCredit] Balance fetching effect. Contract:", !!carbonContract, "Address:", address);
    if (carbonContract && address) {
      fetchTokenBalances();
    }
  }, [carbonContract, address, fetchTokenBalances]);

  // Internal function to execute the actual buyCredits call on the smart contract
  const executeBuyCreditsOnContract = useCallback(async (
    projectId: string,
    amount: BigNumberish,
    pricePerTon: BigNumberish, // Price in smallest unit of mUSDC
    sellerAddress: string
  ) => {
    console.log("[useCarbonCredit] executeBuyCreditsOnContract called. ProjectID:", projectId, "Amount:", amount.toString(), "Price:", pricePerTon.toString(), "Seller:", sellerAddress);
    if (!carbonContract || !signer) {
      console.error("[useCarbonCredit] executeBuyCreditsOnContract error: Contract or signer not available.");
      throw new Error("Carbon Contract or signer not available");
    }
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      console.error("[useCarbonCredit] executeBuyCreditsOnContract error: Wrong network.");
      throw new Error("Wrong network.");
    }
    try {
      // Ensure all parameters are correctly passed to the contract's buyCredits function
      const tx = await carbonContract.buyCredits(projectId, amount, pricePerTon, sellerAddress);
      console.log("[useCarbonCredit] buyCredits transaction sent:", tx.hash);
      await tx.wait();
      console.log('[useCarbonCredit] buyCredits successful:', tx.hash);
      fetchTokenBalances(); 
      // Consider fetching mUSDC balance update here as well
      return tx;
    } catch (error) {
      console.error("[useCarbonCredit] Error in executeBuyCreditsOnContract:", error);
      throw error;
    }
  }, [carbonContract, signer, chainId, fetchTokenBalances]);

  // New function to be called by the UI, handles approval + buy
  const initiateBuyCreditsProcess = useCallback(async (
    projectId: string,
    amountString: string, // Amount as a string from UI input
    pricePerTonString: string, // Price per ton as a string from UI input (e.g., "10.5" for $10.50)
    sellerAddress: string
  ) => {
    if (!signer || !address || !provider || !MOCK_USDC_CONTRACT_ADDRESS || !CARBON_CREDIT_CONTRACT_ADDRESS) {
      console.error("[useCarbonCredit] initiateBuyCreditsProcess error: Missing signer, address, provider, or contract addresses.");
      throw new Error("Wallet not connected or contract addresses not configured.");
    }
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        console.error("[useCarbonCredit] initiateBuyCreditsProcess error: Wrong network.");
        throw new Error("Wrong network. Please connect to Base Sepolia.");
    }

    let mockUsdcDecimals = 6; // Default, can fetch if necessary
    try {
        const mockUsdcContractForDecimals = new ethers.Contract(MOCK_USDC_CONTRACT_ADDRESS, MockUsdcInterface, provider);
        mockUsdcDecimals = await mockUsdcContractForDecimals.decimals();
    } catch (e) {
        console.warn("[useCarbonCredit] Could not fetch mUSDC decimals, defaulting to 6.", e);
    }
    
    const amountBigInt = ethers.parseUnits(amountString, 0); // Assuming carbon credits are whole units (0 decimals for amount)
    const pricePerTonBigInt = ethers.parseUnits(pricePerTonString, mockUsdcDecimals);
    const totalCostBigInt = amountBigInt * pricePerTonBigInt;

    console.log(`[useCarbonCredit] initiateBuyCreditsProcess: projectId=${projectId}, amount=${amountString} (parsed: ${amountBigInt.toString()}), pricePerTon=${pricePerTonString} (parsed: ${pricePerTonBigInt.toString()}), seller=${sellerAddress}, totalCost=${totalCostBigInt.toString()}`);

    try {
      const mockUsdcContract = new ethers.Contract(MOCK_USDC_CONTRACT_ADDRESS, MockUsdcInterface, signer);
      
      console.log(`[useCarbonCredit] Checking mUSDC allowance for spender ${CARBON_CREDIT_CONTRACT_ADDRESS} for amount ${totalCostBigInt.toString()}`);
      const currentAllowance = await mockUsdcContract.allowance(address, CARBON_CREDIT_CONTRACT_ADDRESS);
      console.log(`[useCarbonCredit] Current mUSDC allowance: ${currentAllowance.toString()}`);

      if (currentAllowance < totalCostBigInt) {
        console.log("[useCarbonCredit] Allowance is less than total cost. Requesting approval...");
        const approveTx = await mockUsdcContract.approve(CARBON_CREDIT_CONTRACT_ADDRESS, totalCostBigInt);
        console.log("[useCarbonCredit] mUSDC approval transaction sent:", approveTx.hash);
        await approveTx.wait();
        console.log("[useCarbonCredit] mUSDC approval successful.");
      } else {
        console.log("[useCarbonCredit] Sufficient mUSDC allowance already set.");
      }

      // Proceed to buy
      console.log("[useCarbonCredit] Proceeding to execute buyCredits on CarbonCredit contract.");
      return await executeBuyCreditsOnContract(projectId, amountBigInt, pricePerTonBigInt, sellerAddress);

    } catch (error) {
      console.error("[useCarbonCredit] Error in initiateBuyCreditsProcess:", error);
      throw error; // Rethrow to be caught by UI
    }
  }, [signer, address, provider, chainId, executeBuyCreditsOnContract]);

  // Retire tokens - ensure this function name matches what's used in the contract if different
  const retireCreditsOnContract = useCallback(async (projectId: string, amount: BigNumberish) => { // Renamed from retireTokens
    console.log("[useCarbonCredit] retireCreditsOnContract called. ProjectID:", projectId, "Amount:", amount.toString());
    if (!carbonContract || !signer) {
      console.error("[useCarbonCredit] retireCreditsOnContract error: Contract or signer not available.");
      throw new Error("Carbon Contract or signer not available");
    }
    // ... (rest of retireTokens logic, ensure it calls 'retireCredits' if that's the contract function name)
    try {
      const tx = await carbonContract.retireCredits(projectId, amount); // Assuming contract function is retireCredits
      console.log("[useCarbonCredit] retireCredits transaction sent:", tx.hash);
      await tx.wait();
      // ...
      return tx;
    } catch (error) {
      console.error("[useCarbonCredit] Error retiring credits:", error);
      throw error;
    }
  }, [carbonContract, signer, chainId, fetchTokenBalances]);

  // Event listening logic (keeping it concise for now, can add logs if needed)
  useEffect(() => {
    if (!carbonContract || !provider || chainId !== BASE_SEPOLIA_CHAIN_ID) {
      console.log("[useCarbonCredit] Event listener setup skipped. Conditions not met. Contract:", !!carbonContract, "Provider:", !!provider, "ChainID OK:", chainId === BASE_SEPOLIA_CHAIN_ID);
      return;
    }
    console.log("[useCarbonCredit] Setting up event listeners.");

    const tradeFilter = carbonContract.filters.CreditTraded();
    const retireFilter = carbonContract.filters.CreditRetired();

    const processEvent = (log: any, type: 'Trade' | 'Retire'): CombinedEvent | null => {
      try {
        const parsedLog = CarbonCreditInterface.parseLog(log as any);
        if (!parsedLog) return null;
        const baseEventArgs = {
            projectId: parsedLog.args.projectId.toString(),
            projectName: getProjectName(parsedLog.args.projectId.toString()),
            amount: parsedLog.args.amount,
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: parsedLog.args.timestamp ? Number(parsedLog.args.timestamp) : undefined
        };
        if (type === 'Trade' && parsedLog.name === "CreditTraded") {
            return { ...baseEventArgs, type: 'Trade', buyer: parsedLog.args.buyer, seller: parsedLog.args.seller, price: parsedLog.args.price } as TradeEvent;
        }
        if (type === 'Retire' && parsedLog.name === "CreditRetired") {
            return { ...baseEventArgs, type: 'Retire', owner: parsedLog.args.owner } as RetireEvent;
        }
        return null;
      } catch (e) {
        console.warn("[useCarbonCredit] Could not parse event log: ", e, log);
        return null;
      }
    };

    const listenerCallback = (log: any, type: 'Trade' | 'Retire') => {
        const eventData = processEvent(log, type);
        if (eventData) {
            console.log(`[useCarbonCredit] Received ${type} event:`, eventData);
            setTransactionHistory(prev => [eventData, ...prev].sort((a,b) => (b.blockNumber - a.blockNumber) || ((b.timestamp ?? 0) - (a.timestamp ?? 0)) ));
        }
    };

    const onTrade = (...args: any[]) => listenerCallback(args[args.length - 1].log || args[args.length -1] , 'Trade');
    const onRetire = (...args: any[]) => listenerCallback(args[args.length -1].log || args[args.length -1], 'Retire');

    const fetchPastEvents = async () => {
        console.log("[useCarbonCredit] Fetching past events.");
        try {
            const pastTradeLogs = await carbonContract.queryFilter(tradeFilter, -20000, 'latest');
            const pastRetireLogs = await carbonContract.queryFilter(retireFilter, -20000, 'latest');
            console.log("[useCarbonCredit] Fetched past trade logs:", pastTradeLogs.length, "past retire logs:", pastRetireLogs.length);
            const pastEvents: CombinedEvent[] = [];
            pastTradeLogs.forEach(log => { const event = processEvent(log, 'Trade'); if(event) pastEvents.push(event); });
            pastRetireLogs.forEach(log => { const event = processEvent(log, 'Retire'); if(event) pastEvents.push(event); });
            setTransactionHistory(prev => [...pastEvents, ...prev.filter(pe => !pastEvents.find(e => e.transactionHash === pe.transactionHash))]
                                      .sort((a,b) => (b.blockNumber - a.blockNumber) || ((b.timestamp ?? 0) - (a.timestamp ?? 0)) )
                                      .slice(0, 100));
        } catch (error) {
            console.error("[useCarbonCredit] Error fetching past events:", error);
        }
    };

    fetchPastEvents();
    carbonContract.on(tradeFilter, onTrade);
    carbonContract.on(retireFilter, onRetire);
    console.log("[useCarbonCredit] Event listeners attached.");

    return () => {
      console.log("[useCarbonCredit] Cleaning up event listeners.");
      carbonContract.off(tradeFilter, onTrade);
      carbonContract.off(retireFilter, onRetire);
    };
  }, [carbonContract, provider, chainId, getProjectName]); // Added getProjectName due to its use in processEvent

  return {
    tokenBalances,
    fetchTokenBalances,
    initiateBuyCreditsProcess,
    retireCredits: retireCreditsOnContract,
    transactionHistory,
    contract: carbonContract
  };
}; 