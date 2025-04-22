"use client"

import React, { useState, useEffect } from 'react'
import { Search, Loader2, FileText, StepForward, CheckCircle, Eye, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { getProductsByAssessmentId, getCertificationsByAssessmentId, getAssessmentById } from '@/lib/supabase'

export function WebsiteAnalysisCenter() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const [analysisAttempted, setAnalysisAttempted] = useState(false)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [certifications, setCertifications] = useState<any[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [processingStatus, setProcessingStatus] = useState<string | null>(null)

  // Function to fetch assessment results
  const fetchAssessmentResults = async (assessmentId: string) => {
    try {
      // Fetch assessment details
      const assessment = await getAssessmentById(assessmentId);
      
      // Update processing status for user feedback
      if (assessment) {
        setProcessingStatus(assessment.llm_status || 'processing');
      }
      
      if (assessment && assessment.llm_status === 'success') {
        // Fetch products
        const products = await getProductsByAssessmentId(assessmentId);
        setAnalysisResults(products);
        
        // Fetch certifications
        const certs = await getCertificationsByAssessmentId(assessmentId);
        setCertifications(certs);
        
        // Set summary if available
        if (assessment.summary) {
          setSummary(assessment.summary);
        }
        
        // Clear polling and loading state
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsAnalyzing(false);
        setIsRefreshing(false);
        setLastRefreshTime(new Date());
        return true;
      } else if (assessment && assessment.llm_status === 'failed') {
        // Handle failed analysis with more detailed error message
        const errorMessage = assessment.fallback_reason || 'Analysis failed. Please try again.';
        setError(errorMessage);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsAnalyzing(false);
        setIsRefreshing(false);
        return true;
      } else if (assessment && assessment.llm_status === 'partial') {
        // Handle partial success
        // We still fetch and display what we have, but show a warning
        const products = await getProductsByAssessmentId(assessmentId);
        setAnalysisResults(products);
        
        const certs = await getCertificationsByAssessmentId(assessmentId);
        setCertifications(certs);
        
        if (assessment.summary) {
          setSummary(assessment.summary);
        }
        
        // Show a warning but don't set as error
        setError('Some parts of the analysis were incomplete. Results may be limited.');
        
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsAnalyzing(false);
        setIsRefreshing(false);
        setLastRefreshTime(new Date());
        return true;
      }
      
      // Still processing
      return false;
    } catch (error) {
      console.error('Error fetching assessment results:', error);
      setError('Error fetching results. Please try again.');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsAnalyzing(false);
      setIsRefreshing(false);
      return true;
    }
  };
  
  // Function to manually refresh results
  const handleRefresh = async () => {
    if (!currentAssessmentId || isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Fetch the latest results
      await fetchAssessmentResults(currentAssessmentId);
    } catch (error) {
      console.error('Error refreshing results:', error);
      setError('Failed to refresh results. Please try again.');
      setIsRefreshing(false);
    }
  };
  
  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);
  
  const handleAnalyze = async () => {
    try {
      // Reset states
      setIsAnalyzing(true);
      setAnalysisAttempted(true);
      setAnalysisResults([]);
      setCertifications([]);
      setSummary(null);
      setError(null);
      setCurrentAssessmentId(null);
      
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      // Add validation for URL
      if (!url) {
        setError('Please enter a valid URL');
        setIsAnalyzing(false);
        return;
      }
      
      // Call the API to initiate website analysis
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze website');
      }
      
      // Store the assessment ID for polling
      setCurrentAssessmentId(data.assessmentId);
      
      // Start polling for results
      const interval = setInterval(async () => {
        if (data.assessmentId) {
          const completed = await fetchAssessmentResults(data.assessmentId);
          if (completed) {
            clearInterval(interval);
            setPollingInterval(null);
          }
        }
      }, 2000); // Poll every 2 seconds
      
      setPollingInterval(interval);
      
    } catch (error) {
      console.error('Error during website analysis:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col space-y-6 md:space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Website Analysis</h1>

      <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Start Your Analysis
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your website URL to identify products and potential compliance needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
            <Input
              type="url"
              placeholder="https://yourcompany.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow"
              disabled={isAnalyzing}
            />
            <Button
              onClick={handleAnalyze}
              disabled={!url || isAnalyzing}
              className="w-full md:w-auto"
            >
              {isAnalyzing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Analyze Website</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-[200px] transition-all">
        {isAnalyzing && (
          <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Content...
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Please wait while we process the website.
                {processingStatus && processingStatus !== 'processing' && (
                  <span className="ml-1 font-medium">
                    Status: {processingStatus}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Separator />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        )}

        {!isAnalyzing && analysisAttempted && analysisResults.length === 0 && !error && (
          <EmptyState
            title="No Products Found"
            description="We couldn't identify specific products from the URL provided. You can add products manually in the next step."
            icon={<Search className="h-12 w-12 text-muted-foreground/70" />}
          />
        )}
        
        {!isAnalyzing && error && (
          <Card className="bg-red-50 border border-red-200 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight flex items-center text-red-800">
                <AlertCircle className="mr-2 h-5 w-5" />
                Analysis Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleAnalyze}
                  variant="outline"
                  className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Search className="mr-2 h-4 w-4" /> Try Again
                </Button>
                {currentAssessmentId && (
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    className="bg-white border-red-300 text-red-700 hover:bg-red-50"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> Refresh Results</>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!isAnalyzing && !analysisAttempted && (
          <EmptyState
            title="No Analysis Yet"
            description="Enter a website URL above and click 'Analyze Website' to begin."
            icon={<FileText className="h-12 w-12 text-muted-foreground/70" />}
          />
        )}

        {!isAnalyzing && analysisResults.length > 0 && (
          <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Analysis Results
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Review the identified products. You can edit these in the next step.
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isRefreshing || !currentAssessmentId}
                >
                  {isRefreshing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Refresh</>
                  )}
                </Button>
              </div>
              {lastRefreshTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </p>
              )}
              {processingStatus === 'partial' && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <AlertCircle className="inline-block mr-1 h-4 w-4" />
                  Some parts of the analysis were incomplete. Results may be limited.
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Company Summary */}
              {summary && (
                <div className="bg-background p-3 rounded-md border">
                  <p className="text-xs uppercase font-medium text-muted-foreground pb-1">
                    Company Overview
                  </p>
                  <p className="text-sm">{summary}</p>
                </div>
              )}
              
              {/* Products List */}
              <div>
                <p className="text-xs uppercase font-medium text-muted-foreground pb-2">
                  Products ({analysisResults.length})
                </p>
                <ul className="space-y-2">
                  {analysisResults.map((product) => (
                    <li key={product.id} className="bg-background p-3 rounded-md border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                          )}
                        </div>
                        {product.classification && (
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            {product.classification}
                          </Badge>
                        )}
                      </div>
                      {product.estimated_hs_code && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">HS Code: </span>
                          <span className="font-mono">{product.estimated_hs_code}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Certifications */}
              {certifications.length > 0 && (
                <div>
                  <p className="text-xs uppercase font-medium text-muted-foreground pb-2">
                    Potential Certifications
                  </p>
                  <ul className="space-y-1">
                    {certifications.map((cert, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {cert.type}{cert.required_for ? ` (${cert.required_for.join(', ')})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="border-t border-muted pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs uppercase font-medium text-muted-foreground">
                    Analysis Complete
                  </p>
                  <Button size="sm" variant="outline">
                    <StepForward className="h-4 w-4 mr-2" />
                    Continue to Next Step
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-muted/50 border border-muted shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold transition-colors hover:bg-primary/90">1</div>
            <p className="font-medium">Analyze URL</p>
            <p className="text-sm text-muted-foreground">Enter your site URL. We scan it for product names and descriptions.</p>
          </div>
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold transition-colors hover:bg-primary/90">2</div>
            <p className="font-medium">Review Products</p>
            <p className="text-sm text-muted-foreground">We list potential products found. Confirm or edit this list.</p>
          </div>
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold transition-colors hover:bg-primary/90">3</div>
            <p className="font-medium">Get Classification</p>
            <p className="text-sm text-muted-foreground">Proceed to get HS codes and compliance details for your products.</p>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
