import { z } from 'zod';
export declare const labTrendsInputSchema: z.ZodObject<{
    panels: z.ZodString;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    maxResults: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    panels: string;
    maxResults: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    panels: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    maxResults?: number | undefined;
}>;
type RawInput = z.infer<typeof labTrendsInputSchema>;
export declare function labTrendsHandler(raw: RawInput): Promise<string>;
export {};
