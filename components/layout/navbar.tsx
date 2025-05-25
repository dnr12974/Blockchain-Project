"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import WalletConnectButton from "@/components/wallet-connect-button"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/90 backdrop-blur-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/basecarboncanopylogo.jpg-6UbIahjPnj1GorTUg21LD3zArZuiDv.jpeg"
              alt="Base Carbon Canopy Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="font-montserrat font-bold text-xl md:text-2xl gold-gradient">Base Carbon Canopy</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#about" className="text-white/80 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="#map" className="text-white/80 hover:text-primary transition-colors">
              Projects Map
            </Link>
            <Link href="#trading" className="text-white/80 hover:text-primary transition-colors">
              Trading
            </Link>
            <Link href="#impact-scores" className="text-white/80 hover:text-primary transition-colors">
              Impact Scores
            </Link>
            <WalletConnectButton />
          </nav>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md absolute top-full left-0 right-0 p-4 flex flex-col gap-4 border-t border-primary/20">
          <Link
            href="#about"
            className="text-white/80 hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="#map"
            className="text-white/80 hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Projects Map
          </Link>
          <Link
            href="#trading"
            className="text-white/80 hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Trading
          </Link>
          <Link
            href="#impact-scores"
            className="text-white/80 hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Impact Scores
          </Link>
          <div className="pt-2">
            <WalletConnectButton />
          </div>
        </div>
      )}
    </header>
  )
}
