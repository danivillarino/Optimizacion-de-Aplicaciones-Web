import { PageRequest, PageResponse } from "../data/types";
import { Feed } from "./types";

export interface FeedRepository {
    getById(id: number): Promise<Feed | null>;
    save(feed: Feed): Promise<void>;
    saveMany(feeds: Feed[]): Promise<void>;
    list(
        request: PageRequest,
        filters: Record<string, any>,
    ): Promise<PageResponse<Feed>>;
    search(query: string, fields: string[]): Promise<Feed[]>;
    listCategories(): Promise<string[]>;
}
