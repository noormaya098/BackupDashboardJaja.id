// Check if the token is expired.
// Priority: if backend provides an explicit `expiry` timestamp in localStorage, use it.
// Otherwise fall back to the legacy `tokenCreatedAt` + 24h rule.
export const isTokenExpired = () => {
  const token = localStorage.getItem("token");
  const expiry = localStorage.getItem("expiry");
  const tokenCreatedAt = localStorage.getItem("tokenCreatedAt");

  if (!token) return true; // no token

  // If backend provided an absolute expiry timestamp (ms since epoch), use it
  if (expiry) {
    const expNum = Number(expiry);
    if (Number.isFinite(expNum)) {
      return Date.now() > expNum;
    }
    // if expiry exists but is invalid, treat as expired to be safe
    return true;
  }

  // Fallback: if tokenCreatedAt exists, consider token valid for 24 hours
  if (!tokenCreatedAt) return true;

  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const tokenAge = Date.now() - parseInt(tokenCreatedAt, 10);

  return tokenAge > oneDayInMs;
};

// Clear localStorage if token is expired
export const clearExpiredToken = () => {
  if (isTokenExpired()) {
    localStorage.clear();
    return true;
  }
  return false;
};