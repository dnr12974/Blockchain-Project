import Link from "next/link"
import Image from "next/image"
import { Github, Twitter, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-black border-t border-primary/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/basecarboncanopylogo.jpg-6UbIahjPnj1GorTUg21LD3zArZuiDv.jpeg"
                alt="Base Carbon Canopy Logo"
                width={40}
                height={40}
              />
              <span className="font-montserrat font-bold text-xl gold-gradient">Base Carbon Canopy</span>
            </div>
            <p className="text-white/70 max-w-md">
              A blockchain-based platform revolutionizing carbon credit trading and management, making sustainability
              accessible and transparent.
            </p>
            <div className="flex gap-4 mt-6">
              <Link href="https://github.com/S1056SAR/Base-Carbon-Canopy" className="text-white/70 hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-white/70 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-white/70 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 gold-gradient">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#about" className="text-white/70 hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#map" className="text-white/70 hover:text-primary transition-colors">
                  Projects Map
                </Link>
              </li>
              <li>
                <Link href="#trading" className="text-white/70 hover:text-primary transition-colors">
                  Trading
                </Link>
              </li>
              <li>
                <Link href="#forecast" className="text-white/70 hover:text-primary transition-colors">
                  Impact Score
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-montserrat font-bold text-lg mb-4 gold-gradient">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="https://docs.base.org/" className="text-white/70 hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="https://docs.cdp.coinbase.com/" className="text-white/70 hover:text-primary transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link href="https://smartwallet.dev/" className="text-white/70 hover:text-primary transition-colors">
                  Smart Contracts
                </Link>
              </li>
              <li>
                <Link href="https://offsetguide.org/" className="text-white/70 hover:text-primary transition-colors">
                  Carbon Credit Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-12 pt-6 text-center text-white/50">
          <p>© {new Date().getFullYear()} Base Carbon Canopy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
