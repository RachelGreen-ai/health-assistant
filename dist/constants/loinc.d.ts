/**
 * LOINC codes for lab panels relevant to cancer and complex care patients.
 * Single source of truth — never hardcode these in parsers or tools.
 */
export declare const LOINC: {
    readonly WBC: "6690-2";
    readonly ANC: "26499-4";
    readonly HEMOGLOBIN: "718-7";
    readonly HEMATOCRIT: "4544-3";
    readonly PLATELETS: "777-3";
    readonly RBC: "789-8";
    readonly MCV: "787-2";
    readonly MCH: "785-6";
    readonly MCHC: "786-4";
    readonly SODIUM: "2951-2";
    readonly POTASSIUM: "2823-3";
    readonly CHLORIDE: "2075-0";
    readonly CO2: "2028-9";
    readonly BUN: "3094-0";
    readonly CREATININE: "2160-0";
    readonly GLUCOSE: "2345-7";
    readonly CALCIUM: "17861-6";
    readonly TOTAL_PROTEIN: "2885-2";
    readonly ALBUMIN: "1751-7";
    readonly TOTAL_BILI: "1975-2";
    readonly ALT: "1742-6";
    readonly AST: "1920-8";
    readonly ALK_PHOS: "6768-6";
    readonly CEA: "2039-6";
    readonly CA_125: "10334-1";
    readonly PSA: "2857-1";
    readonly AFP: "1834-1";
    readonly CA_19_9: "24108-3";
    readonly CA_15_3: "85319-2";
    readonly LDH: "2532-0";
    readonly BETA_HCG: "21198-7";
};
export type LoincCode = typeof LOINC[keyof typeof LOINC];
export type LabPanel = 'CBC' | 'CMP' | 'TUMOR_MARKERS';
export declare const PANEL_CODES: Record<LabPanel, string[]>;
export declare const LOINC_DISPLAY: Record<string, string>;
export declare const CHEMO_DRUG_KEYWORDS: string[];
export declare const PROPHYLAXIS_KEYWORDS: string[];
export declare const SUPPORTIVE_KEYWORDS: string[];
