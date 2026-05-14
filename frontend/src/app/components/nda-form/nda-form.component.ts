import { Component, EventEmitter, Output, OnInit, inject, DestroyRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NdaFormData } from '../../models/nda-data.model';

@Component({
  selector: 'app-nda-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './nda-form.component.html',
  styleUrl: './nda-form.component.scss',
})
export class NdaFormComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<NdaFormData>();

  form!: FormGroup;
  today = new Date().toISOString().split('T')[0];

  private destroyRef = inject(DestroyRef);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      party1: this.fb.group({
        companyName: ['', Validators.required],
        contactName: ['', Validators.required],
        title: ['', Validators.required],
        noticeAddress: ['', Validators.required],
        signatureDate: [this.today, Validators.required],
      }),
      party2: this.fb.group({
        companyName: ['', Validators.required],
        contactName: ['', Validators.required],
        title: ['', Validators.required],
        noticeAddress: ['', Validators.required],
        signatureDate: [this.today, Validators.required],
      }),
      purpose: [
        'Evaluating whether to enter into a business relationship with the other party.',
        Validators.required,
      ],
      effectiveDate: [this.today, Validators.required],
      mndaTerm: ['one_year'],
      mndaTermYears: [1, [Validators.required, Validators.min(1)]],
      termOfConfidentiality: ['one_year'],
      confidentialityYears: [1, [Validators.required, Validators.min(1)]],
      governingLaw: ['', Validators.required],
      jurisdiction: ['', Validators.required],
    });

    this.bindYearsToggle('mndaTerm', 'mndaTermYears', 'one_year');
    this.bindYearsToggle('termOfConfidentiality', 'confidentialityYears', 'one_year');
  }

  private bindYearsToggle(parentPath: string, yearsPath: string, activeValue: string): void {
    const parentCtrl = this.form.get(parentPath)!;
    const yearsCtrl = this.form.get(yearsPath)!;

    // Set initial state synchronously
    parentCtrl.value === activeValue ? yearsCtrl.enable() : yearsCtrl.disable();

    parentCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => (val === activeValue ? yearsCtrl.enable() : yearsCtrl.disable()));
  }

  get party1() {
    return this.form.get('party1') as FormGroup;
  }

  get party2() {
    return this.form.get('party2') as FormGroup;
  }

  get mndaTermYearsDisabled(): boolean {
    return this.form.get('mndaTermYears')?.disabled ?? false;
  }

  get confidentialityYearsDisabled(): boolean {
    return this.form.get('confidentialityYears')?.disabled ?? false;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmitted.emit(this.form.getRawValue() as NdaFormData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  isInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!(control?.invalid && control?.touched);
  }
}
