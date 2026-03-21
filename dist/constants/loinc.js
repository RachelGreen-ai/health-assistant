/**
 * LOINC codes for lab panels relevant to cancer and complex care patients.
 * Single source of truth — never hardcode these in parsers or tools.
 */
export const LOINC = {
    // CBC
    WBC: '6690-2',
    ANC: '26499-4', // Absolute Neutrophil Count — critical for chemo
    HEMOGLOBIN: '718-7',
    HEMATOCRIT: '4544-3',
    PLATELETS: '777-3',
    RBC: '789-8',
    MCV: '787-2',
    MCH: '785-6',
    MCHC: '786-4',
    // CMP
    SODIUM: '2951-2',
    POTASSIUM: '2823-3',
    CHLORIDE: '2075-0',
    CO2: '2028-9',
    BUN: '3094-0',
    CREATININE: '2160-0',
    GLUCOSE: '2345-7',
    CALCIUM: '17861-6',
    TOTAL_PROTEIN: '2885-2',
    ALBUMIN: '1751-7',
    TOTAL_BILI: '1975-2',
    ALT: '1742-6',
    AST: '1920-8',
    ALK_PHOS: '6768-6',
    // Tumor markers
    CEA: '2039-6',
    CA_125: '10334-1',
    PSA: '2857-1',
    AFP: '1834-1',
    CA_19_9: '24108-3',
    CA_15_3: '85319-2',
    LDH: '2532-0',
    BETA_HCG: '21198-7',
};
export const PANEL_CODES = {
    CBC: [
        LOINC.WBC,
        LOINC.ANC,
        LOINC.HEMOGLOBIN,
        LOINC.HEMATOCRIT,
        LOINC.PLATELETS,
        LOINC.RBC,
    ],
    CMP: [
        LOINC.SODIUM,
        LOINC.POTASSIUM,
        LOINC.CHLORIDE,
        LOINC.CO2,
        LOINC.BUN,
        LOINC.CREATININE,
        LOINC.GLUCOSE,
        LOINC.CALCIUM,
        LOINC.TOTAL_PROTEIN,
        LOINC.ALBUMIN,
        LOINC.TOTAL_BILI,
        LOINC.ALT,
        LOINC.AST,
        LOINC.ALK_PHOS,
    ],
    TUMOR_MARKERS: [
        LOINC.CEA,
        LOINC.CA_125,
        LOINC.PSA,
        LOINC.AFP,
        LOINC.CA_19_9,
        LOINC.CA_15_3,
        LOINC.LDH,
        LOINC.BETA_HCG,
    ],
};
// Human-readable display names for LOINC codes
export const LOINC_DISPLAY = {
    [LOINC.WBC]: 'WBC',
    [LOINC.ANC]: 'ANC',
    [LOINC.HEMOGLOBIN]: 'Hemoglobin',
    [LOINC.HEMATOCRIT]: 'Hematocrit',
    [LOINC.PLATELETS]: 'Platelets',
    [LOINC.RBC]: 'RBC',
    [LOINC.MCV]: 'MCV',
    [LOINC.MCH]: 'MCH',
    [LOINC.MCHC]: 'MCHC',
    [LOINC.SODIUM]: 'Sodium',
    [LOINC.POTASSIUM]: 'Potassium',
    [LOINC.CHLORIDE]: 'Chloride',
    [LOINC.CO2]: 'CO2',
    [LOINC.BUN]: 'BUN',
    [LOINC.CREATININE]: 'Creatinine',
    [LOINC.GLUCOSE]: 'Glucose',
    [LOINC.CALCIUM]: 'Calcium',
    [LOINC.TOTAL_PROTEIN]: 'Total Protein',
    [LOINC.ALBUMIN]: 'Albumin',
    [LOINC.TOTAL_BILI]: 'Total Bilirubin',
    [LOINC.ALT]: 'ALT',
    [LOINC.AST]: 'AST',
    [LOINC.ALK_PHOS]: 'Alkaline Phosphatase',
    [LOINC.CEA]: 'CEA',
    [LOINC.CA_125]: 'CA-125',
    [LOINC.PSA]: 'PSA',
    [LOINC.AFP]: 'AFP',
    [LOINC.CA_19_9]: 'CA 19-9',
    [LOINC.CA_15_3]: 'CA 15-3',
    [LOINC.LDH]: 'LDH',
    [LOINC.BETA_HCG]: 'Beta-hCG',
};
// Known chemo/immunotherapy drug name fragments for medication classification
export const CHEMO_DRUG_KEYWORDS = [
    'cyclophosphamide', 'carboplatin', 'cisplatin', 'oxaliplatin',
    'paclitaxel', 'docetaxel', 'vincristine', 'vinblastine',
    'doxorubicin', 'epirubicin', 'idarubicin',
    'fluorouracil', '5-fu', 'capecitabine',
    'gemcitabine', 'cytarabine', 'methotrexate',
    'rituximab', 'trastuzumab', 'bevacizumab', 'pembrolizumab',
    'nivolumab', 'atezolizumab', 'ipilimumab',
    'bortezomib', 'carfilzomib', 'lenalidomide', 'pomalidomide', 'thalidomide',
    'imatinib', 'dasatinib', 'nilotinib', 'ibrutinib', 'venetoclax',
    'etoposide', 'ifosfamide', 'busulfan', 'melphalan',
    'axicabtagene', 'tisagenlecleucel', 'lisocabtagene', // CAR-T
    'bleomycin', 'temozolomide', 'hydroxyurea',
    'azacitidine', 'decitabine',
];
export const PROPHYLAXIS_KEYWORDS = [
    'acyclovir', 'valacyclovir', 'valganciclovir', 'ganciclovir',
    'fluconazole', 'voriconazole', 'posaconazole', 'micafungin',
    'trimethoprim', 'sulfamethoxazole', 'tmp-smx', 'bactrim', 'septra',
    'dapsone', 'atovaquone', 'pentamidine',
    'levofloxacin', 'ciprofloxacin',
];
export const SUPPORTIVE_KEYWORDS = [
    'ondansetron', 'granisetron', 'palonosetron', 'dolasetron', // antiemetics
    'prochlorperazine', 'metoclopramide', 'lorazepam', 'dexamethasone',
    'aprepitant', 'fosaprepitant', 'netupitant',
    'filgrastim', 'pegfilgrastim', 'sargramostim', // growth factors
    'epoetin', 'darbepoetin',
    'mesna', // uroprotection
];
//# sourceMappingURL=loinc.js.map