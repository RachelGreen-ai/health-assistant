import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    clientId: z.ZodString;
    redirectUri: z.ZodString;
    baseUrl: z.ZodString;
    authUrl: z.ZodString;
    tokenUrl: z.ZodString;
    tokenFilePath: z.ZodString;
    distanceThresholdMiles: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    redirectUri: string;
    baseUrl: string;
    authUrl: string;
    tokenUrl: string;
    tokenFilePath: string;
    distanceThresholdMiles: number;
}, {
    clientId: string;
    redirectUri: string;
    baseUrl: string;
    authUrl: string;
    tokenUrl: string;
    tokenFilePath: string;
    distanceThresholdMiles: number;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare const config: Config;
export {};
