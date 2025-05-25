import { useState, useEffect, useCallback } from 'react';
import { ethers, Contract, BigNumberish, formatUnits, parseUnits } from 'ethers';
import { MOCK_USDC_CONTRACT_ADDRESS, CARBON_CREDIT_CONTRACT_ADDRESS, BASE_SEPOLIA_CHAIN_ID } from '../lib/config';
import MockUSDCAbi from '../abis/MockUSDC.json';

// Assume a useWallet hook providing these (e.g., from RainbowKit, Web3Modal)
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
    console.log("[useWallet] useEffect triggered");
    let mounted = true;

    const getWalletData = async (currentProvider: ethers.BrowserProvider) => {
      if (!mounted) return;
      console.log("[useWallet] getWalletData called");
      try {
        // Request accounts only if not connected or no address, to avoid popup on every call
        const currentAccounts = walletState.address ? [walletState.address] : await currentProvider.send("eth_requestAccounts", []);
        console.log("[useWallet] Accounts:", currentAccounts);

        if (currentAccounts.length > 0) {
          const signer = await currentProvider.getSigner();
          const network = await currentProvider.getNetwork();
          if (!mounted) return;
          console.log("[useWallet] Signer:", !!signer, "Address:", currentAccounts[0], "Network:", network.chainId);
          setWalletState({
            provider: currentProvider,
            signer,
            address: currentAccounts[0],
            isConnected: true,
            chainId: Number(network.chainId),
          });
        } else {
          if (!mounted) return;
          console.log("[useWallet] No accounts found");
          setWalletState({ provider: null, signer: null, address: null, isConnected: false, chainId: walletState.chainId }); // Retain chainId if possible
        }
      } catch (err) {
        if (!mounted) return;
        console.error("[useWallet] Error in getWalletData:", err);
        setWalletState(prev => ({ ...prev, isConnected: false, signer: null, address: null, provider: null }));
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (!mounted) return;
      console.log("[useWallet] accountsChanged event (via window.ethereum):", accounts);
      // Create a new provider instance if needed, or reuse if appropriate for the app architecture
      // This ensures getWalletData uses the context of the event.
      if (window.ethereum) {
          const eventProvider = new ethers.BrowserProvider(window.ethereum);
          getWalletData(eventProvider);
      }
    };

    const handleChainChanged = (newChainIdHex: string) => {
      if (!mounted) return;
      const newChainId = parseInt(newChainIdHex, 16);
      console.log("[useWallet] chainChanged event (via window.ethereum), newChainId:", newChainId);
      if (window.ethereum) {
          const eventProvider = new ethers.BrowserProvider(window.ethereum);
          getWalletData(eventProvider);
      }
    };

    if (typeof window.ethereum !== 'undefined') {
      const initialProvider = new ethers.BrowserProvider(window.ethereum);
      getWalletData(initialProvider); // Initial fetch
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    } else {
      console.log('[useWallet] MetaMask is not installed!');
    }

    return () => {
      mounted = false;
      if (typeof window.ethereum !== 'undefined' && window.ethereum.removeListener) {
        console.log("[useWallet] Cleaning up EIP-1193 event listeners");
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []); // Removed walletState from dependency array to avoid re-triggering on its own state updates

  return walletState;
};

export const useMockUSDC = () => {
  const { signer, address, chainId, isConnected } = useWallet();
  const [usdcContract, setUsdcContract] = useState<Contract | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [decimals, setDecimals] = useState<number>(6); 

  console.log("[useMockUSDC] Hook init. Signer:", signer, "Address:", address, "ChainID:", chainId, "Connected:", isConnected);

  useEffect(() => {
    console.log("[useMockUSDC] Contract setup effect. Signer:", signer, "ChainID:", chainId);
    if (signer && chainId === BASE_SEPOLIA_CHAIN_ID && MOCK_USDC_CONTRACT_ADDRESS && !MOCK_USDC_CONTRACT_ADDRESS.startsWith("0xYOUR")) {
      console.log("[useMockUSDC] Creating contract instance with address:", MOCK_USDC_CONTRACT_ADDRESS);
      const contract = new ethers.Contract(MOCK_USDC_CONTRACT_ADDRESS, MockUSDCAbi, signer);
      setUsdcContract(contract);
      console.log("[useMockUSDC] Contract instance created:", contract);
      contract.decimals().then(dec => {
        const numDecimals = Number(dec);
        console.log("[useMockUSDC] Fetched decimals:", numDecimals);
        setDecimals(numDecimals);
      }).catch(err => console.error("[useMockUSDC] Error fetching decimals:", err));
    } else {
      console.log("[useMockUSDC] Conditions not met for contract creation. Signer:", !!signer, "ChainID OK:", chainId === BASE_SEPOLIA_CHAIN_ID, "Address OK:", MOCK_USDC_CONTRACT_ADDRESS && !MOCK_USDC_CONTRACT_ADDRESS.startsWith("0xYOUR"));
      setUsdcContract(null);
    }
  }, [signer, chainId]);

  const getBalance = useCallback(async () => {
    console.log("[useMockUSDC] getBalance called. Contract:", usdcContract, "Address:", address, "Decimals:", decimals);
    if (usdcContract && address) {
      try {
        const balBN: BigNumberish = await usdcContract.balanceOf(address);
        console.log("[useMockUSDC] Raw balance BigNumber:", balBN?.toString());
        const formattedBal = formatUnits(balBN, decimals);
        console.log("[useMockUSDC] Formatted balance:", formattedBal);
        setBalance(formattedBal);
        return formattedBal;
      } catch (error) {
        console.error("[useMockUSDC] Error fetching USDC balance:", error);
        setBalance('0');
        return '0';
      }
    }
    console.log("[useMockUSDC] getBalance conditions not met.");
    return '0';
  }, [usdcContract, address, decimals]);

  useEffect(() => {
    console.log("[useMockUSDC] Balance fetching effect. Address:", address, "Contract:", !!usdcContract, "Decimals:", decimals);
    if (address && usdcContract) {
      getBalance();
    }
  }, [address, usdcContract, decimals, getBalance]); // Added decimals here as it's fetched async

  const approve = useCallback(async (spender: string, amount: BigNumberish) => {
    console.log("[useMockUSDC] approve called. Spender:", spender, "Amount:", amount.toString());
    if (!usdcContract || !signer) {
      console.error("[useMockUSDC] Approve error: Contract or signer not available.");
      throw new Error("USDC Contract or signer not available");
    }
    if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
      console.error("[useMockUSDC] Approve error: Wrong network. Expected:", BASE_SEPOLIA_CHAIN_ID, "Got:", chainId);
      throw new Error(`Wrong network. Please switch to Base Sepolia (Chain ID: ${BASE_SEPOLIA_CHAIN_ID})`);
    }
    try {
      const tx = await usdcContract.approve(spender, amount);
      console.log("[useMockUSDC] Approve transaction sent:", tx.hash);
      await tx.wait();
      console.log('[useMockUSDC] Approval successful:', tx.hash);
      return tx;
    } catch (error) {
      console.error("[useMockUSDC] Error approving USDC:", error);
      throw error;
    }
  }, [usdcContract, signer, chainId]); // Removed decimals from dep array, not directly used in approve logic calculation

  // Return a stable object, ensure functions have stable references if not wrapped in useCallback
  return { balance, getBalance, approve, contract: usdcContract, decimals };
}; 