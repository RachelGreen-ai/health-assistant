import type { FhirMedicationRequest } from '../types/fhir.js';
import type { MedicationItem, MedicationRegimen } from '../types/domain.js';
import { CHEMO_DRUG_KEYWORDS, PROPHYLAXIS_KEYWORDS, SUPPORTIVE_KEYWORDS } from '../constants/loinc.js';

function getDrugName(req: FhirMedicationRequest): string {
  return req.medicationCodeableConcept?.text
    ?? req.medicationCodeableConcept?.coding?.[0]?.display
    ?? req.medicationReference?.display
    ?? 'Unknown medication';
}

function getDoseString(req: FhirMedicationRequest): string {
  const di = req.dosageInstruction?.[0];
  if (!di) return 'dose not specified';
  if (di.text) return di.text;

  const dr = di.doseAndRate?.[0];
  const doseQty = dr?.doseQuantity;
  const dose = doseQty ? `${doseQty.value ?? ''} ${doseQty.unit ?? ''}`.trim() : '';

  const timing = di.timing?.code?.text ?? di.timing?.code?.coding?.[0]?.display ?? '';
  const route  = di.route?.text ?? di.route?.coding?.[0]?.display ?? '';

  return [dose, route, timing].filter(Boolean).join(' ') || 'see instructions';
}

function getFrequency(req: FhirMedicationRequest): string {
  const di = req.dosageInstruction?.[0];
  if (!di) return '';
  const repeat = di.timing?.repeat;
  if (!repeat) return di.timing?.code?.text ?? '';
  const { frequency, period, periodUnit } = repeat;
  if (frequency && period && periodUnit) {
    const unitMap: Record<string, string> = { d: 'day', wk: 'week', mo: 'month', h: 'hour' };
    const unit = unitMap[periodUnit] ?? periodUnit;
    return frequency === 1 ? `every ${period} ${unit}` : `${frequency}x / ${period} ${unit}`;
  }
  return '';
}

function getPrescriber(req: FhirMedicationRequest): string | undefined {
  return req.requester?.display;
}

function classify(name: string): 'chemo' | 'supportive' | 'prophylaxis' | 'prn' | 'other' {
  const lower = name.toLowerCase();
  if (CHEMO_DRUG_KEYWORDS.some(k => lower.includes(k)))      return 'chemo';
  if (PROPHYLAXIS_KEYWORDS.some(k => lower.includes(k)))     return 'prophylaxis';
  if (SUPPORTIVE_KEYWORDS.some(k => lower.includes(k)))      return 'supportive';
  return 'other';
}

export function parseMedicationRegimen(requests: FhirMedicationRequest[]): MedicationRegimen {
  const regimen: MedicationRegimen = {
    chemoAgents: [],
    supportive:  [],
    prophylaxis: [],
    prn:         [],
    other:       [],
  };

  for (const req of requests) {
    const name = getDrugName(req);
    const item: MedicationItem = {
      name,
      dose:       getDoseString(req),
      frequency:  getFrequency(req),
      route:      req.dosageInstruction?.[0]?.route?.text
                  ?? req.dosageInstruction?.[0]?.route?.coding?.[0]?.display,
      prescriber: getPrescriber(req),
      startDate:  req.authoredOn,
    };

    // PRN check: if dosage says "as needed" or prn
    const isPrn = req.dosageInstruction?.some(di =>
      di.text?.toLowerCase().includes('as needed') || di.text?.toLowerCase().includes('prn')
    );
    if (isPrn) {
      regimen.prn.push(item);
      continue;
    }

    const group = classify(name);
    if (group === 'chemo')       regimen.chemoAgents.push(item);
    else if (group === 'supportive')  regimen.supportive.push(item);
    else if (group === 'prophylaxis') regimen.prophylaxis.push(item);
    else                              regimen.other.push(item);
  }

  return regimen;
}
