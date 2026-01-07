/**
 * Utility function to convert Azure blob storage URLs to proxy URLs
 */
export function getProxyImageUrl(originalUrl: string | null | undefined): string {
    if (!originalUrl) return "";

    // Chỉ thay thế nếu là link của Azure này
    const azureDomain = "hauiimages2025.blob.core.windows.net";
    const myProxyDomain = "sellervn.net/proxy-azure";

    if (originalUrl.includes(azureDomain)) {
        return originalUrl.replace(azureDomain, myProxyDomain);
    }

    return originalUrl; // Trả về nguyên gốc nếu không phải ảnh Azure
}
