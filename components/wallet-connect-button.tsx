"use client"

import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/context/web3-context"
import { Wallet, LogOut } from "lucide-react"

export default function WalletConnectButton() {
  const { isConnected, account, connectWallet, disconnectWallet, isCorrectNetwork, switchNetwork } = useWeb3()

  const shortenAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Button onClick={connectWallet} className="bg-primary text-black hover:bg-primary/90">
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <Button onClick={switchNetwork} variant="destructive">
        Switch to Base Sepolia
      </Button>
    )
  }

  return (
    <Button 
      onClick={disconnectWallet} 
      variant="outline" 
      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Disconnect {account ? shortenAddress(account) : ""}
    </Button>
  )
}
