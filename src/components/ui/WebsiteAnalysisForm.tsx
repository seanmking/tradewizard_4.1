import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAppContext } from '../../contexts/AppContext';

const WebsiteAnalysisForm: React.FC = () => {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  const url = state.user?.url || '';

  // Analyze website by calling backend API
  const handleAnalyze = async () => {
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to analyze website.');
        return;
      }
      setResult(data.data);
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'Failed to analyze website.');
    }
  };

  // Confirm and save extracted info
  const handleConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      await fetch('/api/save-extracted-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: state.user?.assessmentId,
          businessInfo: result,
        }),
      });
      dispatch({ type: 'SET_EXTRACTED_INFO', payload: result });
      setConfirmed(true);
      setTimeout(() => router.push('/product-classification'), 1200);
    } catch (e: any) {
      setError(e.message || 'Failed to save extracted info.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <div className="mb-6">
        <label className="block font-semibold mb-2">Business Website URL</label>
        <input
          type="url"
          value={url}
          disabled
          className="w-full border border-neutral-300 rounded px-3 py-2 mb-2 bg-gray-100 cursor-not-allowed"
        />
      </div>
      {error && (
        <div className="text-red-600 text-sm mb-2 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}
      {!result && !loading && (
        <button
          type="button"
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition disabled:opacity-50"
          disabled={loading}
          onClick={handleAnalyze}
        >
          Analyze Website
        </button>
      )}
      {loading && (
        <div className="text-primary font-semibold">Analyzing...</div>
      )}
      {result && (
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded">
          <div className="font-bold text-lg mb-2">Results</div>
          <div className="mb-2">
            <label className="font-semibold block mb-1">Business Name</label>
            <input
              type="text"
              value={result.businessName}
              onChange={e => setResult({ ...result, businessName: e.target.value })}
              className="w-full border border-neutral-300 rounded px-2 py-1"
            />
            <span className="text-xs text-green-600 ml-2">Confidence: 92%</span>
          </div>
          <div className="mb-2">
            <label className="font-semibold block mb-1">Description</label>
            <textarea
              value={result.description}
              onChange={e => setResult({ ...result, description: e.target.value })}
              className="w-full border border-neutral-300 rounded px-2 py-1"
              rows={3}
            />
            <span className="text-xs text-green-600 ml-2">Confidence: 87%</span>
          </div>
          <button
            type="button"
            className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition disabled:opacity-50"
            disabled={loading || confirmed}
            onClick={handleConfirm}
          >
            {confirmed ? 'Confirmed! Redirecting...' : 'Confirm & Continue'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WebsiteAnalysisForm;
