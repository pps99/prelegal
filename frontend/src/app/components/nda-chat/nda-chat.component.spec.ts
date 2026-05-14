import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { NdaChatComponent } from './nda-chat.component';
import { ChatService, PartialNdaData } from '../../services/chat.service';
import { NdaFormData } from '../../models/nda-data.model';

const EMPTY_PARTIAL: PartialNdaData = {
  party1: { companyName: null, contactName: null, title: null, noticeAddress: null, signatureDate: null },
  party2: { companyName: null, contactName: null, title: null, noticeAddress: null, signatureDate: null },
  purpose: null,
  effectiveDate: null,
  mndaTerm: null,
  mndaTermYears: null,
  termOfConfidentiality: null,
  confidentialityYears: null,
  governingLaw: null,
  jurisdiction: null,
};

const MOCK_NDA: NdaFormData = {
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

describe('NdaChatComponent', () => {
  let chatSpy: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    chatSpy = jasmine.createSpyObj('ChatService', ['createSession', 'sendMessage', 'generateDocument']);
    chatSpy.createSession.and.returnValue(of({ session_id: 1, greeting: 'Hello! What are the companies?' }));
    chatSpy.sendMessage.and.returnValue(of({ message: 'Got it! What else?', partial_nda_data: EMPTY_PARTIAL }));

    await TestBed.configureTestingModule({
      imports: [NdaChatComponent, HttpClientTestingModule],
      providers: [{ provide: ChatService, useValue: chatSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create session on init and show greeting', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    expect(chatSpy.createSession).toHaveBeenCalled();
    expect(fixture.componentInstance.sessionId).toBe(1);
    expect(fixture.componentInstance.messages[0]).toEqual({
      role: 'assistant',
      content: 'Hello! What are the companies?',
    });
  });

  it('should show error when session creation fails', () => {
    chatSpy.createSession.and.returnValue(throwError(() => new Error('Network error')));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error).toBeTruthy();
  });

  it('should not send empty message', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = '   ';
    fixture.componentInstance.sendMessage();
    expect(chatSpy.sendMessage).not.toHaveBeenCalled();
  });

  it('should send message and add both user and assistant messages', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'Acme Corp and Globex';
    fixture.componentInstance.sendMessage();
    expect(chatSpy.sendMessage).toHaveBeenCalledWith(1, 'Acme Corp and Globex');
    expect(fixture.componentInstance.messages.length).toBe(3);
    expect(fixture.componentInstance.messages[1]).toEqual({ role: 'user', content: 'Acme Corp and Globex' });
    expect(fixture.componentInstance.messages[2]).toEqual({ role: 'assistant', content: 'Got it! What else?' });
  });

  it('should update partialData after sendMessage', () => {
    const partial: PartialNdaData = { ...EMPTY_PARTIAL, party1: { ...EMPTY_PARTIAL.party1, companyName: 'Acme' } };
    chatSpy.sendMessage.and.returnValue(of({ message: 'Got it.', partial_nda_data: partial }));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'Acme Corp';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.partialData?.party1?.companyName).toBe('Acme');
  });

  it('should clear inputText after sending', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'Hello';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.inputText).toBe('');
  });

  it('should emit formSubmitted with nda_data when document generated', () => {
    chatSpy.generateDocument.and.returnValue(of({ nda_data: MOCK_NDA }));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    let emitted: NdaFormData | undefined;
    fixture.componentInstance.formSubmitted.subscribe((d) => (emitted = d));
    fixture.componentInstance.generateDocument();
    expect(emitted).toEqual(MOCK_NDA);
  });

  it('should set error when generateDocument fails', () => {
    chatSpy.generateDocument.and.returnValue(throwError(() => new Error('API error')));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.generateDocument();
    expect(fixture.componentInstance.error).toBeTruthy();
    expect(fixture.componentInstance.generating).toBeFalse();
  });

  describe('previewData getter', () => {
    it('should return defaults when partialData is null', () => {
      const fixture = TestBed.createComponent(NdaChatComponent);
      fixture.detectChanges();
      const preview = fixture.componentInstance.previewData;
      expect(preview.mndaTerm).toBe('one_year');
      expect(preview.mndaTermYears).toBe(1);
      expect(preview.termOfConfidentiality).toBe('one_year');
      expect(preview.confidentialityYears).toBe(1);
      expect(preview.party1.companyName).toBe('');
    });

    it('should use partial values when available', () => {
      const fixture = TestBed.createComponent(NdaChatComponent);
      fixture.detectChanges();
      fixture.componentInstance.partialData = {
        ...EMPTY_PARTIAL,
        party1: { ...EMPTY_PARTIAL.party1, companyName: 'Acme Corp' },
        governingLaw: 'Delaware',
      };
      const preview = fixture.componentInstance.previewData;
      expect(preview.party1.companyName).toBe('Acme Corp');
      expect(preview.governingLaw).toBe('Delaware');
    });
  });
});
