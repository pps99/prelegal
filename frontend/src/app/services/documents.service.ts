import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentSummary {
  id: number;
  title: string;
  doc_type: string;
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  fields: Record<string, any>;
  rendered_html: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  constructor(private http: HttpClient) {}

  save(doc_type: string, fields: Record<string, any>, rendered_html: string): Observable<DocumentSummary> {
    return this.http.post<DocumentSummary>('/api/documents', { doc_type, fields, rendered_html });
  }

  list(): Observable<DocumentSummary[]> {
    return this.http.get<DocumentSummary[]>('/api/documents');
  }

  get(id: number): Observable<DocumentDetail> {
    return this.http.get<DocumentDetail>(`/api/documents/${id}`);
  }
}
