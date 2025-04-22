"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface ThreePanelLayoutProps {
  left: React.ReactNode
  center: React.ReactNode
  right: React.ReactNode
  className?: string
}

export function ThreePanelLayout({
  left,
  center,
  right,
  className,
}: ThreePanelLayoutProps) {
  return (
    <div className={cn("flex flex-col lg:flex-row min-h-screen w-full bg-background", className)}>
      {/* Left Panel - Navigation */}
      <div className="w-full lg:w-1/5 border-r border-border/60 bg-muted/5 overflow-y-auto flex-shrink-0 lg:max-w-[280px]">
        {left}
      </div>
      
      {/* Center Panel - Main Content */}
      <div className="w-full lg:w-3/5 overflow-y-auto flex-grow bg-background">
        {center}
      </div>
      
      {/* Right Panel - Help & Resources */}
      <div className="w-full lg:w-1/4 border-l border-border/60 bg-muted/5 overflow-y-auto flex-shrink-0 lg:max-w-[320px]">
        {right}
      </div>
    </div>
  )
}
