import { Feed } from "./types";

export interface FeedRepository {
    getById(id: number): Promise<Feed | null>;
}
