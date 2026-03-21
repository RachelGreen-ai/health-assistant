import { z } from 'zod';
export declare const authorizeInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare function authorizeHandler(): Promise<string>;
