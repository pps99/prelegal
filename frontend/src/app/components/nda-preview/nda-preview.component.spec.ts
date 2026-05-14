import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NdaPreviewComponent } from './nda-preview.component';

describe('NdaPreviewComponent', () => {
  let component: NdaPreviewComponent;
  let fixture: ComponentFixture<NdaPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NdaPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NdaPreviewComponent);
    component = fixture.componentInstance;
    component.renderedHtml = '<h1>Acme Corp</h1><p>Test document</p>';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the provided HTML via [innerHTML]', () => {
    const doc = fixture.debugElement.query(By.css('.document'));
    expect(doc.nativeElement.innerHTML).toContain('Acme Corp');
  });

  it('should show toolbar when showActions is true', () => {
    component.showActions = true;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.toolbar'))).toBeTruthy();
  });

  it('should hide toolbar when showActions is false', () => {
    component.showActions = false;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.toolbar'))).toBeNull();
  });

  it('should emit editRequested when Edit Details button is clicked', () => {
    const spy = jasmine.createSpy('editRequested');
    component.editRequested.subscribe(spy);
    const btn = fixture.debugElement.query(By.css('.btn-secondary'));
    btn.nativeElement.click();
    expect(spy).toHaveBeenCalled();
  });

  it('should render a Download PDF button', () => {
    const btn = fixture.debugElement.query(By.css('.btn-primary'));
    expect(btn.nativeElement.textContent).toContain('Download PDF');
  });
});
