import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NdaFormData } from '../../models/nda-data.model';
import { mndaTermLabel, confidentialityTermLabel, formatNdaDate } from '../../models/nda-labels';
import { NdaDownloadService } from '../../services/nda-download.service';

@Component({
  selector: 'app-nda-preview',
  standalone: true,
  imports: [],
  templateUrl: './nda-preview.component.html',
  styleUrl: './nda-preview.component.scss',
})
export class NdaPreviewComponent {
  @Input() data!: NdaFormData;
  @Input() showActions = true;
  @Output() editRequested = new EventEmitter<void>();

  constructor(private downloadService: NdaDownloadService) {}

  get mndaTermLabel(): string {
    return mndaTermLabel(this.data);
  }

  get confidentialityTermLabel(): string {
    return confidentialityTermLabel(this.data);
  }

  formatDate(dateStr: string): string {
    return formatNdaDate(dateStr);
  }

  onEdit(): void {
    this.editRequested.emit();
  }

  onDownload(): void {
    this.downloadService.downloadAsHtml(this.data);
  }

  onPrint(): void {
    window.print();
  }
}
