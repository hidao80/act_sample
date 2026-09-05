declare global {
  interface Window {
    __ACCESS_TOKEN__?: string;
  }
}

export function authHeaders(): HeadersInit {
  const token = window.__ACCESS_TOKEN__;
  return token ? { Authorization: `Basic ${token}` } : {};
}
