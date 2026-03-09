import { FeedDao } from "../data/feed-dao";
export const testService = {
    testFunction: ({ query, fields }: { query: string; fields: string[] }) => {
        console.log(
            "Executing testFunction with query:",
            query,
            "and fields:",
            fields,
        );
        const feedDao = new FeedDao();
        const result = feedDao.search(query, fields);
        console.log("Result from FeedDao.search:", result);
        return result;
    },
};
