import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-nda-preview',
  standalone: true,
  imports: [],
  templateUrl: './nda-preview.component.html',
  styleUrl: './nda-preview.component.scss',
})
export class NdaPreviewComponent {
  @Input() renderedHtml = '';
  @Input() showActions = true;
  @Output() editRequested = new EventEmitter<void>();

  private readonly sanitizer = inject(DomSanitizer);

  get safeHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.renderedHtml);
  }

  onEdit(): void {
    this.editRequested.emit();
  }

  onDownloadPdf(): void {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(this.renderedHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }
}
