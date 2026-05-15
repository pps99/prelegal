import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateSessionResponse {
  session_id: number;
  greeting: string;
}

export interface MessageResponse {
  message: string;
  document_type: string | null;
  partial_data: Record<string, any> | null;
}

export interface GenerateResponse {
  fields: Record<string, any>;
  rendered_html: string;
  doc_type: string | null;
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
