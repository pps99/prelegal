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
import { ChatService } from '../../services/chat.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DocResult {
  renderedHtml: string;
  fields: Record<string, any>;
}

@Component({
  selector: 'app-nda-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nda-chat.component.html',
  styleUrl: './nda-chat.component.scss',
})
export class NdaChatComponent implements OnInit {
  @Output() formSubmitted = new EventEmitter<DocResult>();
  @ViewChild('messagesEl') private messagesEl!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') private inputEl!: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  partialData: Record<string, any> | null = null;
  documentType: string | null = null;
  inputText = '';
  sessionId: number | null = null;
  loading = false;
  generating = false;
  error: string | null = null;

  private readonly chatService = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly DOC_NAMES: Record<string, string> = {
    mutual_nda: 'Mutual NDA',
    csa: 'Cloud Service Agreement',
    design_partner: 'Design Partner Agreement',
    sla: 'Service Level Agreement',
    psa: 'Professional Services Agreement',
    dpa: 'Data Processing Agreement',
    software_license: 'Software License Agreement',
    partnership: 'Partnership Agreement',
    pilot: 'Pilot Agreement',
    baa: 'Business Associate Agreement',
    ai_addendum: 'AI Addendum',
  };

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

  get documentDisplayName(): string {
    return this.documentType ? (this.DOC_NAMES[this.documentType] ?? this.documentType) : '';
  }

  get fieldEntries(): Array<{ label: string; value: string }> {
    if (!this.partialData) return [];
    const result: Array<{ label: string; value: string }> = [];
    const process = (obj: Record<string, any>, prefix: string) => {
      for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined || val === '') continue;
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        if (typeof val === 'object' && !Array.isArray(val)) {
          process(val as Record<string, any>, label);
        } else {
          result.push({ label: prefix ? `${prefix} › ${label}` : label, value: String(val) });
        }
      }
    };
    process(this.partialData, '');
    return result;
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
        this.documentType = res.document_type;
        this.partialData = res.partial_data;
        this.loading = false;
        this.scrollToBottom();
        this.inputEl?.nativeElement.focus();
      },
      error: () => {
        this.error = 'Failed to get a response. Please try again.';
        this.loading = false;
        this.inputEl?.nativeElement.focus();
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
        this.formSubmitted.emit({ renderedHtml: res.rendered_html, fields: res.fields });
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
        this.messagesEl.nativeElement.scrollTop = this.messagesEl.nativeElement.scrollHeight;
      }
    }, 0);
  }
}
