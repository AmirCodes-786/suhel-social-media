import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { Activity } from 'lucide-react'

const ThreeAuthBackground = ({ 
  headline = 'Where authentic communities come together.',
  subheadline = 'Share moments, explore creative stories, and connect with people who inspire you in real time.',
  testimonial = {
    quote: "VibeHub made it effortless for us to share daily moments and build a genuine community with our followers. It feels fast, human, and focused.",
    author: "Elena Rostova",
    role: "Digital Creator & Visual Artist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  }
}) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return

    let animationFrameId
    const width = container.clientWidth
    const height = container.clientHeight

    // 1. Scene
    const scene = new THREE.Scene()

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 0, 5.8)

    // 3. Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.appendChild(renderer.domElement)

    // 4. Studio Environment for crisp, photorealistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envMap = pmremGenerator.fromScene(roomEnv, 0.04).texture
    scene.environment = envMap

    // 5. Main 3D Kinetic Group
    const mainGroup = new THREE.Group()
    scene.add(mainGroup)

    // 6. Central Hero: Fluid Brand-Indigo Torus Knot
    const knotGeometry = new THREE.TorusKnotGeometry(1.2, 0.32, 140, 32, 2, 3)
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,            // Brand Indigo
      emissive: 0x1e1b4b,
      roughness: 0.15,
      metalness: 0.65,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    })
    const heroKnot = new THREE.Mesh(knotGeometry, knotMaterial)
    mainGroup.add(heroKnot)

    // 7. Refined Orbital Halo Ring
    const ringGeometry = new THREE.TorusGeometry(2.3, 0.02, 16, 100)
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2.8
    ring.rotation.y = Math.PI / 6
    mainGroup.add(ring)

    // 8. Soft Floating Accent Spheres
    const sphereMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xc7d2fe,
      roughness: 0.1,
      metalness: 0.4,
      clearcoat: 0.8,
    })
    const spheres = []
    const sphereGeom = new THREE.SphereGeometry(0.22, 24, 24)
    for (let i = 0; i < 3; i++) {
      const sp = new THREE.Mesh(sphereGeom, sphereMaterial)
      const angle = (i / 3) * Math.PI * 2
      const radius = 2.0
      sp.position.set(Math.cos(angle) * radius, (i === 1 ? -0.8 : 0.8), Math.sin(angle) * radius)
      sp.userData = { angle, radius, speed: 0.005 + i * 0.002, yBase: (i === 1 ? -0.8 : 0.8) }
      mainGroup.add(sp)
      spheres.push(sp)
    }

    // 9. Studio Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 5, 4)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(0xa5b4fc, 2.0, 10)
    fillLight.position.set(-4, -3, 3)
    scene.add(fillLight)

    // 10. Mouse Parallax
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetX = x * 0.6
      targetY = y * 0.5
    }

    window.addEventListener('mousemove', handleMouseMove)

    // 11. Responsive resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // 12. Animation loop
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      mouseX += (targetX - mouseX) * 0.04
      mouseY += (targetY - mouseY) * 0.04

      heroKnot.rotation.x = elapsed * 0.22
      heroKnot.rotation.y = elapsed * 0.3

      ring.rotation.z = -elapsed * 0.12

      mainGroup.rotation.y = mouseX * 0.45
      mainGroup.rotation.x = -mouseY * 0.35

      spheres.forEach((sp, idx) => {
        const u = sp.userData
        u.angle += u.speed
        sp.position.x = Math.cos(u.angle) * u.radius
        sp.position.z = Math.sin(u.angle) * u.radius
        sp.position.y = u.yBase + Math.sin(elapsed * 1.2 + idx) * 0.2
      })

      renderer.render(scene, camera)
    }

    animate()

    // 13. Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrameId)

      knotGeometry.dispose()
      knotMaterial.dispose()
      ringGeometry.dispose()
      ringMaterial.dispose()
      sphereGeom.dispose()
      sphereMaterial.dispose()
      envMap.dispose()
      pmremGenerator.dispose()

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="hidden lg:flex lg:w-1/2 h-screen max-h-screen bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border-r border-slate-200/80 p-6 xl:p-8 flex-col justify-between relative overflow-hidden shrink-0 select-none">
      
      {/* Top Header: Clean Brand Link */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <Activity className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 font-outfit">
            VibeHub
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] text-slate-600 font-medium shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Creator Community</span>
        </div>
      </div>

      {/* Middle: Clean SaaS Copy + Compact 3D Centerpiece */}
      <div className="my-auto py-1 flex flex-col items-center text-center relative z-10 max-w-sm mx-auto">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[11px] font-semibold text-indigo-600 mb-2">
          <span>Social Media for Creators</span>
        </div>

        <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit leading-snug mb-1.5">
          {headline}
        </h1>

        <p className="text-xs text-slate-500 font-light leading-relaxed mb-2 max-w-xs">
          {subheadline}
        </p>

        {/* 3D WebGL Canvas Centerpiece with soft ambient glow */}
        <div className="relative flex items-center justify-center my-0.5">
          <div className="absolute w-36 h-36 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />
          <div ref={canvasRef} className="w-48 h-48 xl:w-52 xl:h-52 relative z-10 cursor-grab active:cursor-grabbing" />
        </div>
      </div>

      {/* Bottom: Compact Testimonial & Social Proof */}
      <div className="space-y-2 relative z-10 max-w-md mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-3 rounded-xl shadow-xs text-left">
          <p className="text-[11px] text-slate-600 leading-relaxed italic mb-2">
            "{testimonial.quote}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                className="h-6 w-6 rounded-full object-cover ring-1 ring-indigo-500/20" 
                src={testimonial.avatar} 
                alt={testimonial.author} 
              />
              <div>
                <div className="text-[11px] font-semibold text-slate-800">{testimonial.author}</div>
                <div className="text-[10px] text-slate-400">{testimonial.role}</div>
              </div>
            </div>
            <div className="text-amber-400 text-xs tracking-wider">
              ★★★★★
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-light">
          <div className="flex -space-x-1">
            <img className="inline-block h-4 w-4 rounded-full ring-1 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80" alt="Avatar" />
            <img className="inline-block h-4 w-4 rounded-full ring-1 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Avatar" />
            <img className="inline-block h-4 w-4 rounded-full ring-1 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="Avatar" />
          </div>
          <span>Joined by over 50,000+ creators worldwide</span>
        </div>
      </div>

    </div>
  )
}

export default ThreeAuthBackground

