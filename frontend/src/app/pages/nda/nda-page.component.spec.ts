import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NdaPageComponent } from './nda-page.component';
import { ChatService } from '../../services/chat.service';
import { DocumentsService } from '../../services/documents.service';
import { AuthService } from '../../services/auth.service';
import { DocResult } from '../../components/nda-chat/nda-chat.component';

const FULL_DOC_RESULT: DocResult = {
  renderedHtml: '<h1>Mutual NDA</h1><p>Acme Corp and Globex Inc</p>',
  fields: { governingLaw: 'Delaware', party1: { companyName: 'Acme Corp' } },
  docType: 'mutual_nda',
};

describe('NdaPageComponent', () => {
  let chatSpy: jasmine.SpyObj<ChatService>;
  let docsSpy: jasmine.SpyObj<DocumentsService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    chatSpy = jasmine.createSpyObj('ChatService', ['createSession', 'sendMessage', 'generateDocument']);
    chatSpy.createSession.and.returnValue(of({ session_id: 1, greeting: 'Hello!' }));

    docsSpy = jasmine.createSpyObj('DocumentsService', ['save']);
    docsSpy.save.and.returnValue(of({ id: 1, title: 'Mutual NDA', doc_type: 'mutual_nda', created_at: '2026-01-01' }));

    authSpy = jasmine.createSpyObj('AuthService', ['getUserEmail', 'logout', 'isLoggedIn']);
    authSpy.getUserEmail.and.returnValue('user@example.com');

    await TestBed.configureTestingModule({
      imports: [NdaPageComponent, HttpClientTestingModule, RouterModule.forRoot([])],
      providers: [
        { provide: ChatService, useValue: chatSpy },
        { provide: DocumentsService, useValue: docsSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with docResult as null', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    expect(fixture.componentInstance.docResult).toBeNull();
  });

  it('should show the chat component initially', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeTruthy();
  });

  it('should show preview and hide chat after formSubmitted', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_DOC_RESULT);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-nda-preview'))).toBeTruthy();
  });

  it('should return to chat after editRequested', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_DOC_RESULT);
    fixture.detectChanges();
    fixture.componentInstance.onEditRequested();
    fixture.detectChanges();
    expect(fixture.componentInstance.docResult).toBeNull();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeTruthy();
  });
});
