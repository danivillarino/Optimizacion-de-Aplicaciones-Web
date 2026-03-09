import Parser from "rss-parser";

const parser = new Parser({
    customFields: {
        item: [
            ["media:thumbnail", "mediaThumbnail"],
            ["media:content", "mediaContent"],
            ["content:encoded", "content:encoded"],
            ["enclosure", "enclosure"],
        ],
    },
});

export class RssService {
    async fetchFeed(url: string) {
        const feed = await parser.parseURL(url);
        return feed;
    }
}
