import { TestBed } from '@angular/core/testing';
import { NdaDownloadService } from './nda-download.service';
import { NdaFormData } from '../models/nda-data.model';

const SAMPLE_DATA: NdaFormData = {
  party1: {
    companyName: 'Acme Corp',
    contactName: 'Jane Doe',
    title: 'CEO',
    noticeAddress: '123 Main St',
    signatureDate: '2025-06-01',
  },
  party2: {
    companyName: 'Globex Inc',
    contactName: 'John Smith',
    title: 'CTO',
    noticeAddress: '456 Oak Ave',
    signatureDate: '2025-06-01',
  },
  purpose: 'Evaluating a potential partnership.',
  effectiveDate: '2025-06-01',
  mndaTerm: 'one_year',
  mndaTermYears: 1,
  termOfConfidentiality: 'one_year',
  confidentialityYears: 1,
  governingLaw: 'Delaware',
  jurisdiction: 'New Castle, DE',
};

describe('NdaDownloadService', () => {
  let service: NdaDownloadService;
  let createObjectURLSpy: jasmine.Spy;
  let revokeObjectURLSpy: jasmine.Spy;
  let clickSpy: jasmine.Spy;
  let createElementSpy: jasmine.Spy;
  let anchorElement: HTMLAnchorElement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NdaDownloadService);

    anchorElement = document.createElement('a');
    clickSpy = spyOn(anchorElement, 'click');
    createElementSpy = spyOn(document, 'createElement').and.returnValue(anchorElement as any);
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');
    revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('downloadAsHtml()', () => {
    it('should create an anchor element', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should call URL.createObjectURL with a Blob', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(createObjectURLSpy).toHaveBeenCalledWith(jasmine.any(Blob));
    });

    it('should set anchor href to the blob URL', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(anchorElement.href).toContain('blob:fake-url');
    });

    it('should set download filename containing both company names', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(anchorElement.download).toContain('acme-corp');
      expect(anchorElement.download).toContain('globex-inc');
    });

    it('should set download filename with .html extension', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(anchorElement.download).toMatch(/\.html$/);
    });

    it('should click the anchor to trigger download', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should revoke the object URL after clicking', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url');
    });
  });

  describe('HTML content generation', () => {
    let generatedBlob: Blob;

    beforeEach(() => {
      createObjectURLSpy.and.callFake((b: Blob) => {
        generatedBlob = b;
        return 'blob:fake-url';
      });
      service.downloadAsHtml(SAMPLE_DATA);
    });

    async function getBlobText(): Promise<string> {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(generatedBlob);
      });
    }

    it('should generate a valid HTML document', async () => {
      const text = await getBlobText();
      expect(text).toContain('<!DOCTYPE html>');
      expect(text).toContain('<html');
      expect(text).toContain('</html>');
    });

    it('should include both company names in the document', async () => {
      const text = await getBlobText();
      expect(text).toContain('Acme Corp');
      expect(text).toContain('Globex Inc');
    });

    it('should include the purpose text', async () => {
      const text = await getBlobText();
      expect(text).toContain('Evaluating a potential partnership.');
    });

    it('should include governing law', async () => {
      const text = await getBlobText();
      expect(text).toContain('Delaware');
    });

    it('should include jurisdiction', async () => {
      const text = await getBlobText();
      expect(text).toContain('New Castle, DE');
    });

    it('should include standard terms', async () => {
      const text = await getBlobText();
      expect(text).toContain('Standard Terms');
      expect(text).toContain('Confidential Information');
    });

    it('should include CC BY 4.0 attribution', async () => {
      const text = await getBlobText();
      expect(text).toContain('CC BY 4.0');
    });

    it('should include contact names from both parties', async () => {
      const text = await getBlobText();
      expect(text).toContain('Jane Doe');
      expect(text).toContain('John Smith');
    });
  });

  describe('mndaTermLabel in HTML content', () => {
    async function getHtml(data: NdaFormData): Promise<string> {
      return new Promise((resolve) => {
        createObjectURLSpy.and.callFake((b: Blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsText(b);
          return 'blob:fake-url';
        });
        service.downloadAsHtml(data);
      });
    }

    it('should show "1 year" (singular) in HTML when mndaTermYears is 1', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, mndaTermYears: 1 });
      expect(html).toContain('1 year ');
    });

    it('should show "2 years" (plural) in HTML when mndaTermYears is 2', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, mndaTermYears: 2 });
      expect(html).toContain('2 years');
    });

    it('should show "until terminated" text when mndaTerm is until_terminated', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, mndaTerm: 'until_terminated' });
      expect(html).toContain('until terminated');
    });

    it('should show "In perpetuity" when termOfConfidentiality is in_perpetuity', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, termOfConfidentiality: 'in_perpetuity' });
      expect(html).toContain('In perpetuity');
    });
  });

  describe('XSS escaping', () => {
    async function getHtml(data: NdaFormData): Promise<string> {
      return new Promise((resolve) => {
        createObjectURLSpy.and.callFake((b: Blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsText(b);
          return 'blob:fake-url';
        });
        service.downloadAsHtml(data);
      });
    }

    it('should escape < and > in company name', async () => {
      const data = { ...SAMPLE_DATA, party1: { ...SAMPLE_DATA.party1, companyName: '<script>alert(1)</script>' } };
      const html = await getHtml(data);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape & in purpose field', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, purpose: 'R&D collaboration' });
      expect(html).toContain('R&amp;D');
    });

    it('should escape quotes in governing law', async () => {
      const html = await getHtml({ ...SAMPLE_DATA, governingLaw: 'New "Hampshire"' });
      expect(html).toContain('&quot;');
    });
  });

  describe('filename sanitisation', () => {
    it('should lowercase company names in filename', () => {
      service.downloadAsHtml(SAMPLE_DATA);
      expect(anchorElement.download).toBe('mutual-nda-acme-corp-globex-inc.html');
    });

    it('should replace spaces with dashes in company names for filename', () => {
      service.downloadAsHtml({ ...SAMPLE_DATA, party1: { ...SAMPLE_DATA.party1, companyName: 'Big Corp' } });
      expect(anchorElement.download).toContain('big-corp');
    });

    it('should replace / in company name with dash', () => {
      service.downloadAsHtml({ ...SAMPLE_DATA, party1: { ...SAMPLE_DATA.party1, companyName: 'A/B Corp' } });
      expect(anchorElement.download).not.toContain('/');
      expect(anchorElement.download).toContain('a-b-corp');
    });

    it('should replace & in company name with dash', () => {
      service.downloadAsHtml({ ...SAMPLE_DATA, party1: { ...SAMPLE_DATA.party1, companyName: 'Smith & Jones' } });
      expect(anchorElement.download).toContain('smith-jones');
    });

    it('should strip leading/trailing dashes from slugified name', () => {
      service.downloadAsHtml({ ...SAMPLE_DATA, party1: { ...SAMPLE_DATA.party1, companyName: '---Corp---' } });
      const download = anchorElement.download;
      expect(download).not.toMatch(/mutual-nda--/);
    });
  });
});
