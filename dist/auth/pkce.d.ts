export interface PkceChallenge {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256';
}
/** Generate a PKCE code verifier + S256 challenge pair. */
export declare function generatePkce(): PkceChallenge;
