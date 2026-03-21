export interface CallbackResult {
    code: string;
    state: string;
    port: number;
}
/**
 * Start a one-shot local HTTP server on a random port.
 * Returns a Promise that resolves with the OAuth callback code + state,
 * or rejects after TIMEOUT_MS.
 *
 * The caller uses the resolved `port` to build the redirect_uri sent to Epic.
 */
export declare function startCallbackServer(expectedState: string): Promise<CallbackResult>;
export declare function startCallbackServerWithPort(expectedState: string): {
    port: Promise<number>;
    result: Promise<CallbackResult>;
};
