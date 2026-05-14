import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NdaPageComponent } from './nda-page.component';
import { ChatService } from '../../services/chat.service';
import { NdaFormData } from '../../models/nda-data.model';

const FULL_NDA_DATA: NdaFormData = {
  party1: { companyName: 'Acme Corp', contactName: 'Jane Doe', title: 'CEO', noticeAddress: '123 Main St', signatureDate: '2025-01-01' },
  party2: { companyName: 'Globex Inc', contactName: 'John Smith', title: 'CTO', noticeAddress: '456 Oak Ave', signatureDate: '2025-01-01' },
  purpose: 'Evaluating a partnership.',
  effectiveDate: '2025-01-01',
  mndaTerm: 'one_year',
  mndaTermYears: 1,
  termOfConfidentiality: 'one_year',
  confidentialityYears: 1,
  governingLaw: 'Delaware',
  jurisdiction: 'New Castle, DE',
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

  it('should start with ndaData as null', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    expect(fixture.componentInstance.ndaData).toBeNull();
  });

  it('should show the chat component initially', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeTruthy();
    expect(fixture.componentInstance.ndaData).toBeNull();
  });

  it('should show preview and hide chat after formSubmitted', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_NDA_DATA);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeNull();
    expect(fixture.componentInstance.ndaData).toEqual(FULL_NDA_DATA);
  });

  it('should return to chat after editRequested', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_NDA_DATA);
    fixture.detectChanges();
    fixture.componentInstance.onEditRequested();
    fixture.detectChanges();
    expect(fixture.componentInstance.ndaData).toBeNull();
    expect(fixture.debugElement.query(By.css('app-nda-chat'))).toBeTruthy();
  });
});
