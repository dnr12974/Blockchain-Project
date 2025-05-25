"use client"

import { useEffect } from "react"
import dynamic from 'next/dynamic'
import AboutSection from "@/components/sections/about-section"
import ForecastSection from "@/components/sections/forecast-section"
import Hero from "@/components/sections/hero"
// import MapSection from "@/components/sections/map-section" // Will be dynamically imported
import TradingSection from "@/components/sections/trading-section"
// import TradeHistoryTable from "@/components/trade-history-table" // Placeholder

const MapSection = dynamic(() => import('@/components/sections/map-section'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex justify-center items-center bg-background"><p className="text-foreground">Loading Map...</p></div>
})

export default function Home() {
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem("mainPageReloaded")
    if (!hasReloaded) {
      sessionStorage.setItem("mainPageReloaded", "true")
      window.location.reload()
    }
  }, [])

  return (
    <main className="flex-1">
      <Hero />
      <AboutSection />
      <MapSection />
      <TradingSection />
      <ForecastSection />
      {/* <TradeHistoryTable /> */}
    </main>
  )
}
