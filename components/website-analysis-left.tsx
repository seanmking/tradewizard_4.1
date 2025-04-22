"use client"

import React from 'react'
import { CheckCircle, Circle, Dot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Example state - you'll need to manage this based on application logic
const currentStep = 1; // 0: Enter Website, 1: Review Products, 2: Confirm Certs

const steps = [
  { name: "Enter Website", id: 0 },
  { name: "Review Products", id: 1 },
  { name: "Confirm Certifications", id: 2 },
];

export function WebsiteAnalysisLeft() {
  return (
    <Card className="h-full bg-muted/50 border border-muted shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          Analysis Steps
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground pt-1">
          Follow these steps to complete your analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <nav aria-label="Progress">
          <ol role="list" className="space-y-6">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className="relative flex items-start">
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-border" aria-hidden="true" />
                ) : null}
                
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background border border-border">
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : step.id === currentStep ? (
                     <Dot className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
                  )}
                </div>
                
                <div className="ml-4 flex flex-col">
                   <span className={`text-sm font-medium ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.name}
                  </span>
                   {/* Optional: Add description here if needed */}
                 </div>
              </li>
            ))}
          </ol>
        </nav>
      </CardContent>
    </Card>
  );
}
