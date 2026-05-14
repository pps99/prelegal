import { NdaFormData } from './nda-data.model';

export function mndaTermLabel(data: NdaFormData): string {
  if (data.mndaTerm === 'one_year') {
    const y = data.mndaTermYears;
    return `Expires ${y} year${y !== 1 ? 's' : ''} from Effective Date.`;
  }
  return 'Continues until terminated in accordance with the terms of the MNDA.';
}

export function confidentialityTermLabel(data: NdaFormData): string {
  if (data.termOfConfidentiality === 'one_year') {
    const y = data.confidentialityYears;
    return `${y} year${y !== 1 ? 's' : ''} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`;
  }
  return 'In perpetuity.';
}

export function formatNdaDate(dateStr: string): string {
  if (!dateStr) return '';
  // Append T00:00:00 to parse as local time (avoids UTC offset shifting the day)
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
