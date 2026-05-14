import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NdaFormComponent } from './nda-form.component';
import { NdaFormData } from '../../models/nda-data.model';

const VALID_FORM_VALUES = {
  party1: {
    companyName: 'Acme Corp',
    contactName: 'Jane Doe',
    title: 'CEO',
    noticeAddress: '123 Main St, Springfield',
    signatureDate: '2025-01-01',
  },
  party2: {
    companyName: 'Globex Inc',
    contactName: 'John Smith',
    title: 'CTO',
    noticeAddress: '456 Oak Ave, Shelbyville',
    signatureDate: '2025-01-01',
  },
  purpose: 'Evaluating a potential partnership.',
  effectiveDate: '2025-01-01',
  mndaTerm: 'one_year',
  mndaTermYears: 2,
  termOfConfidentiality: 'one_year',
  confidentialityYears: 1,
  governingLaw: 'Delaware',
  jurisdiction: 'New Castle, DE',
};

describe('NdaFormComponent', () => {
  let component: NdaFormComponent;
  let fixture: ComponentFixture<NdaFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NdaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- Initialisation ---

  describe('initialisation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialise with an invalid form (required fields empty)', () => {
      expect(component.form.valid).toBeFalse();
    });

    it('should pre-fill purpose with default text', () => {
      expect(component.form.get('purpose')?.value).toContain('Evaluating whether');
    });

    it('should pre-fill effectiveDate with today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(component.form.get('effectiveDate')?.value).toBe(today);
    });

    it('should default mndaTerm to one_year', () => {
      expect(component.form.get('mndaTerm')?.value).toBe('one_year');
    });

    it('should default mndaTermYears to 1', () => {
      expect(component.form.get('mndaTermYears')?.value).toBe(1);
    });

    it('should default termOfConfidentiality to one_year', () => {
      expect(component.form.get('termOfConfidentiality')?.value).toBe('one_year');
    });

    it('should default confidentialityYears to 1', () => {
      expect(component.form.get('confidentialityYears')?.value).toBe(1);
    });
  });

  // --- Validation ---

  describe('validation', () => {
    it('should be valid when all required fields are filled', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid when party1.companyName is empty', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('party1.companyName')?.setValue('');
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid when party2.companyName is empty', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('party2.companyName')?.setValue('');
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid when purpose is empty', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('purpose')?.setValue('');
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid when governingLaw is empty', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('governingLaw')?.setValue('');
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid when jurisdiction is empty', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('jurisdiction')?.setValue('');
      expect(component.form.valid).toBeFalse();
    });

    it('should be invalid when mndaTermYears is less than 1', () => {
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('mndaTermYears')?.setValue(0);
      expect(component.form.valid).toBeFalse();
    });
  });

  // --- isInvalid helper ---

  describe('isInvalid()', () => {
    it('should return false for untouched invalid field', () => {
      expect(component.isInvalid('party1.companyName')).toBeFalse();
    });

    it('should return true for touched invalid field', () => {
      component.form.get('party1.companyName')?.markAsTouched();
      expect(component.isInvalid('party1.companyName')).toBeTrue();
    });

    it('should return false for touched valid field', () => {
      component.form.get('party1.companyName')?.setValue('Acme');
      component.form.get('party1.companyName')?.markAsTouched();
      expect(component.isInvalid('party1.companyName')).toBeFalse();
    });
  });

  // --- MNDA Term disable/enable ---

  describe('mndaTermYears enable/disable', () => {
    it('should be enabled when mndaTerm is one_year (default)', () => {
      expect(component.form.get('mndaTermYears')?.enabled).toBeTrue();
      expect(component.mndaTermYearsDisabled).toBeFalse();
    });

    it('should disable mndaTermYears when mndaTerm switches to until_terminated', fakeAsync(() => {
      component.form.get('mndaTerm')?.setValue('until_terminated');
      tick();
      expect(component.form.get('mndaTermYears')?.disabled).toBeTrue();
      expect(component.mndaTermYearsDisabled).toBeTrue();
    }));

    it('should re-enable mndaTermYears when mndaTerm switches back to one_year', fakeAsync(() => {
      component.form.get('mndaTerm')?.setValue('until_terminated');
      tick();
      component.form.get('mndaTerm')?.setValue('one_year');
      tick();
      expect(component.form.get('mndaTermYears')?.enabled).toBeTrue();
    }));
  });

  // --- Confidentiality Years disable/enable ---

  describe('confidentialityYears enable/disable', () => {
    it('should be enabled when termOfConfidentiality is one_year (default)', () => {
      expect(component.form.get('confidentialityYears')?.enabled).toBeTrue();
    });

    it('should disable confidentialityYears when termOfConfidentiality switches to in_perpetuity', fakeAsync(() => {
      component.form.get('termOfConfidentiality')?.setValue('in_perpetuity');
      tick();
      expect(component.form.get('confidentialityYears')?.disabled).toBeTrue();
      expect(component.confidentialityYearsDisabled).toBeTrue();
    }));

    it('should re-enable confidentialityYears when switching back to one_year', fakeAsync(() => {
      component.form.get('termOfConfidentiality')?.setValue('in_perpetuity');
      tick();
      component.form.get('termOfConfidentiality')?.setValue('one_year');
      tick();
      expect(component.form.get('confidentialityYears')?.enabled).toBeTrue();
    }));
  });

  // --- Submit ---

  describe('onSubmit()', () => {
    it('should emit formSubmitted with full form data when valid', () => {
      const spy = jasmine.createSpy('formSubmitted');
      component.formSubmitted.subscribe(spy);
      component.form.patchValue(VALID_FORM_VALUES);
      component.onSubmit();
      expect(spy).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        governingLaw: 'Delaware',
        jurisdiction: 'New Castle, DE',
      }));
    });

    it('should include disabled field values in emitted data (getRawValue)', fakeAsync(() => {
      const spy = jasmine.createSpy('formSubmitted');
      component.formSubmitted.subscribe(spy);
      component.form.patchValue(VALID_FORM_VALUES);
      component.form.get('mndaTerm')?.setValue('until_terminated');
      tick();
      component.onSubmit();
      const emitted: NdaFormData = spy.calls.mostRecent().args[0];
      expect(emitted.mndaTermYears).toBe(VALID_FORM_VALUES.mndaTermYears);
    }));

    it('should NOT emit and should mark all fields touched when form is invalid', () => {
      const spy = jasmine.createSpy('formSubmitted');
      component.formSubmitted.subscribe(spy);
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
      expect(component.form.get('party1.companyName')?.touched).toBeTrue();
    });
  });

  // --- Template: error messages ---

  describe('template error messages', () => {
    it('should show error message for party1.companyName after submit attempt', () => {
      component.onSubmit();
      fixture.detectChanges();
      const errors = fixture.debugElement.queryAll(By.css('.error-msg'));
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should not show error messages before submit is attempted', () => {
      fixture.detectChanges();
      const errors = fixture.debugElement.queryAll(By.css('.error-msg'));
      expect(errors.length).toBe(0);
    });
  });

  // --- Template: submit button ---

  describe('template submit button', () => {
    it('should render the submit button', () => {
      const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(btn).toBeTruthy();
    });

    it('should call onSubmit when submit button is clicked', () => {
      spyOn(component, 'onSubmit');
      const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
      btn.nativeElement.click();
      expect(component.onSubmit).toHaveBeenCalled();
    });
  });

  // takeUntilDestroyed handles cleanup automatically via DestroyRef — no manual unsubscribe needed
});
