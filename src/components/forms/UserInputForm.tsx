import React, { useState } from 'react';

export interface UserInputFormProps {
  onSubmit: (data: { name: string; email: string; url: string }) => void;
  loading?: boolean;
}

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
const normalizeUrl = (value: string) => {
  if (!/^https?:\/\//i.test(value)) {
    return 'https://' + value;
  }
  return value;
};

const validateUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const UserInputForm: React.FC<UserInputFormProps> = ({ onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }
    const normalizedUrl = normalizeUrl(url.trim());
    if (!validateUrl(normalizedUrl)) {
      setError('Please enter a valid website URL (e.g. example.com or https://example.com)');
      return;
    }
    setError('');
    onSubmit({ name: name.trim(), email: email.trim(), url: normalizedUrl });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-semibold mb-1" htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
          required
        />
      </div>
      <div>
        <label className="block font-semibold mb-1" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
          required
        />
      </div>
      <div>
        <label className="block font-semibold mb-1" htmlFor="url">Website URL</label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="https://yourbusiness.com"
          disabled={loading}
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Starting...' : 'Start Assessment'}
      </button>
    </form>
  );
};

export default UserInputForm;
