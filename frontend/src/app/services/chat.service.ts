import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NdaFormData } from '../models/nda-data.model';

export interface PartialPartyInfo {
  companyName: string | null;
  contactName: string | null;
  title: string | null;
  noticeAddress: string | null;
  signatureDate: string | null;
}

export interface PartialNdaData {
  party1: PartialPartyInfo;
  party2: PartialPartyInfo;
  purpose: string | null;
  effectiveDate: string | null;
  mndaTerm: 'one_year' | 'until_terminated' | null;
  mndaTermYears: number | null;
  termOfConfidentiality: 'one_year' | 'in_perpetuity' | null;
  confidentialityYears: number | null;
  governingLaw: string | null;
  jurisdiction: string | null;
}

export interface CreateSessionResponse {
  session_id: number;
  greeting: string;
}

export interface MessageResponse {
  message: string;
  partial_nda_data: PartialNdaData;
}

export interface GenerateResponse {
  nda_data: NdaFormData;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  createSession(): Observable<CreateSessionResponse> {
    return this.http.post<CreateSessionResponse>('/api/chat/sessions', {});
  }

  sendMessage(sessionId: number, content: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/api/chat/sessions/${sessionId}/messages`,
      { content },
    );
  }

  generateDocument(sessionId: number): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(
      `/api/chat/sessions/${sessionId}/generate`,
      {},
    );
  }
}
