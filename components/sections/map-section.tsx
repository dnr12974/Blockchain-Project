"use client"

import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeb3 } from "@/context/web3-context"
import L from "leaflet"

// Define the project type to match projects.json structure
interface Project {
  id: number // Corresponds to blockchain projectId
  gsid?: number // Optional, for mapping to impact scores if needed
  name: string
  locationName: string
  coordinates: [number, number]
  type: string
  description: string
  totalMinted: number
  mockPricePerToken: string // Price in mUSDC as a string, e.g., "10.50"
}

export default function MapSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { carbonCreditContract, account, isConnected } = useWeb3()
  const [balances, setBalances] = useState<Record<number, string>>({})

  useEffect(() => {
    // Fix Leaflet icon issues with Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl

    // Use publicly accessible URLs for the marker icons
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    })

    // Fetch projects data
    const fetchProjects = async () => {
      setLoading(true)
      try {
        const response = await fetch("/data/projects.json") // Load from the new static JSON
        if (!response.ok) throw new Error("Failed to fetch projects from /data/projects.json")
        const data: Project[] = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Error loading projects:", error)
        setProjects([]) // Set to empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch balances for the connected account
  useEffect(() => {
    const fetchBalances = async () => {
      if (!carbonCreditContract || !account || projects.length === 0 || !isConnected) return

      try {
        const balancePromises = projects.map(async (project: Project) => {
          // project.id is the blockchain projectId
          const balance = await carbonCreditContract.balanceOf(account, project.id)
          return { projectId: project.id, balance: balance.toString() }
        })

        const results = await Promise.all(balancePromises)
        const balanceMap: Record<number, string> = {}

        results.forEach(({ projectId, balance }: { projectId: number; balance: string }) => {
          balanceMap[projectId] = balance
        })

        setBalances(balanceMap)
      } catch (error) {
        console.error("Error fetching balances:", error)
        setBalances({}) // Clear balances on error
      }
    }

    fetchBalances()
  }, [carbonCreditContract, account, projects, isConnected]) // Added isConnected dependency

  // No longer using sampleProjects directly here as fetchProjects provides the data or an empty array.
  const displayProjects = projects

  return (
    <section id="map" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gold-gradient">Global Carbon Projects</h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Explore carbon offset projects around the world and see their impact on reducing emissions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {loading && displayProjects.length === 0 ? (
              <Skeleton className="w-full h-[500px] rounded-lg" />
            ) : displayProjects.length === 0 && !loading ? (
              <div className="w-full h-[500px] rounded-lg flex items-center justify-center bg-black/50 border border-primary/30 text-white/80">
                <p>No projects available to display at the moment.</p>
              </div>
            ) : (
              <div className="h-[500px] rounded-lg overflow-hidden border border-primary/30">
                <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }} className="z-0">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {displayProjects.map((project: Project) => (
                    <Marker
                      key={project.id}
                      position={project.coordinates}
                      eventHandlers={{
                        click: () => setSelectedProject(project),
                      }}
                    >
                      <Popup>
                        <div className="p-1">
                          <h3 className="font-bold">{project.name}</h3>
                          <p className="text-xs">{project.type}</p>
                          <p className="text-xs mt-1">Click for details</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>

          <div>
            <Card className="bg-black/50 backdrop-blur-sm border-primary/30">
              <CardHeader>
                <CardTitle className="gold-gradient">Project Details</CardTitle>
                <CardDescription>
                  {selectedProject
                    ? "Details for the selected carbon project"
                    : "Select a project on the map to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                {selectedProject ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{selectedProject.name}</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {selectedProject.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/80">{selectedProject.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-black/60 p-3 rounded-md border border-primary/20">
                        <p className="text-xs text-white/60 mb-1">Total Credits Minted</p>
                        <p className="text-lg font-bold">{selectedProject.totalMinted.toLocaleString()}</p>
                      </div>
                      <div className="bg-black/60 p-3 rounded-md border border-primary/20">
                        <p className="text-xs text-white/60 mb-1">Your Balance</p>
                        <p className="text-lg font-bold">
                          {isConnected && account ? (balances[selectedProject.id] !== undefined ? balances[selectedProject.id] : '0') : 'N/A'}
                        </p>
                      </div>
                      <div className="bg-black/60 p-3 rounded-md border border-primary/20 col-span-2">
                        <p className="text-xs text-white/60 mb-1">Mock Price (mUSDC)</p>
                        <p className="text-lg font-bold">{selectedProject.mockPricePerToken} / credit</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60">
                    <p>No project selected.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
