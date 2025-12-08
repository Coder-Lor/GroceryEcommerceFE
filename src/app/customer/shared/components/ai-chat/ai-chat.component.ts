import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { GoogleGenAI } from '@google/genai';
import { ProductService } from '@core/service/product.service';
import { ProductBaseResponse } from '@services/system-admin.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

@Component({
    selector: 'app-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-chat.component.html',
    styleUrls: ['./ai-chat.component.scss'],
})
export class AiChatComponent implements OnInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);
    private productService = inject(ProductService);
    private destroy$ = new Subject<void>();

    @ViewChild('chatContainer') chatContainer!: ElementRef;
    @ViewChild('chatPopover') chatPopover!: ElementRef;

    // State
    isOpen: boolean = false;
    chatMode: 'chat' | 'suggest' = 'chat';
    userMessage: string = '';
    messages: ChatMessage[] = [];
    isLoading: boolean = false;
    products: ProductBaseResponse[] = [];
    isLoadingProducts: boolean = false;

    // Gemini AI
    private ai = new GoogleGenAI({
        apiKey: 'AIzaSyAeawecfMakGZ2v2N7DC2dSS7RLP9JJt5w'
    });

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.addWelcomeMessage();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (this.chatPopover?.nativeElement && !this.chatPopover.nativeElement.contains(event.target)) {
            // Không đóng nếu click vào nút toggle
            const toggleBtn = document.querySelector('.ai-chat-toggle');
            if (toggleBtn && toggleBtn.contains(event.target as Node)) {
                return;
            }
            this.isOpen = false;
        }
    }

    toggleChat(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen && this.chatMode === 'suggest' && this.products.length === 0) {
            this.loadProducts();
        }
    }

    switchMode(mode: 'chat' | 'suggest'): void {
        this.chatMode = mode;
        this.messages = [];
        this.addWelcomeMessage();

        if (mode === 'suggest' && this.products.length === 0) {
            this.loadProducts();
        }
    }

    private addWelcomeMessage(): void {
        const welcomeMsg = this.chatMode === 'chat'
            ? 'Xin chào! 👋 Tôi là trợ lý AI của GroceryMart. Bạn có thể hỏi tôi bất cứ điều gì về thực phẩm, nấu ăn, dinh dưỡng hoặc bất kỳ chủ đề nào bạn quan tâm!'
            : 'Xin chào! 👋 Tôi sẽ gợi ý sản phẩm phù hợp với nhu cầu của bạn. Hãy cho tôi biết bạn đang tìm kiếm gì? (Ví dụ: "Tôi muốn nấu phở", "Gợi ý đồ ăn sáng healthy", "Sản phẩm cho trẻ em")';

        this.messages.push({
            role: 'assistant',
            content: welcomeMsg,
            timestamp: new Date()
        });
    }

    private loadProducts(): void {
        this.isLoadingProducts = true;
        this.productService.getProductByPaging(1, 100)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response?.items) {
                        this.products = response.items;
                        console.log('Loaded products for AI suggestion:', this.products.length);
                    }
                    this.isLoadingProducts = false;
                },
                error: (err) => {
                    console.error('Error loading products:', err);
                    this.isLoadingProducts = false;
                }
            });
    }

    async sendMessage(): Promise<void> {
        if (!this.userMessage.trim() || this.isLoading) return;

        const userMsg = this.userMessage.trim();
        this.messages.push({
            role: 'user',
            content: userMsg,
            timestamp: new Date()
        });
        this.userMessage = '';
        this.isLoading = true;

        this.scrollToBottom();

        try {
            let prompt: string;

            if (this.chatMode === 'suggest') {
                // Chế độ gợi ý sản phẩm
                const productList = this.products.map(p => ({
                    name: p.name,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    shortDescription: p.shortDescription,
                    categoryName: p.categoryName
                }));

                prompt = `Bạn là trợ lý mua sắm thông minh của GroceryMart - một cửa hàng tạp hóa/thực phẩm online tại Việt Nam.

DANH SÁCH SẢN PHẨM HIỆN CÓ:
${JSON.stringify(productList, null, 2)}

YÊU CẦU CỦA KHÁCH HÀNG: "${userMsg}"

Hãy gợi ý 3-5 sản phẩm phù hợp nhất từ danh sách trên dựa trên yêu cầu của khách hàng.
Nếu khách hỏi về công thức nấu ăn, hãy gợi ý nguyên liệu có trong cửa hàng.
Nếu không có sản phẩm phù hợp, hãy thông báo và gợi ý sản phẩm tương tự.

Trả lời bằng tiếng Việt, thân thiện, ngắn gọn và hữu ích. Có thể sử dụng emoji.
Format: Liệt kê sản phẩm với tên, giá và mô tả ngắn gọn lý do gợi ý.`;

            } else {
                // Chế độ trò chuyện tự do
                prompt = `Bạn là trợ lý AI thân thiện của GroceryMart - cửa hàng tạp hóa/thực phẩm tại Việt Nam.
Bạn có thể trò chuyện về mọi chủ đề, đặc biệt am hiểu về:
- Thực phẩm, dinh dưỡng, sức khỏe
- Công thức nấu ăn, mẹo vặt nhà bếp
- Mua sắm thông minh, tiết kiệm
- Và bất kỳ chủ đề nào khác

LỊCH SỬ TRÒ CHUYỆN:
${this.messages.slice(-10).map(m => `${m.role === 'user' ? 'Khách hàng' : 'Trợ lý'}: ${m.content}`).join('\n')}

TIN NHẮN MỚI CỦA KHÁCH HÀNG: "${userMsg}"

Hãy trả lời bằng tiếng Việt, thân thiện, hữu ích và ngắn gọn (tối đa 200 từ). Có thể sử dụng emoji.`;
            }

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });

            const assistantMsg = response.text || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại!';

            this.messages.push({
                role: 'assistant',
                content: assistantMsg,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('AI Chat error:', error);
            this.messages.push({
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau! 😅',
                timestamp: new Date()
            });
        } finally {
            this.isLoading = false;
            this.scrollToBottom();
        }
    }

    private scrollToBottom(): void {
        setTimeout(() => {
            if (this.chatContainer?.nativeElement) {
                this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }

    onKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    clearChat(): void {
        this.messages = [];
        this.addWelcomeMessage();
    }
}
