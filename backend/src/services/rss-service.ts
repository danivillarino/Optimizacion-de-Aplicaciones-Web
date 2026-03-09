import Parser from "rss-parser";

const parser = new Parser();

export class RssService {
    async fetchFeed(url: string) {
        const feed = await parser.parseURL(url);
        return feed;
    }

}