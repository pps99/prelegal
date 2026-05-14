import { Component } from '@angular/core';
import { NdaChatComponent, DocResult } from '../../components/nda-chat/nda-chat.component';
import { NdaPreviewComponent } from '../../components/nda-preview/nda-preview.component';

@Component({
  selector: 'app-nda-page',
  standalone: true,
  imports: [NdaChatComponent, NdaPreviewComponent],
  templateUrl: './nda-page.component.html',
  styleUrl: './nda-page.component.scss',
})
export class NdaPageComponent {
  docResult: DocResult | null = null;

  onFormSubmitted(result: DocResult): void {
    this.docResult = result;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onEditRequested(): void {
    this.docResult = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
