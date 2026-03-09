import { FeedRepository } from "../models/feed-repository";
import { Feed } from "../models/types";
import { FeedDao } from "./Feed-dao";
import { PageRequest, PageResponse } from "./types";

export class FeedRepositoryAdapter implements FeedRepository {
    constructor(private readonly feedDao: FeedDao) {}

    getById(id: number): Promise<Feed | null> {
        return this.feedDao.getById(id);
    }

    save(feed: Feed): Promise<void> {
        this.feedDao.save(feed);
        return Promise.resolve();
    }

    list(request: PageRequest): Promise<PageResponse<Feed>> {
        return this.feedDao.list(request);
    }

    search(query: string, fields: string[]): Promise<Feed[]> {
        return this.feedDao.search(query, fields);
    }
}
