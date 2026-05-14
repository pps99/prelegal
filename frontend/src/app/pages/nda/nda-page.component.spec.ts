import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NdaPageComponent } from './nda-page.component';
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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdaPageComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with ndaData as null (show form)', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    expect(fixture.componentInstance.ndaData).toBeNull();
  });

  it('should show the NDA form initially', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-form'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('app-nda-preview'))).toBeNull();
  });

  it('should show preview and hide form after formSubmitted', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_NDA_DATA);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-nda-form'))).toBeNull();
    expect(fixture.debugElement.query(By.css('app-nda-preview'))).toBeTruthy();
  });

  it('should return to form after editRequested', () => {
    const fixture = TestBed.createComponent(NdaPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.onFormSubmitted(FULL_NDA_DATA);
    fixture.detectChanges();
    fixture.componentInstance.onEditRequested();
    fixture.detectChanges();
    expect(fixture.componentInstance.ndaData).toBeNull();
    expect(fixture.debugElement.query(By.css('app-nda-form'))).toBeTruthy();
  });
});
