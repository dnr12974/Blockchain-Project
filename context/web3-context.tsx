"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import type { Abi } from "ethers"

// Extend Window interface for TypeScript to recognize window.ethereum
interface ExtendedWindow extends Window {
  ethereum?: any // You can be more specific with the type if you have it e.g. ethers.Eip1193Provider
}

// Configuration constants
const BASE_SEPOLIA_CHAIN_ID = 84532 // 0x14A34
const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org"

// IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DEPLOYED CONTRACT ADDRESSES
const CARBON_CREDIT_CONTRACT_ADDRESS = "0x7Bd6321f99C6511348B0E65eC1250F02A0b7eF34"
const MOCK_USDC_CONTRACT_ADDRESS = "0x2908dA8E7936b11Bc9e730b0a8B4B6Bb7f591Dae"

// IMPORTANT: REPLACE THIS WITH THE ADDRESS THAT DEPLOYED/OWNS THE PROJECTS FOR INITIAL SALE
const DEFAULT_SELLER_ADDRESS = "0x5d3Cd01f5f1646cd52ccb00edeFF5f3943e7F60d"

interface Web3ContextType {
  provider: ethers.Provider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  carbonCreditContract: ethers.Contract | null
  mockUSDCContract: ethers.Contract | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  isCorrectNetwork: boolean
  switchNetwork: () => Promise<void>
  balance: string
  defaultSellerAddress: string
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

interface ContractABI {
  abi: Abi
}

import CarbonCreditABI from "@/abis/carbon-credit.json" // Changed to use carbon-credit.json
import MockUSDCABI from "@/abis/MockUSDC.json" // Changed from mock-usdc.json to MockUSDC.json
import { toast } from "react-hot-toast"

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [carbonCreditContract, setCarbonCreditContract] = useState<ethers.Contract | null>(null)
  const [mockUSDCContract, setMockUSDCContract] = useState<ethers.Contract | null>(null)
  const [balance, setBalance] = useState("0")
  const defaultSellerAddress = DEFAULT_SELLER_ADDRESS

  const isCorrectNetwork = chainId === BASE_SEPOLIA_CHAIN_ID

