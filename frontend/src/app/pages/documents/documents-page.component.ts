import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { DocumentsService, DocumentSummary, DocumentDetail } from '../../services/documents.service';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [RouterModule, DatePipe],
  templateUrl: './documents-page.component.html',
  styleUrl: './documents-page.component.scss',
})
export class DocumentsPageComponent implements OnInit {
  documents: DocumentSummary[] = [];
  selected: DocumentDetail | null = null;
  loadingList = true;
  loadingDoc = false;
  error = '';

  readonly userEmail: string;

  private readonly auth = inject(AuthService);
  private readonly docsService = inject(DocumentsService);
  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    this.userEmail = this.auth.getUserEmail();
  }

  ngOnInit(): void {
    this.docsService.list().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loadingList = false;
      },
      error: () => {
        this.error = 'Failed to load documents.';
        this.loadingList = false;
      },
    });
  }

  selectDocument(id: number): void {
    if (this.selected?.id === id) return;
    this.loadingDoc = true;
    this.docsService.get(id).subscribe({
      next: (doc) => {
        this.selected = doc;
        this.loadingDoc = false;
      },
      error: () => {
        this.error = 'Failed to load document.';
        this.loadingDoc = false;
      },
    });
  }

  get safeHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.selected?.rendered_html ?? '');
  }

  onDownloadPdf(): void {
    if (!this.selected) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(this.selected.rendered_html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  logout(): void {
    this.auth.logout();
  }
}
