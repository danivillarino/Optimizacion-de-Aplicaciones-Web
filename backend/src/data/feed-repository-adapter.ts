import { FeedRepository } from "../models/feed-repository";
import { Feed } from "../models/types";
import { FeedDao } from "./feed-dao";
import { PageRequest, PageResponse } from "./types";

export class FeedRepositoryAdapter implements FeedRepository {
    constructor(private readonly feedDao: FeedDao) {}

    getById(id: number): Promise<Feed | null> {
        return this.feedDao.getById(id);
    }

    async save(feed: Feed): Promise<void> {
        await this.feedDao.save(feed);
    }

    async saveMany(feeds: Feed[]): Promise<void> {
        await this.feedDao.saveMany(feeds);
    }

    list(
        request: PageRequest,
        filters: Record<string, any>,
    ): Promise<PageResponse<Feed>> {
        return this.feedDao.list(request, filters);
    }

    async search(query: string, fields: string[]): Promise<Feed[]> {
        const result = await this.feedDao.search(query, fields);
        console.log(
            "categories: ",
            result
                .filter((feed) => feed.categories && feed.categories.length > 0)
                .map((feed) => feed.categories),
        );
        return result;
    }

    listCategories(): Promise<string[]> {
        return this.feedDao.listCategories();
    }
}
