import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function ApplicationLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const client = 'jaja';
    // Simpan token ke localStorage dan redirect hanya jika token ada
    if (token) {
      localStorage.setItem('test1', token);
      localStorage.setItem('test', client);
      localStorage.setItem('token', token);
      localStorage.setItem("tokenCreatedAt", Date.now().toString());

      // Loading 2 detik sebelum redirect ke dashboard
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard/home");
      }, 2000);
    } else {
      // Tidak ada token => SSO callback dipanggil tanpa token. Tampilkan halaman login manual.
      console.warn('Token tidak ditemukan di URL. Menampilkan login manual.');
      setLoading(false);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {loading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#438196] mx-auto mb-4"></div>
          <p className="text-gray-600">Memproses autentikasi...</p>
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded shadow">
          <h3 className="text-lg font-semibold mb-4">SSO saat ini dinonaktifkan</h3>
          <p className="text-sm text-gray-600 mb-4">Silakan gunakan login manual untuk saat ini.</p>
          <div className="flex justify-center gap-2">
            <a href="/auth/sign-in" className="px-4 py-2 bg-blue-600 text-white rounded">Halaman Sign In</a>
            <button onClick={() => { window.location.href = '/'; }} className="px-4 py-2 bg-gray-200 rounded">Kembali</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationLogin;


