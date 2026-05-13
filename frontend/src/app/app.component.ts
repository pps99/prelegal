import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NdaFormComponent } from './components/nda-form/nda-form.component';
import { NdaPreviewComponent } from './components/nda-preview/nda-preview.component';
import { NdaFormData } from './models/nda-data.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NdaFormComponent, NdaPreviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  ndaData: NdaFormData | null = null;

  onFormSubmitted(data: NdaFormData): void {
    this.ndaData = data;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditRequested(): void {
    this.ndaData = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
