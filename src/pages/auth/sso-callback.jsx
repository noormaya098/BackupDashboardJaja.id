import React, { useEffect, useState, useRef } from "react";

export const SSOCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Mencegah multiple execution
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    // New simplified flow:
    // - If token exists in URL -> save and redirect to dashboard
    // - Otherwise -> redirect to SSO provider (with redirect_uri pointing back here)

    const getParams = () => {
      if (window.location.search && window.location.search.length > 1) {
        return new URLSearchParams(window.location.search);
      }
      if (window.location.hash && window.location.hash.length > 1) {
        const hash = window.location.hash;
        const qIndex = hash.indexOf('?');
        const qs = qIndex !== -1 ? hash.slice(qIndex) : hash.replace(/^#/, '?');
        return new URLSearchParams(qs);
      }
      return new URLSearchParams('');
    };

    const redirectToSSO = () => {
      const client = 'jaja';
      // IMPORTANT: redirect_uri must point to this app so we can capture the token
      const redirectUri = encodeURIComponent(`${window.location.origin}/nimda/sso-login`);
      const ssoUrl = `https://sso.eurekagroup.id/?redirect_uri=${redirectUri}&client=${client}`;
      console.log('Redirecting to SSO:', ssoUrl);
      try {
        window.location.replace(ssoUrl);
      } catch (err) {
        window.location.href = ssoUrl;
      }
    };

    const params = getParams();
    const tokenSSO = params.get('token') || params.get('access_token');
    const userParam = params.get('user');

    // If token is present in URL, save it
    if (tokenSSO) {
      console.log('Found token in URL:', tokenSSO);
      try {
        // Save several keys for compatibility
        localStorage.setItem('Token', tokenSSO); // raw token
        localStorage.setItem('token', `Bearer ${tokenSSO}`); // Bearer form
        localStorage.setItem('rawToken', tokenSSO);
          // mark creation time so clearExpiredToken won't immediately clear it
          localStorage.setItem('tokenCreatedAt', Date.now().toString());
        // store client/test keys similar to your snippet
        localStorage.setItem('test', 'jaja');
        localStorage.setItem('test1', window.location.pathname || '/');
      } catch (e) {
        console.error('Error saving tokens to localStorage', e);
      }

      if (userParam) {
        try {
          const decoded = decodeURIComponent(userParam);
          try {
            const parsed = JSON.parse(decoded);
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (_) {
            localStorage.setItem('user', decoded);
          }
        } catch (e) {
          localStorage.setItem('user', userParam);
        }
      }

      // set expiry (8 hours)
      const expiryTime = Date.now() + 8 * 60 * 60 * 1000;
      localStorage.setItem('expiry', expiryTime.toString());

      console.log('Saved keys:', {
        Token: localStorage.getItem('Token'),
        token: localStorage.getItem('token'),
        rawToken: localStorage.getItem('rawToken'),
      });

      // Remove token params from URL for cleanliness
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('user');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      } catch (e) {
        // ignore
      }

      // Redirect to dashboard (local). If you want external dashboard, replace location accordingly.
      window.location.href = '/nimda/dashboard/home';
      return;
    }

    // No token -> redirect to SSO provider
    redirectToSSO();

    // set processing false (not strictly necessary since we navigate away)
    setIsProcessing(false);

    return () => clearTimeout(timeoutId);
  }, []); // Hapus navigate dari dependency untuk mencegah re-render

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>Processing SSO Login...</div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        {localStorage.getItem("token") ? 
          "Token found! Redirecting to dashboard in 2 seconds..." : 
          "Please wait while we redirect you..."
        }
      </div>
    </div>
  );
};

export default SSOCallback;

