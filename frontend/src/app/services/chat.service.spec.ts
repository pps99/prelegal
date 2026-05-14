import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createSession()', () => {
    it('should POST to /api/chat/sessions', () => {
      service.createSession().subscribe((res) => {
        expect(res.session_id).toBe(1);
        expect(res.greeting).toBe('Hello!');
      });

      const req = httpMock.expectOne('/api/chat/sessions');
      expect(req.request.method).toBe('POST');
      req.flush({ session_id: 1, greeting: 'Hello!' });
    });
  });

  describe('sendMessage()', () => {
    it('should POST to the correct session URL with message content', () => {
      service.sendMessage(42, 'test message').subscribe((res) => {
        expect(res.message).toBe('AI response');
        expect(res.document_type).toBeNull();
        expect(res.partial_data).toBeNull();
      });

      const req = httpMock.expectOne('/api/chat/sessions/42/messages');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'test message' });
      req.flush({ message: 'AI response', document_type: null, partial_data: null });
    });
  });

  describe('generateDocument()', () => {
    it('should POST to the generate URL and return fields and rendered_html', () => {
      service.generateDocument(42).subscribe((res) => {
        expect(res.rendered_html).toBe('<html>doc</html>');
        expect(res.fields['governingLaw']).toBe('Delaware');
      });

      const req = httpMock.expectOne('/api/chat/sessions/42/generate');
      expect(req.request.method).toBe('POST');
      req.flush({ rendered_html: '<html>doc</html>', fields: { governingLaw: 'Delaware' } });
    });
  });
});
