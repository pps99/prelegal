import { Component } from '@angular/core';
import { NdaChatComponent } from '../../components/nda-chat/nda-chat.component';
import { NdaPreviewComponent } from '../../components/nda-preview/nda-preview.component';
import { NdaFormData } from '../../models/nda-data.model';

@Component({
  selector: 'app-nda-page',
  standalone: true,
  imports: [NdaChatComponent, NdaPreviewComponent],
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
