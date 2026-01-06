import { inject, Injectable } from "@angular/core";
import { API_BASE_URL } from "./system-admin.service";
import { firstValueFrom } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root'
})
export class MinimalService {
    private http = inject(HttpClient);
    private apiKeyCache: string | null = null;
    private baseUrl = inject(API_BASE_URL);

    async getKey(): Promise<string> {
        if (this.apiKeyCache) {
            return this.apiKeyCache;
        }

        try {
            const url = `${this.baseUrl}/gemini-apikey`;
            this.apiKeyCache = await firstValueFrom(
                this.http.get<string>(url, { withCredentials: true })
            );
            return this.apiKeyCache;
        } catch (error) {
            console.error('Error getting Gemini API key:', error);
            throw error;
        }
    }
}