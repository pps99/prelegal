import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { NdaFormData } from '../models/nda-data.model';

const MOCK_NDA_DATA: NdaFormData = {
  party1: { companyName: 'Acme', contactName: 'Jane', title: 'CEO', noticeAddress: '123 Main', signatureDate: '2026-01-01' },
  party2: { companyName: 'Globex', contactName: 'John', title: 'CTO', noticeAddress: '456 Oak', signatureDate: '2026-01-01' },
  purpose: 'Evaluating partnership.',
  effectiveDate: '2026-01-01',
  mndaTerm: 'one_year',
  mndaTermYears: 1,
  termOfConfidentiality: 'one_year',
  confidentialityYears: 1,
  governingLaw: 'Delaware',
  jurisdiction: 'New Castle, DE',
};

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createSession()', () => {
    it('should POST to /api/chat/sessions', () => {
      service.createSession().subscribe((res) => {
        expect(res.session_id).toBe(1);
        expect(res.greeting).toBe('Hello!');
      });

      const req = httpMock.expectOne('/api/chat/sessions');
      expect(req.request.method).toBe('POST');
      req.flush({ session_id: 1, greeting: 'Hello!' });
    });
  });

  describe('sendMessage()', () => {
    it('should POST to the correct session URL with message content', () => {
      service.sendMessage(42, 'test message').subscribe((res) => {
        expect(res.message).toBe('AI response');
      });

      const req = httpMock.expectOne('/api/chat/sessions/42/messages');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'test message' });
      req.flush({ message: 'AI response', partial_nda_data: {} });
    });
  });

  describe('generateDocument()', () => {
    it('should POST to the generate URL', () => {
      service.generateDocument(42).subscribe((res) => {
        expect(res.nda_data).toEqual(MOCK_NDA_DATA);
      });

      const req = httpMock.expectOne('/api/chat/sessions/42/generate');
      expect(req.request.method).toBe('POST');
      req.flush({ nda_data: MOCK_NDA_DATA });
    });
  });
});
