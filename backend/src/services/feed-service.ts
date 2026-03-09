import { FeedRepository } from "../models/feed-repository";
import { Feed } from "../models/types";
import { RssService } from "./rss-service";

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
                        image: String((item as any).enclosure?.url || (item as any)["media:thumbnail"]?.$ || ""),
                        description: String(item.contentSnippet || ""),
                        content: String(item.content || ""),
                        date: new Date(item.pubDate || Date.now()),
                        categories: Array.isArray(item.categories) 
                            ? item.categories
                                .map(cat => {
                                    if (typeof cat === 'string') return cat;
                                    if (cat && typeof cat === 'object') {
                                        return (cat as any)._ || (cat as any).text || null;
                                    }
                                    return null;
                                })
                                .filter(cat => cat !== null) as string[]
                            : []
                    };

                    await this.repository.save(feed);
                }
                
                successCount++;
                
            } catch (error) {
                errorCount++;
            }
        }

        if (errorCount > 0 && successCount === 0) {
            throw new Error('Todos los feeds fallaron');
        }
    }

}