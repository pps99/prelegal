export interface PartyInfo {
  companyName: string;
  contactName: string;
  title: string;
  noticeAddress: string;
  signatureDate: string;
}

export type MndaTermType = 'one_year' | 'until_terminated';
export type ConfidentialityTermType = 'one_year' | 'in_perpetuity';

export interface NdaFormData {
  party1: PartyInfo;
  party2: PartyInfo;
  purpose: string;
  effectiveDate: string;
  mndaTerm: MndaTermType;
  mndaTermYears: number;
  termOfConfidentiality: ConfidentialityTermType;
  confidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
}
