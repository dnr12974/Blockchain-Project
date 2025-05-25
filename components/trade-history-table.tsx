"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/context/web3-context"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface TradeEvent {
  id: string
  type: "trade" | "retire"
  projectId: number
  account: string
  amount: string
  price?: string
  timestamp: number
}

export default function TradeHistoryTable() {
  const [events, setEvents] = useState<TradeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const { carbonCreditContract, account } = useWeb3()

  useEffect(() => {
    // In a real app, fetch events from the contract
    // For demo, use sample data
    const sampleEvents: TradeEvent[] = [
      {
        id: "0x123",
        type: "trade",
        projectId: 1,
        account: "0x1234567890123456789012345678901234567890",
        amount: "5",
        price: "52.50",
        timestamp: Date.now() - 3600000 * 2,
      },
      {
        id: "0x456",
        type: "retire",
        projectId: 2,
        account: "0x1234567890123456789012345678901234567890",
        amount: "3",
        timestamp: Date.now() - 3600000 * 5,
      },
      {
        id: "0x789",
        type: "trade",
        projectId: 3,
        account: "0x0987654321098765432109876543210987654321",
        amount: "10",
        price: "157.50",
        timestamp: Date.now() - 3600000 * 8,
      },
      {
        id: "0xabc",
        type: "trade",
        projectId: 1,
        account: "0x1234567890123456789012345678901234567890",
        amount: "2",
        price: "21.00",
        timestamp: Date.now() - 3600000 * 24,
      },
      {
        id: "0xdef",
        type: "retire",
        projectId: 1,
        account: "0x1234567890123456789012345678901234567890",
        amount: "1",
        timestamp: Date.now() - 3600000 * 48,
      },
    ]

    // Simulate API fetch
    setTimeout(() => {
      setEvents(sampleEvents)
      setLoading(false)
    }, 1500)
  }, [carbonCreditContract])

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-white/60">
        <p>No transaction history found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
      {events.map((event) => (
        <div
          key={event.id}
          className={`p-3 rounded-md border ${
            event.account.toLowerCase() === account?.toLowerCase()
              ? "bg-primary/10 border-primary/30"
              : "bg-black/60 border-primary/10"
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={event.type === "trade" ? "default" : "outline"}>
                  {event.type === "trade" ? "Traded" : "Retired"}
                </Badge>
                <span className="text-sm">Project #{event.projectId}</span>
              </div>
              <p className="text-xs text-white/60 mt-1">{shortenAddress(event.account)}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{event.amount} credits</p>
              {event.type === "trade" && event.price && <p className="text-xs text-white/60">${event.price}</p>}
            </div>
          </div>
          <div className="text-xs text-white/50 mt-2">{formatTimestamp(event.timestamp)}</div>
        </div>
      ))}
    </div>
  )
}
