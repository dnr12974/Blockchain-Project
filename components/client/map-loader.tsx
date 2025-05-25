'use client'

import dynamic from 'next/dynamic'

const MapSection = dynamic(() => import('@/components/sections/map-section'), { 
  ssr: false,
  loading: () => <div className="w-full h-[500px] flex justify-center items-center text-white"><p>Loading Map...</p></div>
})

export default function MapLoader() {
  return <MapSection />
} 