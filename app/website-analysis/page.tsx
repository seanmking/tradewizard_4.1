import React from 'react'
import { WebsiteAnalysisLeft } from '@/components/website-analysis-left'
import { WebsiteAnalysisCenter } from '@/components/website-analysis-center'
import { WebsiteAnalysisRight } from '@/components/website-analysis-right'

export default function WebsiteAnalysisPage() {
  return (
    <div className="min-h-screen bg-muted/50 p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-[20%_55%_25%] gap-6 md:gap-8">
        <WebsiteAnalysisLeft />
        <WebsiteAnalysisCenter />
        <WebsiteAnalysisRight />
      </div>
    </div>
  )
}
