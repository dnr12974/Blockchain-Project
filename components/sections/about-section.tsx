"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { Leaf, Recycle, TreePine, Zap } from "lucide-react"

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const features = [
    {
      icon: <TreePine className="h-10 w-10 text-primary" />,
      title: "Carbon Credit Projects",
      description: "Support verified carbon offset projects around the world, from reforestation to renewable energy.",
    },
    {
      icon: <Recycle className="h-10 w-10 text-primary" />,
      title: "Transparent Trading",
      description: "Buy, sell, and retire carbon credits with full transparency on the blockchain.",
    },
    {
      icon: <Leaf className="h-10 w-10 text-primary" />,
      title: "Environmental Impact",
      description: "Track your contribution to reducing carbon emissions and fighting climate change.",
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: "Impact Analysis",
      description: "Access AI-driven Impact Scores to understand project effectiveness and sustainability contributions.",
    },
  ]

  return (
    <section id="about" className="py-20 relative overflow-hidden bg-black leaf-pattern">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gold-gradient">
            Bridging Blockchain & Sustainability
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Base Carbon Canopy is revolutionizing how carbon credits are traded and managed, bringing transparency and
            accessibility to environmental markets.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-black/50 backdrop-blur-sm border border-primary/20 rounded-lg p-6 hover:border-primary/50 transition-all"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 gold-gradient">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-4 gold-gradient">How Base Carbon Canopy Works</h3>
            <p className="text-white/80 mb-6">
              Our platform leverages blockchain technology to create a transparent, efficient marketplace for carbon
              credits. Each credit represents one ton of carbon dioxide removed or avoided.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">01.</span>
                <span className="text-white/80">
                  Carbon offset projects are verified and tokenized on the blockchain
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">02.</span>
                <span className="text-white/80">Buyers can purchase credits directly from project developers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">03.</span>
                <span className="text-white/80">
                  Credits can be traded on the marketplace or retired to offset emissions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold">04.</span>
                <span className="text-white/80">
                  All transactions are recorded on the blockchain for complete transparency
                </span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/10 rounded-lg blur-sm"></div>
            <div className="relative bg-black rounded-lg overflow-hidden border border-primary/30">
              <Image
                src="/carboncreditforest.jpeg"
                alt="Carbon Credit Lifecycle"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
