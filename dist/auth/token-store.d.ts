export interface StoredTokens {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt: number;
    patientId?: string;
    scope: string;
}
export declare function saveTokens(tokens: StoredTokens): void;
export declare function loadTokens(): StoredTokens | null;
export declare function clearTokens(): void;
export declare function getPatientId(): string;
