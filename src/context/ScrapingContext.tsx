// src/context/ScrapingContext.tsx

import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { fetchLatestScrapedData, triggerNewScrape, subscribeToAssessmentData } from '../services/scrapingApiService';
import type { MCPData } from '../types/MCPData';
import type { ScrapingError } from '../types/ScrapingError';

// --- Context Definition ---
interface IScrapingContext {
  scrapedData: MCPData | null;
  isLoading: boolean;
  error: ScrapingError | null;
  isInitialState: boolean; // Flag for empty/initial state (no data fetched or available yet)
  refreshScrapeData: () => Promise<void>; // Manually trigger a data refresh
  startNewScrape: (targetUrl: string) => Promise<void>; // Trigger a new scrape job
}

const ScrapingContext = createContext<IScrapingContext | undefined>(undefined);

// --- Provider Props Definition ---
interface ScrapingProviderProps {
  children: ReactNode;
  assessmentId: string; // Required prop to scope data
  supabaseClient: SupabaseClient; // Required for real-time subscriptions
}

// --- Provider Implementation ---
export const ScrapingProvider: React.FC<ScrapingProviderProps> = ({ children, assessmentId, supabaseClient }) => {
  const [scrapedData, setScrapedData] = useState<MCPData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<ScrapingError | null>(null);
  const [isInitialState, setIsInitialState] = useState<boolean>(true); // Assume initial state until data loads or fails
  const [currentChannel, setCurrentChannel] = useState<RealtimeChannel | null>(null);

  // Function to load data for the current assessmentId
  const loadData = useCallback(async (id: string) => {
    if (!id) {
      console.warn("[ScrapingProvider] No assessmentId provided.");
      setIsInitialState(true);
      setIsLoading(false);
      setScrapedData(null);
      setError(null);
      return;
    }

    console.log(`[ScrapingProvider] Loading data for assessment: ${id}`);
    setIsLoading(true);
    setError(null);
    setIsInitialState(false); // Attempting to load

    try {
      const data = await fetchLatestScrapedData(id);
      setScrapedData(data);
      // If assessment exists but has no data yet, it's still initial state
      setIsInitialState(!data);
      console.log(`[ScrapingProvider] Data loaded for ${id}. Initial State: ${!data}`);
    } catch (err: any) {
      console.error(`[ScrapingProvider] Error loading data for ${id}:`, err);
      const mappedError: ScrapingError = {
        message: err.message || 'Failed to fetch scraped data',
        code: err.code || 'FETCH_FAILED',
        retryable: err.retryable ?? true,
        resolutionHint: err.resolutionHint || 'Please try refreshing or check the assessment ID.',
      };
      setError(mappedError);
      setScrapedData(null);
      setIsInitialState(false); // It's an error state, not initial
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial load and managing real-time subscription
  useEffect(() => {
    if (!assessmentId || !supabaseClient) {
      console.warn('[ScrapingProvider] Missing assessmentId or supabaseClient. Cannot initialize.');
      setIsLoading(false);
      setIsInitialState(true);
      // Clean up any existing channel if props change unexpectedly
      if (currentChannel) {
          console.log(`[ScrapingProvider] Unsubscribing from previous channel due to prop change.`);
          currentChannel.unsubscribe();
          setCurrentChannel(null);
      }
      return;
    }

    console.log(`[ScrapingProvider] Initializing for assessment: ${assessmentId}`);
    // Load initial data
    loadData(assessmentId);

    // Unsubscribe from previous channel if assessmentId changes
    if (currentChannel) {
      console.log(`[ScrapingProvider] Unsubscribing from previous channel for assessment: ${currentChannel.topic}`);
      currentChannel.unsubscribe();
    }

    // Subscribe to new channel
    console.log(`[ScrapingProvider] Setting up new subscription for assessment: ${assessmentId}`);
    const newChannel = subscribeToAssessmentData(supabaseClient, assessmentId, (newData) => {
      console.log(`[ScrapingProvider] Real-time update received for assessment: ${assessmentId}`, newData);
      setScrapedData(newData);
      setError(null); // Clear error on successful update
      setIsInitialState(!newData); // Update initial state based on data
      setIsLoading(false); // Stop loading if an update comes in
    });

    setCurrentChannel(newChannel);

    // Cleanup function
    return () => {
      if (newChannel) {
        console.log(`[ScrapingProvider] Unsubscribing from channel for assessment: ${assessmentId} on cleanup`);
        newChannel.unsubscribe();
        setCurrentChannel(null);
      }
    };
  }, [assessmentId, supabaseClient, loadData]); // Rerun if assessmentId or supabaseClient changes

  // Function to manually refresh data
  const refreshScrapeData = useCallback(async () => {
    console.log(`[ScrapingProvider] Manual refresh triggered for assessment: ${assessmentId}`);
    await loadData(assessmentId);
  }, [loadData, assessmentId]);

  // Function to trigger a new scrape job
  const startNewScrape = useCallback(async (targetUrl: string) => {
    if (!assessmentId) {
        setError({ message: 'Cannot start scrape without an Assessment ID.', code: 'MISSING_ID' });
        return;
    }
    console.log(`[ScrapingProvider] Starting new scrape for assessment: ${assessmentId}, URL: ${targetUrl}`);
    setIsLoading(true); // Show loading indicator while triggering
    setError(null);
    try {
      await triggerNewScrape(assessmentId, targetUrl);
      // Don't set loading false here; wait for the real-time update or manual refresh
      console.log(`[ScrapingProvider] Scrape trigger sent. Waiting for real-time update...`);
    } catch (err: any) {
      console.error(`[ScrapingProvider] Error triggering scrape for ${assessmentId}:`, err);
      const mappedError: ScrapingError = {
        message: err.message || 'Failed to start scrape',
        code: err.code || 'TRIGGER_FAILED',
        retryable: err.retryable ?? false,
        resolutionHint: err.resolutionHint || 'Could not start the scraping process. Please check the URL or try again later.',
      };
      setError(mappedError);
      setIsLoading(false); // Stop loading on trigger error
    }
  }, [assessmentId]);

  // --- Context Value ---
  const value = {
    scrapedData,
    isLoading,
    error,
    isInitialState,
    refreshScrapeData,
    startNewScrape,
  };

  return <ScrapingContext.Provider value={value}>{children}</ScrapingContext.Provider>;
};

// --- Custom Hook ---
export const useScraping = (): IScrapingContext => {
  const context = useContext(ScrapingContext);
  if (context === undefined) {
    throw new Error('useScraping must be used within a ScrapingProvider');
  }
  return context;
};
