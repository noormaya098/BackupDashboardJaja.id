import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO: replace the endpoint below with your real auth endpoint
    // Example:
    // const res = await fetch('https://apidev.jaja.id/nimda/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    // const data = await res.json();
    // if (data.token) { localStorage.setItem('token', data.token); localStorage.setItem('tokenCreatedAt', Date.now().toString()); navigate('/dashboard/home'); }

    // For now we only simulate success for development
    setTimeout(() => {
      // simulate token
      const fakeToken = 'fake-jwt-token-for-' + (email || 'user');
      localStorage.setItem('token', fakeToken);
      localStorage.setItem('tokenCreatedAt', Date.now().toString());
      setLoading(false);
      navigate('/dashboard/home');
    }, 800);
  };

  const handlePasteToken = (e) => {
    e.preventDefault();
    if (!tokenInput) return;
    localStorage.setItem('token', tokenInput.startsWith('Bearer ') ? tokenInput : tokenInput);
    localStorage.setItem('tokenCreatedAt', Date.now().toString());
    navigate('/dashboard/home');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-semibold mb-4">Login Manual</h2>

        <form onSubmit={handleSubmitCredentials}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 block w-full border rounded px-3 py-2" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1 block w-full border rounded px-3 py-2" required />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
        </form>

        <div className="my-4 border-t pt-4">
          <h3 className="text-sm font-medium mb-2">Atau tempel token (untuk pengujian)</h3>
          <form onSubmit={handlePasteToken}>
            <textarea value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Masukkan JWT di sini" className="w-full border rounded px-3 py-2 mb-2" rows={3}></textarea>
            <div className="flex justify-between items-center">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Gunakan Token</button>
              <button type="button" onClick={() => { setTokenInput(''); }} className="px-3 py-1 bg-gray-200 rounded">Bersihkan</button>
            </div>
          </form>
        </div>

        <div className="text-sm text-gray-500 mt-4">SSO masih tersedia di <code>/application/login</code> dan <code>/auth/sso-callback</code> jika diperlukan nanti.</div>
      </div>
    </div>
  );
}
