// Return a normalized Authorization header value (or null)
export function getAuthHeader() {
  // check multiple possible storage keys used in app
  const possibleKeys = ['token', 'Token', 'rawToken', 'rawtoken'];
  let token = null;
  for (const k of possibleKeys) {
    const v = localStorage.getItem(k);
    if (v && v !== 'null' && v !== 'undefined') {
      token = v;
      break;
    }
  }

  if (!token || token === 'null' || token === 'undefined') return null;

  // If token is an object-serialized string like '"Bearer ..."' strip quotes
  if (typeof token === 'string' && token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1);
  }

  // Sometimes the token is stored already with the Bearer prefix
  if (token.startsWith('Bearer ')) return token;

  return `${token}`;
}

export default getAuthHeader;
