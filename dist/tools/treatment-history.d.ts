import { z } from 'zod';
export declare const treatmentHistoryInputSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
type Input = z.infer<typeof treatmentHistoryInputSchema>;
export declare function treatmentHistoryHandler(input: Input): Promise<string>;
export {};
