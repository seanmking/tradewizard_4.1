"use client"

import { useState, useEffect } from "react"

interface SarahAvatarProps {
  size?: "sm" | "md" | "lg"
  state?: "idle" | "speaking" | "listening" | "processing"
}

export default function SarahAvatarAbstract({ size = "md", state = "idle" }: SarahAvatarProps) {
  const [rotation, setRotation] = useState(0)
  const [glowIntensity, setGlowIntensity] = useState(0.5)

  // Animate based on state
  useEffect(() => {
    if (state === "processing") {
      const interval = setInterval(() => {
        setRotation((prev) => (prev + 2) % 360)
      }, 50)
      return () => clearInterval(interval)
    } else if (state === "speaking") {
      const interval = setInterval(() => {
        setGlowIntensity((prev) => {
          const newValue = prev + (Math.random() * 0.1 - 0.05)
          return Math.max(0.4, Math.min(0.8, newValue))
        })
        setRotation((prev) => (prev + 0.5) % 360)
      }, 100)
      return () => clearInterval(interval)
    } else if (state === "idle") {
      const interval = setInterval(() => {
        setGlowIntensity((prev) => {
          const newValue = prev + (Math.random() * 0.02 - 0.01)
          return Math.max(0.4, Math.min(0.6, newValue))
        })
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setGlowIntensity(0.7)
    }
  }, [state])

  // Size classes
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-amber-500 blur-md transition-opacity duration-300"
        style={{ opacity: glowIntensity * 0.7 }}
      ></div>

      {/* Avatar container */}
      <div className="absolute inset-0 rounded-full overflow-hidden border-2 border-white bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5" style={{ transform: `rotate(${rotation}deg)` }}>
          {/* Compass rose base */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="#4B5563" strokeWidth="1" />

          {/* Compass cardinal points */}
          <path d="M50,10 L50,20" stroke="#E5E7EB" strokeWidth="2" />
          <path d="M50,80 L50,90" stroke="#E5E7EB" strokeWidth="2" />
          <path d="M10,50 L20,50" stroke="#E5E7EB" strokeWidth="2" />
          <path d="M80,50 L90,50" stroke="#E5E7EB" strokeWidth="2" />

          {/* Compass intercardinal points */}
          <path d="M25,25 L30,30" stroke="#9CA3AF" strokeWidth="1" />
          <path d="M75,25 L70,30" stroke="#9CA3AF" strokeWidth="1" />
          <path d="M25,75 L30,70" stroke="#9CA3AF" strokeWidth="1" />
          <path d="M75,75 L70,70" stroke="#9CA3AF" strokeWidth="1" />

          {/* Light beams */}
          <g opacity={glowIntensity}>
            <path d="M50,30 L60,10" stroke="#3B82F6" strokeWidth="2" />
            <path d="M50,30 L40,10" stroke="#3B82F6" strokeWidth="2" />
            <path d="M70,50 L90,45" stroke="#F97316" strokeWidth="2" />
            <path d="M70,50 L90,55" stroke="#F97316" strokeWidth="2" />
            <path d="M50,70 L60,90" stroke="#3B82F6" strokeWidth="2" />
            <path d="M50,70 L40,90" stroke="#3B82F6" strokeWidth="2" />
            <path d="M30,50 L10,45" stroke="#F97316" strokeWidth="2" />
            <path d="M30,50 L10,55" stroke="#F97316" strokeWidth="2" />
          </g>

          {/* Central elements */}
          <circle cx="50" cy="50" r="15" fill="url(#gradientBlueAmber)" />
          <circle cx="50" cy="50" r="10" fill="#1E3A8A" />
          <text x="50" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            S
          </text>

          {/* Needle */}
          <path
            d="M50,25 L53,50 L50,75 L47,50 Z"
            fill="#F97316"
            style={{ transformOrigin: "center", transform: `rotate(${-rotation * 0.5}deg)` }}
          />

          {/* Definitions */}
          <defs>
            <linearGradient id="gradientBlueAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Status indicator */}
      {state === "processing" && (
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2/3 h-2/3 rounded-full bg-white animate-pulse"></div>
        </div>
      )}
      {state === "listening" && (
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  )
}
