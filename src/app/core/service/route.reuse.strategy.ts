import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from "@angular/router";

@Injectable({
    providedIn: 'root'
})
export class CustomReuseStrategy implements RouteReuseStrategy {
    storedRoute = new Map<string, DetachedRouteHandle>();
    detachedRoute: string[] = [
        'home',
        'admin/home'
    ];

    private getFullPath(route: ActivatedRouteSnapshot): string {
        const segments: string[] = [];
        let current: ActivatedRouteSnapshot | null = route;

        while (current) {
            if (current.routeConfig?.path) {
                segments.unshift(current.routeConfig.path);
            }
            current = current.parent;
        }

        return segments.join('/');
    }

    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        const path = this.getFullPath(route);
        return !!path && this.detachedRoute.includes(path);
    }
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
        const key = this.getFullPath(route);
        this.storedRoute.set(key, handle);
    }
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        return this.storedRoute.has(this.getFullPath(route));
    }
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        return this.storedRoute.get(this.getFullPath(route)) || null;
    }
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        return future.routeConfig === curr.routeConfig;
    }

}