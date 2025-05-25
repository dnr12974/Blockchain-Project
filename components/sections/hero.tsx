"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import * as THREE from "three"

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Create a tree-like structure with circuit patterns
    const createTree = () => {
      const treeGroup = new THREE.Group()

      // Create trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8)
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        roughness: 0.7,
        metalness: 0.8,
      })
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
      trunk.position.y = 0
      treeGroup.add(trunk)

      // Create branches
      const createBranch = (
        startPos: THREE.Vector3,
        direction: THREE.Vector3,
        length: number,
        thickness: number,
        level: number,
      ) => {
        if (level <= 0) return

        const branchGeometry = new THREE.CylinderGeometry(thickness * 0.7, thickness, length, 5)
        const branchMaterial = new THREE.MeshStandardMaterial({
          color: 0xdaa520,
          roughness: 0.5,
          metalness: 0.9,
        })

        const branch = new THREE.Mesh(branchGeometry, branchMaterial)
        branch.position.copy(startPos)

        // Rotate branch to point in direction
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
        branch.quaternion.copy(quaternion)

        // Move branch so its base is at startPos
        branch.position.add(direction.clone().multiplyScalar(length / 2))

        treeGroup.add(branch)

        // Create node at the end of branch
        const nodeGeometry = new THREE.SphereGeometry(thickness * 1.2, 8, 8)
        const nodeMaterial = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          roughness: 0.3,
          metalness: 1.0,
        })

        const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
        const endPos = startPos.clone().add(direction.clone().multiplyScalar(length))
        node.position.copy(endPos)
        treeGroup.add(node)

        // Create sub-branches
        if (level > 1) {
          const numBranches = Math.min(level, 3)
          for (let i = 0; i < numBranches; i++) {
            const angle = (i / numBranches) * Math.PI * 2
            const newDir = new THREE.Vector3(Math.sin(angle) * 0.8, 0.6, Math.cos(angle) * 0.8)
            createBranch(endPos.clone(), newDir, length * 0.7, thickness * 0.7, level - 1)
          }
        }
      }

      // Create main branches
      const numMainBranches = 5
      for (let i = 0; i < numMainBranches; i++) {
        const angle = (i / numMainBranches) * Math.PI * 2
        const startPos = new THREE.Vector3(0, 1, 0)
        const direction = new THREE.Vector3(Math.sin(angle) * 0.8, 0.6, Math.cos(angle) * 0.8)
        createBranch(startPos, direction, 1.2, 0.15, 3)
      }

      return treeGroup
    }

    const tree = createTree()
    scene.add(tree)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffd700, 1)
    directionalLight1.position.set(5, 5, 5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffd700, 0.5)
    directionalLight2.position.set(-5, 5, -5)
    scene.add(directionalLight2)

    // Position camera
    camera.position.z = 6
    camera.position.y = 1

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      tree.rotation.y += 0.003

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-black circuit-pattern opacity-70"></div>

      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {

          }

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 gold-gradient">Base Carbon Canopy</h1>

          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            Revolutionizing carbon credit trading with blockchain technology for a sustainable future
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://offset.climateneutralnow.org/AllProjects" target="_blank" rel="noopener noreferrer">
              <Button className="bg-primary text-black hover:bg-primary/90 text-lg py-6 px-8 w-full sm:w-auto">Explore Projects</Button>
            </a>
            <a href="https://offsetguide.org/what-are-carbon-credits/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 text-lg py-6 px-8 w-full sm:w-auto">
                Learn More
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-8 w-8 text-primary" />
      </div>
    </section>
  )
}
