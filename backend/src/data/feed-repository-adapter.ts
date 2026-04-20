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

    list(request: PageRequest): Promise<PageResponse<Feed>> {
        return this.feedDao.list(request);
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
}
