import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NdaPreviewComponent } from './nda-preview.component';
import { NdaDownloadService } from '../../services/nda-download.service';
import { NdaFormData } from '../../models/nda-data.model';

const SAMPLE_DATA: NdaFormData = {
  party1: {
    companyName: 'Acme Corp',
    contactName: 'Jane Doe',
    title: 'CEO',
    noticeAddress: '123 Main St, Springfield',
    signatureDate: '2025-01-15',
  },
  party2: {
    companyName: 'Globex Inc',
    contactName: 'John Smith',
    title: 'CTO',
    noticeAddress: '456 Oak Ave, Shelbyville',
    signatureDate: '2025-01-15',
  },
  purpose: 'Evaluating a potential partnership.',
  effectiveDate: '2025-01-01',
  mndaTerm: 'one_year',
  mndaTermYears: 2,
  termOfConfidentiality: 'one_year',
  confidentialityYears: 3,
  governingLaw: 'Delaware',
  jurisdiction: 'New Castle, DE',
};

describe('NdaPreviewComponent', () => {
  let component: NdaPreviewComponent;
  let fixture: ComponentFixture<NdaPreviewComponent>;
  let downloadServiceSpy: jasmine.SpyObj<NdaDownloadService>;

  beforeEach(async () => {
    downloadServiceSpy = jasmine.createSpyObj('NdaDownloadService', ['downloadAsHtml']);

    await TestBed.configureTestingModule({
      imports: [NdaPreviewComponent],
      providers: [
        { provide: NdaDownloadService, useValue: downloadServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NdaPreviewComponent);
    component = fixture.componentInstance;
    component.data = SAMPLE_DATA;
    fixture.detectChanges();
  });

  // --- Instantiation ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- mndaTermLabel ---

  describe('mndaTermLabel', () => {
    it('should return plural "years" for mndaTermYears > 1', () => {
      expect(component.mndaTermLabel).toContain('2 years');
    });

    it('should return singular "year" for mndaTermYears = 1', () => {
      component.data = { ...SAMPLE_DATA, mndaTermYears: 1 };
      expect(component.mndaTermLabel).toContain('1 year ');
    });

    it('should return "until terminated" label when mndaTerm is until_terminated', () => {
      component.data = { ...SAMPLE_DATA, mndaTerm: 'until_terminated' };
      expect(component.mndaTermLabel).toContain('until terminated');
    });
  });

  // --- confidentialityTermLabel ---

  describe('confidentialityTermLabel', () => {
    it('should include the number of confidentiality years', () => {
      expect(component.confidentialityTermLabel).toContain('3 years');
    });

    it('should include trade-secret carveout for one_year term', () => {
      expect(component.confidentialityTermLabel).toContain('trade secrets');
    });

    it('should return "In perpetuity" for in_perpetuity term', () => {
      component.data = { ...SAMPLE_DATA, termOfConfidentiality: 'in_perpetuity' };
      expect(component.confidentialityTermLabel).toBe('In perpetuity.');
    });
  });

  // --- formatDate ---

  describe('formatDate()', () => {
    it('should format a valid date string to long form', () => {
      expect(component.formatDate('2025-01-15')).toBe('January 15, 2025');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('');
    });
  });

  // --- Template: party names ---

  describe('template rendering', () => {
    it('should display party1 company name', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Acme Corp');
    });

    it('should display party2 company name', () => {
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Globex Inc');
    });

    it('should display party1 contact name', () => {
      expect(fixture.nativeElement.textContent).toContain('Jane Doe');
    });

    it('should display party2 contact name', () => {
      expect(fixture.nativeElement.textContent).toContain('John Smith');
    });

    it('should display the purpose text', () => {
      expect(fixture.nativeElement.textContent).toContain('Evaluating a potential partnership.');
    });

    it('should display governing law', () => {
      expect(fixture.nativeElement.textContent).toContain('Delaware');
    });

    it('should display jurisdiction', () => {
      expect(fixture.nativeElement.textContent).toContain('New Castle, DE');
    });

    it('should display the formatted effective date', () => {
      expect(fixture.nativeElement.textContent).toContain('January 1, 2025');
    });
  });

  // --- Toolbar buttons ---

  describe('toolbar buttons', () => {
    it('should render an Edit Details button', () => {
      const btn = fixture.debugElement.query(By.css('.btn-secondary'));
      expect(btn.nativeElement.textContent).toContain('Edit Details');
    });

    it('should render a Download HTML button', () => {
      const btns = fixture.debugElement.queryAll(By.css('.btn-primary'));
      const downloadBtn = btns.find(b => b.nativeElement.textContent.includes('Download'));
      expect(downloadBtn).toBeTruthy();
    });
  });

  // --- Events ---

  describe('onEdit()', () => {
    it('should emit editRequested when edit button is clicked', () => {
      const spy = jasmine.createSpy('editRequested');
      component.editRequested.subscribe(spy);
      const btn = fixture.debugElement.query(By.css('.btn-secondary'));
      btn.nativeElement.click();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onDownload()', () => {
    it('should call downloadService.downloadAsHtml with current data', () => {
      component.onDownload();
      expect(downloadServiceSpy.downloadAsHtml).toHaveBeenCalledOnceWith(SAMPLE_DATA);
    });

    it('should call downloadService when download button is clicked', () => {
      const btns = fixture.debugElement.queryAll(By.css('.btn-primary'));
      const downloadBtn = btns.find(b => b.nativeElement.textContent.includes('Download'));
      downloadBtn!.nativeElement.click();
      expect(downloadServiceSpy.downloadAsHtml).toHaveBeenCalled();
    });
  });

  describe('onPrint()', () => {
    it('should call window.print()', () => {
      spyOn(window, 'print');
      component.onPrint();
      expect(window.print).toHaveBeenCalled();
    });
  });
});
