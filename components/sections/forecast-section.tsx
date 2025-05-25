"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, TrendingUp, ShieldCheck, Leaf, BarChart3 } from "lucide-react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from "chart.js"

// Register ChartJS components for Bar chart
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Define the Impact Score data type
interface ImpactScoreData {
  GSID: number // Can be used as a unique ID, maps to project.gsid if needed
  Project_Name: string
  Country: string
  Project_Type: string
  Estimated_Annual_Credits: number
  Parsed_SDGs: string[]
  Predicted_Impact_Score: number
}

// Helper to get a representative SDG icon (simplified)
const getSDGIcon = (sdg: string) => {
  if (sdg.includes("13")) return <Leaf className="h-4 w-4 text-green-500 mr-1" /> // Climate Action
  if (sdg.includes("7")) return <TrendingUp className="h-4 w-4 text-yellow-500 mr-1" /> // Affordable and Clean Energy
  if (sdg.includes("8")) return <ShieldCheck className="h-4 w-4 text-blue-500 mr-1" /> // Decent Work and Economic Growth
  return <Star className="h-4 w-4 text-gray-400 mr-1" /> // Generic SDG icon
}

export default function ImpactScoreSection() {
  const [impactScores, setImpactScores] = useState<ImpactScoreData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchImpactScores = async () => {
      setLoading(true);
      try {
        // Fetch from the new /data/impact_scores.json
        const response = await fetch("/data/impact_scores.json"); 
        if (!response.ok) throw new Error("Failed to fetch impact scores");
        const data: ImpactScoreData[] = await response.json();
        setImpactScores(data);
      } catch (error) {
        console.error("Error loading impact scores:", error);
        setImpactScores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchImpactScores();
  }, [])

  // Chart data for bar chart showing Impact Scores
  const barChartData = {
    labels: impactScores.map((item: ImpactScoreData) => item.Project_Name.substring(0, 25) + (item.Project_Name.length > 25 ? '...' : '')), // Shorten long names
    datasets: [
      {
        label: "Predicted Impact Score (0-100)",
        data: impactScores.map((item: ImpactScoreData) => item.Predicted_Impact_Score),
        backgroundColor: impactScores.map((item: ImpactScoreData) => {
          // Color based on score
          if (item.Predicted_Impact_Score > 75) return 'rgba(75, 192, 192, 0.7)'; // Teal for high scores
          if (item.Predicted_Impact_Score > 50) return 'rgba(255, 206, 86, 0.7)'; // Yellow for medium
          return 'rgba(255, 99, 132, 0.7)'; // Red for lower
        }),
        borderColor: impactScores.map((item: ImpactScoreData) => {
          if (item.Predicted_Impact_Score > 75) return 'rgba(75, 192, 192, 1)';
          if (item.Predicted_Impact_Score > 50) return 'rgba(255, 206, 86, 1)';
          return 'rgba(255, 99, 132, 1)';
        }),
        borderWidth: 1,
      },
    ],
  }

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to not maintain aspect ratio
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "rgba(255, 255, 255, 0.8)" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function(context: TooltipItem<"bar">) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true, 
        max: 100, // Assuming score is 0-100
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "rgba(255, 255, 255, 0.7)" },
        title: {
          display: true,
          text: 'Impact Score',
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      x: {
        grid: { display: false }, // Hide x-axis grid lines for cleaner look
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          maxRotation: 45, // Rotate labels if too long
          minRotation: 30,
        },
      },
    },
  }

  return (
    <section id="impact-scores" className="py-20 bg-black leaf-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gold-gradient">
            Project Impact Scores
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            AI-calculated Impact Scores to highlight project effectiveness and sustainability contributions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <Card className="bg-black/50 backdrop-blur-sm border-primary/30 h-full">
              <CardHeader>
                <CardTitle className="gold-gradient flex items-center"><Star className="h-6 w-6 mr-2 text-yellow-400"/> Impact Insights</CardTitle>
                <CardDescription>Predicted impact scores for carbon credit projects</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-4 rounded-md bg-black/60 border border-primary/20">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-8 w-1/2 mb-3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : impactScores.length === 0 ? (
                  <p className="text-white/70 text-center py-8">No impact score data available.</p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {impactScores.map((item: ImpactScoreData) => (
                      <div key={item.GSID} className="p-4 rounded-lg bg-black/60 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg text-white w-3/4">{item.Project_Name}</h4>
                          <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm">
                            {item.Predicted_Impact_Score.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60 mb-1"><span className="font-medium">Type:</span> {item.Project_Type}</p>
                        <p className="text-xs text-white/60 mb-1"><span className="font-medium">Country:</span> {item.Country}</p>
                        <p className="text-xs text-white/60 mb-3"><span className="font-medium">Est. Annual Credits:</span> {item.Estimated_Annual_Credits.toLocaleString()}</p>
                        
                        {item.Parsed_SDGs && item.Parsed_SDGs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-primary/10">
                            <p className="text-xs text-white/70 font-semibold mb-1">Supports SDGs:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.Parsed_SDGs.map(sdg => (
                                <Badge key={sdg} variant="secondary" className="bg-gray-700/50 text-gray-300 border-gray-600/50 text-xs flex items-center">
                                  {getSDGIcon(sdg)} {sdg}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="bg-black/50 backdrop-blur-sm border-primary/30 h-full">
              <CardHeader>
                <CardTitle className="gold-gradient flex items-center"><BarChart3 className="h-6 w-6 mr-2 text-blue-400"/>Impact Score Distribution</CardTitle>
                <CardDescription>Comparison of predicted impact scores across projects</CardDescription>
              </CardHeader>
              <CardContent className="h-[550px] p-4">
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : impactScores.length === 0 ? (
                  <p className="text-white/70 text-center py-8">No data available for chart.</p>
                ) : (
                  <Bar options={chartOptions} data={barChartData} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
