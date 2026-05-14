import { Component } from '@angular/core';
import { NdaFormComponent } from '../../components/nda-form/nda-form.component';
import { NdaPreviewComponent } from '../../components/nda-preview/nda-preview.component';
import { NdaFormData } from '../../models/nda-data.model';

@Component({
  selector: 'app-nda-page',
  standalone: true,
  imports: [NdaFormComponent, NdaPreviewComponent],
  templateUrl: './nda-page.component.html',
  styleUrl: './nda-page.component.scss',
})
export class NdaPageComponent {
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
