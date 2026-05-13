import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NdaFormData } from '../../models/nda-data.model';

@Component({
  selector: 'app-nda-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nda-form.component.html',
  styleUrls: ['./nda-form.component.scss'],
})
export class NdaFormComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<NdaFormData>();

  form!: FormGroup;
  today = new Date().toISOString().split('T')[0];

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
  }

  get party1() {
    return this.form.get('party1') as FormGroup;
  }

  get party2() {
    return this.form.get('party2') as FormGroup;
  }

  get mndaTerm() {
    return this.form.get('mndaTerm')?.value;
  }

  get termOfConfidentiality() {
    return this.form.get('termOfConfidentiality')?.value;
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.formSubmitted.emit(this.form.value as NdaFormData);
    } else {
      this.form.markAllAsTouched();
    }
  }

  isInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!(control?.invalid && control?.touched);
  }
}
