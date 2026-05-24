import { FeedRepository } from "../models/feed-repository";
import { UrlRepository } from "../models/url-repository";
import { Feed } from "../models/types";
import { RssService } from "./rss-service";
import { clearFeedCache } from "./feed-middlewares";

interface RawFeedItem {
    guid?: string;
    link?: string;
    title?: string;
    contentSnippet?: string;
    content?: string;
    pubDate?: string;
    categories?: unknown[];
    enclosure?: { url?: string };
}

function extractCategories(item: RawFeedItem): string[] {
    if (!Array.isArray(item.categories)) return [];

    return item.categories
        .map((cat) => {
            if (typeof cat === "string") return cat;
            if (cat && typeof cat === "object") {
                const c = cat as Record<string, unknown>;
                if (typeof c._ === "string") return c._;
                if (typeof c.text === "string") return c.text;
            }
            return null;
        })
        .filter((cat): cat is string => cat !== null);
}

export class FeedService {
    private rssService = new RssService();
    private urlRepository = new UrlRepository();

    constructor(private readonly repository: FeedRepository) {}

    addFeedUrl(url: string): void {
        this.urlRepository.addUrl(url);
        clearFeedCache();
    }

    async updateFeeds(): Promise<void> {
        const urls = this.urlRepository.getUrls();

        const results = await Promise.allSettled(
            urls.map((url) => this.processFeed(url)),
        );

        const errorCount = results.filter(
            (r) => r.status === "rejected",
        ).length;
        const successCount = results.filter(
            (r) => r.status === "fulfilled",
        ).length;

        if (errorCount > 0 && successCount === 0) {
            throw new Error("Todos los feeds fallaron");
        }
        clearFeedCache();
    }

    private async processFeed(url: string): Promise<void> {
        const rss = await this.rssService.fetchFeed(url);

        const feeds: Feed[] = rss.items.map((item) => {
            const raw = item as RawFeedItem;
            return {
                id: 0,
                guid: String(raw.guid ?? raw.link ?? ""),
                title: String(raw.title ?? ""),
                url: String(raw.link ?? ""),
                image: String(raw.enclosure?.url ?? ""),
                description: String(raw.contentSnippet ?? ""),
                content: String(raw.content ?? ""),
                date: new Date(raw.pubDate ?? Date.now()),
                categories: extractCategories(raw),
            };
        });

        await this.repository.saveMany(feeds);
    }
}
