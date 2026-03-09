export interface FeedUpdateResult {
    success: Array<{ url: string; articlesCount: number }>;
    errors: Array<{ url: string; error: string }>;
    totalArticles: number;
}