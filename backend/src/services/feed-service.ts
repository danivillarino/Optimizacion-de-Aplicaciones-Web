import { FeedRepository } from "../models/feed-repository";
import { Feed } from "../models/types";
import { RssService } from "./rss-service";

function extractImage(item: any): string {
    if (item.enclosure?.url) return item.enclosure.url;
    const thumb = item.mediaThumbnail;

    if (thumb) {
        const t = Array.isArray(thumb) ? thumb[0] : thumb;
        if (t?.$?.url) return t.$.url;
        if (typeof t === "string") return t;
    }
    const media = item.mediaContent;

    if (media) {
        const m = Array.isArray(media) ? media[0] : media;
        if (m?.$?.url) return m.$.url;
    }

    if (item.itunes?.image) return item.itunes.image;

    const html = (item.content ||
        item["content:encoded"] ||
        item.description ||
        "") as string;
    if (html) {
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch?.[1]) return imgMatch[1];
    }
    return "";
}

function extractCategories(item: any): string[] {
    if (Array.isArray(item.categories) && item.categories.length > 0) {
        return item.categories
            .map((cat: any) => {
                if (typeof cat === "string") return cat;
                if (cat && typeof cat === "object") {
                    return (cat as any)._ || (cat as any).text || null;
                }
                return null;
            })
            .filter((cat: any) => cat !== null) as string[];
    }

    const link = String(item.link || item.guid || "");
    if (link) {
        try {
            const pathname = new URL(link).pathname;
            const segments = pathname.split("/").filter(Boolean);
            const categories = segments.slice(0, -1); 
            if (categories.length > 0) return categories;
        } catch {}
    }
    return [];
}

export class FeedService {
    private rssService = new RssService();
    private savedFeedUrls: string[] = [];

    constructor(private readonly repository: FeedRepository) {}

    async addFeedUrl(url: string) {
        if (!this.savedFeedUrls.includes(url)) {
            this.savedFeedUrls.push(url);
        }
    }

    async updateFeeds(): Promise<void> {
        let successCount = 0;
        let errorCount = 0;

        for (const url of this.savedFeedUrls) {
            try {
                const rss = await this.rssService.fetchFeed(url);

                for (const item of rss.items) {
                    const feed: Feed = {
                        id: 0,
                        guid: String(item.guid || item.link || ""),
                        title: String(item.title || ""),
                        url: String(item.link || ""),
                        image: String(extractImage(item as any) || ""),
                        description: String(item.contentSnippet || ""),
                        content: String(item.content || ""),
                        date: new Date(item.pubDate || Date.now()),
                        categories: extractCategories(item as any),
                    };

                    await this.repository.save(feed);
                }

                successCount++;
            } catch (error) {
                console.error(`Error procesando feed ${url}:`, error);
                errorCount++;
            }
        }

        if (errorCount > 0 && successCount === 0) {
            throw new Error("Todos los feeds fallaron");
        }
    }
}
