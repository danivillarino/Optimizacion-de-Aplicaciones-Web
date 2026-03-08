import { FeedRepository } from "../models/feed-repository";
import { Feed } from "../models/types";
import { FeedDao } from "./Feed-dao";

export class FeedRepositoryAdapter implements FeedRepository {
    constructor(private readonly feedDao: FeedDao) {}

    getById(id: number): Promise<Feed | null> {
        return this.feedDao.getById(id);
    }
}
