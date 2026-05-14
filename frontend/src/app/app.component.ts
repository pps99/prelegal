import { Component } from '@angular/core';
import { NdaFormComponent } from './components/nda-form/nda-form.component';
import { NdaPreviewComponent } from './components/nda-preview/nda-preview.component';
import { NdaFormData } from './models/nda-data.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NdaFormComponent, NdaPreviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  ndaData: NdaFormData | null = null;

  onFormSubmitted(data: NdaFormData): void {
    this.ndaData = data;
    this.scrollToTop();
  }

  onEditRequested(): void {
    this.ndaData = null;
    this.scrollToTop();
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
