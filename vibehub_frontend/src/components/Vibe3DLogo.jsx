import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const Vibe3DLogo = ({ size = 110, className = '' }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId
    const width = size
    const height = size

    // 1. Scene
    const scene = new THREE.Scene()

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
    camera.position.set(0, 0, 5.2)

    // 3. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // 4. Studio Environment for crisp, photorealistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture
    scene.environment = envMap

    // 5. Main 3D Group
    const group = new THREE.Group()
    scene.add(group)

    // 6. Central 3D Kinetic Emblem (Fluid, glossy brand-indigo Torus Knot)
    const knotGeom = new THREE.TorusKnotGeometry(1.05, 0.3, 128, 32, 2, 3)
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,            // VibeHub Brand Indigo
      emissive: 0x1e1b4b,
      roughness: 0.15,
      metalness: 0.7,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    })
    const knot = new THREE.Mesh(knotGeom, knotMat)
    group.add(knot)

    // 7. Delicate Outer Halo Ring
    const ringGeom = new THREE.TorusGeometry(1.85, 0.02, 16, 80)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = Math.PI / 3
    ring.rotation.y = Math.PI / 6
    group.add(ring)

    // 8. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(4, 5, 4)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0xa5b4fc, 2.0, 10)
    fillLight.position.set(-3, -2, 3)
    scene.add(fillLight)

    // 9. Interactive Mouse Parallax
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window
      targetX = ((e.clientX / innerWidth) * 2 - 1) * 0.8
      targetY = -((e.clientY / innerHeight) * 2 - 1) * 0.8
    }

    window.addEventListener('mousemove', handleMouseMove)

    // 10. Animation Loop
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      // Mouse lerp
      currentX += (targetX - currentX) * 0.05
      currentY += (targetY - currentY) * 0.05

      // Continuous gentle rotation
      knot.rotation.x = elapsed * 0.35
      knot.rotation.y = elapsed * 0.45

      ring.rotation.z = -elapsed * 0.2

      // Cursor tilt
      group.rotation.y = currentX * 0.6
      group.rotation.x = -currentY * 0.5

      renderer.render(scene, camera)
    }

    animate()

    // 11. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)

      knotGeom.dispose()
      knotMat.dispose()
      ringGeom.dispose()
      ringMat.dispose()
      envMap.dispose()
      pmremGenerator.dispose()

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [size])

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft Indigo Glow behind the 3D object */}
      <div 
        className="absolute rounded-full bg-indigo-500/15 blur-xl pointer-events-none"
        style={{ width: size * 0.9, height: size * 0.9 }}
      />
      {/* WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ width: size, height: size }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      />
    </div>
  )
}

export default Vibe3DLogo