  useEffect(() => {
    const initProvider = async () => {
      const extendedWindow = window as ExtendedWindow
      if (typeof extendedWindow !== "undefined" && extendedWindow.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(extendedWindow.ethereum) // V6 Change
          setProvider(web3Provider)

          // If listAccounts() is returning Signer[] as per linter feedback:
          const signerAccounts = await web3Provider.listAccounts() // Let TS infer this for now, based on its previous error
          
          if (signerAccounts.length > 0 && signerAccounts[0]) {
            const firstSigner = signerAccounts[0] // This would be a Signer object
            // In ethers v6, BrowserProvider.getSigner() can take an index or address.
            // However, listAccounts() is for addresses. If it's returning signers, that's unusual.
            // Let's assume firstSigner is indeed a Signer if the linter was right about listAccounts() returning Signer[]
            
            const accountAddress: string = await (firstSigner as ethers.Signer).getAddress(); // Get address string from the signer
            const currentSignerToSet = await web3Provider.getSigner(); // Get the default signer for the provider for setSigner

            setSigner(currentSignerToSet) 
            setAccount(accountAddress) // Set the string address
            setIsConnected(true)
            const network = await web3Provider.getNetwork()
            setChainId(Number(network.chainId)) // V6: chainId is BigInt
            initializeContracts(currentSignerToSet, web3Provider)
          } else {
            initializeContracts(null, web3Provider)
          }

          extendedWindow.ethereum.on("accountsChanged", handleAccountsChanged)
          extendedWindow.ethereum.on("chainChanged", handleChainChanged)
        } catch (error) {
          console.error("Error initializing web3 provider from window.ethereum:", error)
          const defaultProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL) // V6 Change
          setProvider(defaultProvider)
          initializeContracts(null, defaultProvider)
        }
      } else {
        console.log("MetaMask not found. Initializing with a default read-only provider.")
        const defaultProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL) // V6 Change
        setProvider(defaultProvider)
        initializeContracts(null, defaultProvider)
      }
    }

    initProvider()

    return () => {
      const extendedWindowCleanup = window as ExtendedWindow
      if (extendedWindowCleanup.ethereum && extendedWindowCleanup.ethereum.removeListener) { // Check removeListener exists
        extendedWindowCleanup.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        extendedWindowCleanup.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    const updateBalance = async () => {
      if (mockUSDCContract && account) {
        try {
          const currentBalance = await mockUSDCContract.balanceOf(account)
          setBalance(ethers.formatUnits(currentBalance, 6)) // V6 Change
        } catch (error) {
          console.error("Error fetching balance:", error)
          setBalance("0")
        }
      } else {
        setBalance("0")
      }
    }

    if (isConnected && account) {
      updateBalance()
    }
  }, [mockUSDCContract, account, isConnected])

  const disconnectWallet = () => {
    const defaultProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL); 
    setProvider(defaultProvider);
    setSigner(null)
    setAccount(null)
    setChainId(null)
    setIsConnected(false)
    setCarbonCreditContract(null)
    setMockUSDCContract(null)
    setBalance("0")
    initializeContracts(null, defaultProvider);
  }

  const handleAccountsChanged = async (accounts: string[]) => { // V6: getSigner is async
    if (accounts.length === 0) {
      disconnectWallet() // Corrected: Call the defined disconnectWallet
    } else if (accounts[0] && accounts[0] !== account) { // Check accounts[0] exists
      setAccount(accounts[0])
      if (provider instanceof ethers.BrowserProvider) { // V6 Change
        const newSigner = await provider.getSigner() // V6: getSigner is async
        setSigner(newSigner)
        initializeContracts(newSigner, provider)
      } else if (provider) { // Fallback for JsonRpcProvider if needed, though signer might not be available
        initializeContracts(null, provider);
      }
    }
  }

  const handleChainChanged = (_chainId: string) => { // _chainId from MM is hex string
    console.log("Network changed to:", _chainId)
    window.location.reload()
  }

  const initializeContracts = (currentSigner: ethers.Signer | null, currentProvider: ethers.Provider) => {
    try {
      const contractSignerOrProvider = currentSigner || currentProvider
      if (!contractSignerOrProvider) {
        console.error("Cannot initialize contracts: No signer or provider available.")
        return
      }

      // Get the ABI array from the imported JSON
      const carbonCreditAbiArray = (CarbonCreditABI as any).abi || CarbonCreditABI;
      const mockUsdcAbiArray = (MockUSDCABI as any).abi || MockUSDCABI;

      console.log("Initializing contracts with ABIs:", {
        carbonCreditAbi: carbonCreditAbiArray,
        mockUsdcAbi: mockUsdcAbiArray
      });

      // Log the full ABI to see what functions are available
      console.log("Carbon Credit ABI:", JSON.stringify(carbonCreditAbiArray, null, 2));

      const carbonCredit = new ethers.Contract(
        CARBON_CREDIT_CONTRACT_ADDRESS,
        carbonCreditAbiArray,
        contractSignerOrProvider
      )
      setCarbonCreditContract(carbonCredit)
      
      const mockUSDC = new ethers.Contract(
        MOCK_USDC_CONTRACT_ADDRESS,
        mockUsdcAbiArray,
        contractSignerOrProvider
      )
      setMockUSDCContract(mockUSDC)
    } catch (error) {
      console.error("Failed to initialize contracts:", error)
      setCarbonCreditContract(null)
      setMockUSDCContract(null)
    }
  }

  const connectWallet = async () => {
    const extendedWindow = window as ExtendedWindow
    if (typeof extendedWindow !== "undefined" && extendedWindow.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(extendedWindow.ethereum) // V6 Change
        const accounts = await web3Provider.send("eth_requestAccounts", []) 
        
        if (accounts.length === 0 || !accounts[0]) {
            console.error("No accounts found after requesting.");
            alert("Could not connect to wallet. No accounts found.");
            return;
        }
        setProvider(web3Provider)

        const currentSigner = await web3Provider.getSigner() // V6: getSigner is async
        setSigner(currentSigner)

        const address = await currentSigner.getAddress()
        setAccount(address)
        setIsConnected(true)

        const network = await web3Provider.getNetwork()
        setChainId(Number(network.chainId)) // V6: chainId is BigInt

        initializeContracts(currentSigner, web3Provider)
      } catch (error) {
        console.error("Error connecting wallet:", error)
        // Corrected template literal for error message
        alert(`Failed to connect wallet. ${(error as Error).message}`)
      }
    } else {
      alert("Please install MetaMask to use this dApp")
    }
  }

  // disconnectWallet was moved up to be defined before its first call in handleAccountsChanged

  const switchNetwork = async () => {
    const extendedWindow = window as ExtendedWindow
    if (!extendedWindow.ethereum) {
        alert("MetaMask is not available.");
        return;
    }

    try {
      await extendedWindow.ethereum.request({
        method: "wallet_switchEthereumChain",
        // Corrected template literal
        params: [{ chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) { // Chain not added
        try {
          await extendedWindow.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                // Corrected template literal
                chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
                chainName: "Base Sepolia Testnet",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [BASE_SEPOLIA_RPC_URL],
                blockExplorerUrls: ["https://sepolia.basescan.org/"],
              },
            ],
          })
        } catch (addError: any) {
          console.error("Failed to add the Base Sepolia network to MetaMask:", addError)
          // Corrected template literal
          alert(`Failed to add network: ${(addError as Error).message}`)
        }
      } else {
        console.error("Failed to switch network:", switchError)
        // Corrected template literal
        alert(`Failed to switch network: ${(switchError as Error).message}`)
      }
    }
  }

  const value = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    carbonCreditContract,
    mockUSDCContract,
    connectWallet,
    disconnectWallet,
    isCorrectNetwork,
    switchNetwork,
    balance,
    defaultSellerAddress,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}
