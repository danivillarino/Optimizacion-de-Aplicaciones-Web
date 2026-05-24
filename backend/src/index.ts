import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

import { FeedDao } from "./data/feed-dao";
import { FeedRepositoryAdapter } from "./data/feed-repository-adapter";
import { FeedService } from "./services/feed-service";
import { cache, httpCache, noHttpCache } from "./services/feed-middlewares";
import compression from "compression";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.json({ limit: "3mb" }));

const feedDao = new FeedDao();
const feedRepository = new FeedRepositoryAdapter(feedDao);
const feedService = new FeedService(feedRepository);

app.get("/", (_: Request, res: Response) => {
    res.json({
        message: "Servidor RSS funcionando",
    });
});

app.post("/api/feeds", noHttpCache(), async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                error: "Debe proporcionar una URL de RSS",
            });
        }
        await feedService.addFeedUrl(url);
        res.json({
            message: "RSS agregado correctamente",
            url,
        });
    } catch (error) {
        console.error("Error agregando RSS:", error);
        res.status(500).json({
            error: "Error agregando RSS",
        });
    }
});

app.post(
    "/api/articles/update",
    noHttpCache(),
    async (req: Request, res: Response) => {
        try {
            await feedService.updateFeeds();
            res.status(200).json({
                message: "Feeds actualizados correctamente",
            });
        } catch (error) {
            console.error("Error actualizando feeds:", error);
            res.status(500).json({
                error: "Error actualizando feeds",
            });
        }
    },
);

app.get(
    "/api/articles/search",
    noHttpCache(),
    async (req: Request, res: Response) => {
        try {
            const query = req.query.query as string;
            const fieldsParam = req.query.fields as string;

            if (!query) {
                return res.status(400).json({
                    error: "Debe proporcionar texto para buscar",
                });
            }

            const fields = fieldsParam
                ? fieldsParam.split("|").map((f) => f.trim())
                : ["title", "content", "description"];

            const result = await feedRepository.search(query, fields);

            res.json({
                data: result,
            });
        } catch (error) {
            console.error("Error buscando noticias:", error);
            res.status(500).json({
                error: "Error buscando noticias",
            });
        }
    },
);

app.get(
    "/api/articles/:id",
    cache(300),
    httpCache(300),
    async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    error: "ID inválido",
                });
            }

            const article = await feedRepository.getById(id);

            if (!article) {
                return res.status(404).json({
                    error: "Artículo no encontrado",
                });
            }

            res.json(article);
        } catch (error) {
            console.error("Error obteniendo artículo:", error);
            res.status(500).json({
                error: "Error obteniendo artículo",
            });
        }
    },
);

app.get("/api/articles", noHttpCache(), async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 100;
        const order = (req.query.order as string) || "desc";
        const by = (req.query.by as string) || "date";
        const filters: Record<string, any> = {
            category: req.query.category,
        };

        const result = await feedRepository.list(
            {
                page,
                size,
                order,
                orderBy: by,
            },
            filters,
        );

        res.json({
            data: result.items,
        });
    } catch (error) {
        console.error("Error obteniendo noticias:", error);
        res.status(500).json({
            error: "Error obteniendo noticias",
        });
    }
});

app.get(
    "/api/categories",
    noHttpCache(),
    async (req: Request, res: Response) => {
        console.log("Obteniendo categorías...");
        try {
            const categories = await feedRepository.listCategories();
            res.json({
                data: categories,
            });
        } catch (error) {
            console.error("Error obteniendo categorías:", error);
            res.status(500).json({
                error: "Error obteniendo categorías",
            });
        }
    },
);

const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
server.keepAliveTimeout = 65000; // 65 segundos para mantener la conexión viva
server.headersTimeout = 70000; // 70 segundos para esperar los encabezados
export default app;
