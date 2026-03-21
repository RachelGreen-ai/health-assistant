import { z } from 'zod';
export declare const appointmentsInputSchema: z.ZodObject<{
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    count: number;
}, {
    count?: number | undefined;
}>;
type Input = z.infer<typeof appointmentsInputSchema>;
export declare function appointmentsHandler(input: Input): Promise<string>;
export {};
