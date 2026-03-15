import { randomBytes, createHash } from 'crypto';

export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/** Generate a PKCE code verifier + S256 challenge pair. */
export function generatePkce(): PkceChallenge {
  // RFC 7636: verifier is 43-128 unreserved chars. 32 random bytes -> 43 base64url chars.
  const codeVerifier = randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge, codeChallengeMethod: 'S256' };
}
