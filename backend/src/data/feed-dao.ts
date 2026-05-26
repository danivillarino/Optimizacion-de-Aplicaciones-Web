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

    async saveMany(feeds: Feed[]): Promise<void> {
        if (feeds.length === 0) return;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Un solo INSERT para todos los feeds
            const feedValues = feeds.map((f) => [
                f.guid,
                f.title,
                f.url,
                f.description,
                f.content,
                f.date,
                f.image,
            ]);

            const [results] = await connection.query(
                "INSERT IGNORE INTO feed (guid, title, url, description, content, date, image) VALUES ?",
                [feedValues],
            );

            // Reconstruir qué IDs se insertaron realmente
            const { insertId, affectedRows } = results as any;
            if (affectedRows === 0) {
                await connection.commit();
                return;
            }

            // IDs insertados son consecutivos desde insertId
            const insertedIds = Array.from(
                { length: affectedRows },
                (_, i) => insertId + i,
            );

            // Cruzar con los feeds que tenían categorías
            const feedsWithCategories = feeds.filter(
                (f) => f.categories.length > 0,
            );
            const categoryValues: [number, string][] = [];

            feedsWithCategories.forEach((feed, i) => {
                const id = insertedIds[i];
                feed.categories.forEach((cat) => {
                    categoryValues.push([id, cat]);
                });
            });

            if (categoryValues.length > 0) {
                await connection.query(
                    "INSERT IGNORE INTO feed_categories (feed_id, category) VALUES ?",
                    [categoryValues],
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async list(
        request: PageRequest,
        filters: Record<string, any>,
    ): Promise<PageResponse<Feed>> {
        const offset = (request.page - 1) * request.size;
        const orderByQuery = this.buildSpecificOrderByQuery(
            request.orderBy,
            request.order,
        );

        // Separar filtros de feed y de categoría
        const { category, ...feedFilters } = filters;

        const whereClauses: string[] = Object.keys(feedFilters).map(
            (key) => `f.${key} = ?`,
        );
        const whereValues: any[] = Object.values(feedFilters);

        // Si hay filtro de categoría, añadir JOIN y condición
        const joinClause = category
            ? "JOIN feed_categories fc ON f.id = fc.feed_id"
            : "";

        if (category) {
            whereClauses.push("fc.category = ?");
            whereValues.push(category);
        }

        const whereClause =
            whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        const finalQuery = `
        SELECT DISTINCT f.* FROM feed f
        ${joinClause}
        ${whereClause}
        ${orderByQuery}
        LIMIT ? OFFSET ?
    `;

        const countQuery = `
        SELECT COUNT(DISTINCT f.id) as count FROM feed f
        ${joinClause}
        ${whereClause}
    `;

        const [feedRows] = await pool.query(finalQuery, [
            ...whereValues,
            request.size || DEFAULT_PAGE_SIZE,
            offset,
        ]);

        const [countRows] = await pool.query(countQuery, whereValues);

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
            allowedFields.map(() => `%${query.toLowerCase()}%`),
        );
        console.log("FeedDao.search - feedRows:", feedRows);
        const categoryRows: any[] =
            (feedRows as any[]).length > 0
                ? ((
                      await pool.query(
                          "SELECT feed_id, category FROM feed_categories WHERE feed_id IN (?)",
                          [(feedRows as any[]).map((row) => row.id)],
                      )
                  )[0] as any[])
                : [];
        return (feedRows as any[]).map((row) => ({
            id: row.id,
            guid: row.guid,
            title: row.title,
            url: row.url,
            description: row.description,
            content: row.content,
            date: new Date(row.date),
            image: row.image,
            categories: categoryRows
                .filter((cat) => cat.feed_id === row.id)
                .map((cat) => cat.category),
        }));
    }

    async listCategories(): Promise<string[]> {
        const [rows] = await pool.query(
            "SELECT DISTINCT category FROM feed_categories",
        );
        return (rows as any[]).map((row) => row.category);
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
