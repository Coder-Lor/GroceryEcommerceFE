import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe để chuyển đổi Azure blob storage URLs sang proxy URLs
 * Usage: {{ imageUrl | proxyImage }}
 * Example: <img [src]="product.imageUrl | proxyImage" />
 */
@Pipe({
    name: 'proxyImage',
    standalone: true,
})
export class ProxyImagePipe implements PipeTransform {
    private readonly azureDomain = 'hauiimages2025.blob.core.windows.net';
    private readonly proxyDomain = 'sellervn.net/proxy-azure';

    transform(originalUrl: string | null | undefined): string {
        if (!originalUrl) return '';

        if (originalUrl.includes(this.azureDomain)) {
            return originalUrl.replace(this.azureDomain, this.proxyDomain);
        }

        return originalUrl;
    }
}
