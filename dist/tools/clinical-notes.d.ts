import { z } from 'zod';
export declare const clinicalNotesInputSchema: z.ZodObject<{
    count: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    count: number;
}, {
    count?: number | undefined;
}>;
type Input = z.infer<typeof clinicalNotesInputSchema>;
export declare function clinicalNotesHandler(input: Input): Promise<string>;
export {};
