import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GoogleGenAI } from '@google/genai';
import { ProductService } from '@core/service/product.service';
import { ProductBaseResponse } from '@services/system-admin.service';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestedProducts?: SuggestedProduct[];
}

interface SuggestedProduct {
    productId: string;
    name: string;
    price: number;
    discountPrice?: number;
    imageUrl?: string;
    slug?: string;
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
    private router = inject(Router);
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
            ? 'Xin chào! 👋 Tôi là trợ lý AI của GroceryMart. Bạn có thể hỏi tôi bất cứ điều gì - từ công nghệ, thời trang, gia dụng, đến mỹ phẩm, thực phẩm và nhiều hơn nữa!'
            : 'Xin chào! 👋 Tôi sẽ gợi ý sản phẩm phù hợp với nhu cầu của bạn. Hãy cho tôi biết bạn đang tìm kiếm gì?';

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
                    productId: p.productId,
                    name: p.name,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    shortDescription: p.shortDescription,
                    categoryName: p.categoryName,
                    slug: p.slug
                }));

                prompt = `Bạn là trợ lý mua sắm thông minh của GroceryMart - một sàn thương mại điện tử đa ngành tại Việt Nam, bán đủ loại sản phẩm từ điện tử, thời trang, gia dụng, mỹ phẩm, thực phẩm đến đồ chơi, sách vở và nhiều hơn nữa.

DANH SÁCH SẢN PHẨM HIỆN CÓ:
${JSON.stringify(productList, null, 2)}

YÊU CẦU CỦA KHÁCH HÀNG: "${userMsg}"

Hãy gợi ý 3-5 sản phẩm phù hợp nhất từ danh sách trên dựa trên yêu cầu của khách hàng.
Nếu không có sản phẩm phù hợp, hãy thông báo và gợi ý sản phẩm tương tự hoặc đưa ra lời khuyên.

QUAN TRỌNG: Trả lời theo format JSON như sau (CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC):
{
  "message": "Lời giới thiệu/tư vấn ngắn gọn bằng tiếng Việt, thân thiện, có emoji",
  "products": [
    {
      "productId": "id của sản phẩm từ danh sách",
      "name": "tên sản phẩm",
      "price": giá gốc,
      "discountPrice": giá khuyến mãi hoặc null,
      "reason": "lý do gợi ý ngắn gọn"
    }
  ]
}`;

            } else {
                // Chế độ trò chuyện tự do
                prompt = `Bạn là trợ lý AI thân thiện của GroceryMart - sàn thương mại điện tử đa ngành hàng đầu tại Việt Nam.
Bạn có thể trò chuyện về mọi chủ đề, đặc biệt am hiểu về:
- Công nghệ, điện tử, gadget
- Thời trang, làm đẹp, mỹ phẩm
- Gia dụng, nội thất, đồ dùng nhà cửa
- Thực phẩm, dinh dưỡng, sức khỏe
- Sách, đồ chơi, quà tặng
- Mua sắm thông minh, so sánh sản phẩm
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

            const responseText = response.text || '';

            if (this.chatMode === 'suggest') {
                // Parse JSON response for product suggestions
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        const suggestedProducts: SuggestedProduct[] = (parsed.products || []).map((p: any) => {
                            const originalProduct = this.products.find(op => op.productId === p.productId);
                            return {
                                productId: p.productId,
                                name: p.name,
                                price: p.price,
                                discountPrice: p.discountPrice,
                                imageUrl: originalProduct?.primaryImageUrl,
                                slug: originalProduct?.slug,
                                reason: p.reason
                            };
                        });

                        this.messages.push({
                            role: 'assistant',
                            content: parsed.message || 'Đây là các sản phẩm gợi ý cho bạn:',
                            timestamp: new Date(),
                            suggestedProducts
                        });
                    } else {
                        throw new Error('Invalid JSON');
                    }
                } catch {
                    // Fallback if JSON parsing fails
                    this.messages.push({
                        role: 'assistant',
                        content: responseText || 'Xin lỗi, tôi không thể tìm được sản phẩm phù hợp.',
                        timestamp: new Date()
                    });
                }
            } else {
                this.messages.push({
                    role: 'assistant',
                    content: responseText || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại!',
                    timestamp: new Date()
                });
            }

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

    viewProduct(product: SuggestedProduct): void {
        this.isOpen = false;
        if (product.slug) {
            this.router.navigate(['/product-detail', product.slug]);
        } else if (product.productId) {
            this.router.navigate(['/product-detail', product.productId]);
        }
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('vi-VN').format(price) + '₫';
    }
}
