import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NdaPageComponent } from './nda-page.component';
import { ChatService } from '../../services/chat.service';
import { DocResult } from '../../components/nda-chat/nda-chat.component';

const FULL_DOC_RESULT: DocResult = {
  renderedHtml: '<h1>Mutual NDA</h1><p>Acme Corp and Globex Inc</p>',
  fields: { governingLaw: 'Delaware', party1: { companyName: 'Acme Corp' } },
};

describe('NdaPageComponent', () => {
  let chatSpy: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    chatSpy = jasmine.createSpyObj('ChatService', ['createSession', 'sendMessage', 'generateDocument']);
    chatSpy.createSession.and.returnValue(of({ session_id: 1, greeting: 'Hello!' }));

    await TestBed.configureTestingModule({
      imports: [NdaPageComponent, HttpClientTestingModule],
      providers: [{ provide: ChatService, useValue: chatSpy }],
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
