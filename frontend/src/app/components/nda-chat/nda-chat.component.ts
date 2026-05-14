import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChatService, PartialNdaData, PartialPartyInfo } from '../../services/chat.service';
import { NdaPreviewComponent } from '../nda-preview/nda-preview.component';
import { NdaFormData, PartyInfo } from '../../models/nda-data.model';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-nda-chat',
  standalone: true,
  imports: [FormsModule, NdaPreviewComponent],
  templateUrl: './nda-chat.component.html',
  styleUrl: './nda-chat.component.scss',
})
export class NdaChatComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<NdaFormData>();
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];
  partialData: PartialNdaData | null = null;
  inputText = '';
  sessionId: number | null = null;
  loading = false;
  generating = false;
  error: string | null = null;

  private readonly today = new Date().toISOString().split('T')[0];
  private readonly chatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.chatService.createSession().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.sessionId = res.session_id;
        this.messages.push({ role: 'assistant', content: res.greeting });
        this.scrollToBottom();
      },
      error: () => {
        this.error = 'Failed to start session. Please refresh the page.';
      },
    });
  }

  private mapParty(partial: PartialPartyInfo | null | undefined): PartyInfo {
    return {
      companyName: partial?.companyName ?? '',
      contactName: partial?.contactName ?? '',
      title: partial?.title ?? '',
      noticeAddress: partial?.noticeAddress ?? '',
      signatureDate: partial?.signatureDate ?? this.today,
    };
  }

  get previewData(): NdaFormData {
    const p = this.partialData;
    return {
      party1: this.mapParty(p?.party1),
      party2: this.mapParty(p?.party2),
      purpose: p?.purpose ?? '',
      effectiveDate: p?.effectiveDate ?? this.today,
      mndaTerm: p?.mndaTerm ?? 'one_year',
      mndaTermYears: p?.mndaTermYears ?? 1,
      termOfConfidentiality: p?.termOfConfidentiality ?? 'one_year',
      confidentialityYears: p?.confidentialityYears ?? 1,
      governingLaw: p?.governingLaw ?? '',
      jurisdiction: p?.jurisdiction ?? '',
    };
  }

  sendMessage(): void {
    const content = this.inputText.trim();
    if (!content || !this.sessionId || this.loading) return;

    this.messages.push({ role: 'user', content });
    this.inputText = '';
    this.loading = true;
    this.error = null;
    this.scrollToBottom();

    this.chatService.sendMessage(this.sessionId, content).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.message });
        this.partialData = res.partial_nda_data;
        this.loading = false;
        this.scrollToBottom();
      },
      error: () => {
        this.error = 'Failed to get a response. Please try again.';
        this.loading = false;
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  generateDocument(): void {
    if (!this.sessionId || this.generating || this.loading) return;
    this.generating = true;
    this.error = null;

    this.chatService.generateDocument(this.sessionId).subscribe({
      next: (res) => {
        this.generating = false;
        this.formSubmitted.emit(res.nda_data);
      },
      error: () => {
        this.error = 'Failed to generate document. Please try again.';
        this.generating = false;
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesEl) {
        this.messagesEl.nativeElement.scrollTop =
          this.messagesEl.nativeElement.scrollHeight;
      }
    }, 0);
  }
}
