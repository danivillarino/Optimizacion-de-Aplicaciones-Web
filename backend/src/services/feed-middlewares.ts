import { Request, Response, NextFunction, RequestHandler } from "express";

interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
}

const feedCache = new Map<string, CacheEntry>();

export function cache(ttl = 60): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.originalUrl;
        const cached = feedCache.get(key);

        if (cached && Date.now() - cached.timestamp < ttl * 1000) {
            res.json(cached.data);
            return;
        }

        const originalJson = res.json.bind(res);
        res.json = (data: unknown): Response => {
            feedCache.set(key, { data, timestamp: Date.now() });
            return originalJson(data);
        };
        next();
    };
}

export function httpCache(maxAge: number = 300): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        res.set("Cache-Control", `public, max-age=${maxAge}`);
        next();
    };
}

export function noHttpCache(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        res.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate",
        );
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        next();
    };
}

export function clearFeedCache(): void {
    feedCache.clear();
}

export function invalidateFeedCache(key: string): void {
    feedCache.delete(key);
}
