import React, { useState } from 'react';
import { analyzeWebsite } from '../../lib/openai';

const WebsiteAnalysisForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const validateUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    const res = await analyzeWebsite(url);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to analyze website.');
      return;
    }
    setResult(res.data);
  };

  return (
    <form className="max-w-xl mx-auto mt-8 p-6 bg-white rounded shadow" onSubmit={handleSubmit}>
      <label htmlFor="website-url" className="block font-semibold mb-2">Business Website URL</label>
      <input
        id="website-url"
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        className="w-full border border-neutral-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="https://yourbusiness.com"
        required
        disabled={loading}
      />
      {error && (
        <div className="text-red-600 text-sm mb-2 flex items-center justify-between">
          <span>{error}</span>
          {result === null && (
            <button
              type="button"
              className="ml-2 text-xs underline text-primary"
              onClick={() => { setUrl(''); setError(''); setResult(null); }}
            >
              Reset
            </button>
          )}
        </div>
      )}
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Website'}
      </button>
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
        </div>
      )}
    </form>
  );
};

export default WebsiteAnalysisForm;
