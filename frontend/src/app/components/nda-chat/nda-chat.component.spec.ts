import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NdaChatComponent, DocResult } from './nda-chat.component';
import { ChatService } from '../../services/chat.service';
import { DocumentsService } from '../../services/documents.service';
import { AuthService } from '../../services/auth.service';

const GENERATE_RESPONSE = {
  rendered_html: '<html>Test</html>',
  fields: { governingLaw: 'Delaware' },
  doc_type: 'mutual_nda',
};

const SAVE_RESPONSE = { id: 42, title: 'Mutual NDA', doc_type: 'mutual_nda', created_at: '2026-01-01' };

describe('NdaChatComponent', () => {
  let chatSpy: jasmine.SpyObj<ChatService>;
  let docsSpy: jasmine.SpyObj<DocumentsService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    chatSpy = jasmine.createSpyObj('ChatService', ['createSession', 'sendMessage', 'generateDocument']);
    chatSpy.createSession.and.returnValue(of({ session_id: 1, greeting: 'Hello! What document do you need?' }));
    chatSpy.sendMessage.and.returnValue(of({ message: 'Got it! What else?', document_type: null, partial_data: null }));

    docsSpy = jasmine.createSpyObj('DocumentsService', ['save']);
    docsSpy.save.and.returnValue(of(SAVE_RESPONSE));

    authSpy = jasmine.createSpyObj('AuthService', ['getUserEmail', 'logout']);
    authSpy.getUserEmail.and.returnValue('user@example.com');

    await TestBed.configureTestingModule({
      imports: [NdaChatComponent, HttpClientTestingModule, RouterModule.forRoot([])],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: DocumentsService, useValue: docsSpy },
        { provide: AuthService, useValue: authSpy },
      ],
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
      content: 'Hello! What document do you need?',
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
    fixture.componentInstance.inputText = 'I need a mutual NDA';
    fixture.componentInstance.sendMessage();
    expect(chatSpy.sendMessage).toHaveBeenCalledWith(1, 'I need a mutual NDA');
    expect(fixture.componentInstance.messages.length).toBe(3);
    expect(fixture.componentInstance.messages[1]).toEqual({ role: 'user', content: 'I need a mutual NDA' });
    expect(fixture.componentInstance.messages[2]).toEqual({ role: 'assistant', content: 'Got it! What else?' });
  });

  it('should store documentType when returned by sendMessage', () => {
    chatSpy.sendMessage.and.returnValue(of({ message: "Great, let's create an NDA.", document_type: 'mutual_nda', partial_data: null }));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'I need an NDA';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.documentType).toBe('mutual_nda');
  });

  it('should update partialData after sendMessage', () => {
    const partial = { party1: { companyName: 'Acme' }, purpose: null };
    chatSpy.sendMessage.and.returnValue(of({ message: 'Got it.', document_type: 'mutual_nda', partial_data: partial }));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'Acme Corp';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.partialData).toEqual(partial);
  });

  it('should clear inputText after sending', () => {
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.inputText = 'Hello';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.inputText).toBe('');
  });

  it('should emit formSubmitted with renderedHtml, fields, and docType after saving', () => {
    chatSpy.generateDocument.and.returnValue(of(GENERATE_RESPONSE));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    let emitted: DocResult | undefined;
    fixture.componentInstance.formSubmitted.subscribe((d) => (emitted = d));
    fixture.componentInstance.generateDocument();
    expect(docsSpy.save).toHaveBeenCalledWith('mutual_nda', GENERATE_RESPONSE.fields, GENERATE_RESPONSE.rendered_html);
    expect(emitted?.renderedHtml).toBe('<html>Test</html>');
    expect(emitted?.fields).toEqual({ governingLaw: 'Delaware' });
    expect(emitted?.docType).toBe('mutual_nda');
    expect(emitted?.savedId).toBe(42);
  });

  it('should still emit formSubmitted even if save fails', () => {
    chatSpy.generateDocument.and.returnValue(of(GENERATE_RESPONSE));
    docsSpy.save.and.returnValue(throwError(() => new Error('Save failed')));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    let emitted: DocResult | undefined;
    fixture.componentInstance.formSubmitted.subscribe((d) => (emitted = d));
    fixture.componentInstance.generateDocument();
    expect(emitted?.renderedHtml).toBe('<html>Test</html>');
    expect(emitted?.savedId).toBeUndefined();
  });

  it('should set error when generateDocument fails', () => {
    chatSpy.generateDocument.and.returnValue(throwError(() => new Error('API error')));
    const fixture = TestBed.createComponent(NdaChatComponent);
    fixture.detectChanges();
    fixture.componentInstance.generateDocument();
    expect(fixture.componentInstance.error).toBeTruthy();
    expect(fixture.componentInstance.generating).toBeFalse();
  });

  describe('fieldEntries getter', () => {
    it('should return empty array when partialData is null', () => {
      const fixture = TestBed.createComponent(NdaChatComponent);
      fixture.detectChanges();
      expect(fixture.componentInstance.fieldEntries).toEqual([]);
    });

    it('should flatten nested partialData into label/value pairs', () => {
      const fixture = TestBed.createComponent(NdaChatComponent);
      fixture.detectChanges();
      fixture.componentInstance.partialData = { governingLaw: 'Delaware', purpose: 'Exploring partnership' };
      const entries = fixture.componentInstance.fieldEntries;
      expect(entries.some(e => e.label === 'Governing Law' && e.value === 'Delaware')).toBeTrue();
    });
  });
});
