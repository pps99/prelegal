import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NdaFormData } from '../../models/nda-data.model';
import { NdaDownloadService } from '../../services/nda-download.service';

@Component({
  selector: 'app-nda-preview',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './nda-preview.component.html',
  styleUrls: ['./nda-preview.component.scss'],
  providers: [DatePipe],
})
export class NdaPreviewComponent {
  @Input() data!: NdaFormData;
  @Output() editRequested = new EventEmitter<void>();

  constructor(private downloadService: NdaDownloadService, private datePipe: DatePipe) {}

  get mndaTermLabel(): string {
    if (this.data.mndaTerm === 'one_year') {
      const y = this.data.mndaTermYears;
      return `Expires ${y} year${y !== 1 ? 's' : ''} from Effective Date.`;
    }
    return 'Continues until terminated in accordance with the terms of the MNDA.';
  }

  get confidentialityTermLabel(): string {
    if (this.data.termOfConfidentiality === 'one_year') {
      const y = this.data.confidentialityYears;
      return `${y} year${y !== 1 ? 's' : ''} from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`;
    }
    return 'In perpetuity.';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return this.datePipe.transform(dateStr + 'T00:00:00', 'MMMM d, y') ?? dateStr;
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
