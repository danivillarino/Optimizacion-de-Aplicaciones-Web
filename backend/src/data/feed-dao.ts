import { Feed } from "../models/types";
import mysql from "mysql2/promise";
import { mysqlConfig } from "../config";
import { PageRequest, PageResponse } from "./types";

const pool = mysql.createPool(mysqlConfig);

const ALLOWED_ORDER_BY_FIELDS = ["date", "title", "content"];
const ALLOWED_ORDER_DIRECTIONS = ["asc", "desc"];
const DEFAULT_ORDER_BY = "date";
const DEFAULT_ORDER = "desc";
const DEFAULT_PAGE_SIZE = 10;

export class FeedDao {
    async getById(id: number): Promise<Feed | null> {
        const [feedRows] = await pool.query("SELECT * FROM feed WHERE id = ?", [
            id,
        ]);
        const [categoryRows] = await pool.query(
            "SELECT category FROM feed_categories WHERE feed_id = ?",
            [id],
        );
        if ((feedRows as any[]).length === 0) {
            return null;
        }
        return {
            id: (feedRows as any[])[0].id,
            guid: (feedRows as any[])[0].guid,
            title: (feedRows as any[])[0].title,
            image: (feedRows as any[])[0].image,
            url: (feedRows as any[])[0].url,
            description: (feedRows as any[])[0].description,
            content: (feedRows as any[])[0].content,
            date: new Date((feedRows as any[])[0].date),
            categories: (categoryRows as any[]).map((row) => row.category),
        };
    }

    async save(feed: Feed): Promise<void> {
        const [result] = await pool.query(
            "INSERT IGNORE INTO feed (guid, title, url, description, content, date, image) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                feed.guid,
                feed.title,
                feed.url,
                feed.description,
                feed.content,
                feed.date,
                feed.image,
            ],
        );
        const insertedId = (result as any).insertId;
        // insertedId is 0 when the row was skipped due to duplicate guid
        if (insertedId === 0) {
            return;
        }
        for (const category of feed.categories) {
            await pool.query(
                "INSERT IGNORE INTO feed_categories (feed_id, category) VALUES (?, ?)",
                [insertedId, category],
            );
        }
    }

    async list(request: PageRequest): Promise<PageResponse<Feed>> {
        const offset = (request.page - 1) * request.size;
        const orderByQuery = this.buildSpecificOrderByQuery(
            request.orderBy,
            request.order,
        );
        const [feedRows] = await pool.query(
            `SELECT * FROM feed ${orderByQuery} LIMIT ? OFFSET ?`,
            [request.size || DEFAULT_PAGE_SIZE, offset],
        );
        const [countRows] = await pool.query(
            "SELECT COUNT(*) as count FROM feed",
        );
        const totalItems = (countRows as any[])[0].count;
        const totalPages = Math.ceil(
            totalItems / (request.size || DEFAULT_PAGE_SIZE),
        );
        const feedIds = (feedRows as any[]).map((row) => row.id);
        const categoryRows: any[] =
            feedIds.length > 0
                ? ((
                      await pool.query(
                          "SELECT feed_id, category FROM feed_categories WHERE feed_id IN (?)",
                          [feedIds],
                      )
                  )[0] as any[])
                : [];
        const feeds: Feed[] = (feedRows as any[]).map((row) => ({
            id: row.id,
            guid: row.guid,
            title: row.title,
            url: row.url,
            description: row.description,
            image: row.image,
            content: row.content,
            date: new Date(row.date),
            categories: categoryRows
                .filter((cat) => cat.feed_id === row.id)
                .map((cat) => cat.category),
        }));
        return {
            items: feeds,
            totalItems,
            totalPages,
            currentPage: request.page,
            hasNextPage: request.page < totalPages,
        };
    }

    async search(query: string, fields: string[]): Promise<Feed[]> {
        const allowedFields = fields.filter((field) =>
            this.fieldIsAllowed(field),
        );
        if (allowedFields.length === 0) {
            return [];
        }
        const whereClauses = allowedFields
            .map((field) => `${field} LIKE ?`)
            .join(" OR ");
        const [feedRows] = await pool.query(
            `SELECT * FROM feed WHERE ${whereClauses}`,
            allowedFields.map(() => `%${query}%`),
        );
        console.log("FeedDao.search - feedRows:", feedRows);
        return (feedRows as any[]).map((row) => ({
            id: row.id,
            guid: row.guid,
            title: row.title,
            url: row.url,
            description: row.description,
            content: row.content,
            date: new Date(row.date),
            image: row.image,
            categories: [],
        }));
    }

    private fieldIsAllowed(field: string): boolean {
        return ALLOWED_ORDER_BY_FIELDS.includes(field);
    }

    private buildSpecificOrderByQuery(orderBy: string, order: string): string {
        const orderByField = ALLOWED_ORDER_BY_FIELDS.includes(orderBy)
            ? orderBy
            : DEFAULT_ORDER_BY;
        const orderDirection = ALLOWED_ORDER_DIRECTIONS.includes(order)
            ? order
            : DEFAULT_ORDER;
        return `ORDER BY ${orderByField} ${orderDirection}`;
    }
}
