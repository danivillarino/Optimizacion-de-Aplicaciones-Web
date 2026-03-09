import "dotenv/config";
import express, { Request, Response } from "express";

import { FeedDao } from "./data/feed-dao";
import { FeedRepositoryAdapter } from "./data/feed-repository-adapter";
import { FeedService } from "./services/feed-service";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const feedDao = new FeedDao();
const feedRepository = new FeedRepositoryAdapter(feedDao);
const feedService = new FeedService(feedRepository);

app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Servidor RSS funcionando"
    });
});

app.post("/api/feeds", async (req: Request, res: Response) => {

    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({
                error: "Debe proporcionar una URL de RSS"
            });
        }
        await feedService.addFeedUrl(url);
        res.json({
            message: "RSS agregado correctamente",
            url
        });

    } catch (error) {
        res.status(500).json({
            error: "Error agregando RSS"
        });

    }

});

app.post("/api/articles/update", async (req: Request, res: Response) => {
    try {
        const result = await feedService.updateFeeds();
        
        if (result.errors.length > 0 && result.success.length === 0) {
            return res.sendStatus(500);
        }
        
        res.sendStatus(200);

    } catch (error) {
        res.sendStatus(500);

    }

});

app.get("/api/articles/search", async (req: Request, res: Response) => {
    try {
        const query = req.query.query as string;
        const fieldsParam = req.query.fields as string;

        if (!query) {
            return res.status(400).json({
                error: "Debe proporcionar texto para buscar"
            });
        }

        const fields = fieldsParam 
            ? fieldsParam.split("|").map(f => f.trim())
            : ["title", "content", "description"];

        const result = await feedRepository.search(query, fields);

        res.json({
            data: result
        });

    } catch (error) {
        res.status(500).json({
            error: "Error buscando noticias"
        });

    }

});

app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                error: "ID inválido"
            });
        }

        const article = await feedRepository.getById(id);

        if (!article) {
            return res.status(404).json({
                error: "Artículo no encontrado"
            });
        }

        res.json(article);

    } catch (error) {
        res.status(500).json({
            error: "Error obteniendo artículo"
        });

    }

});

app.get("/api/articles", async (req: Request, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 100;
        const order = (req.query.order as string) || "desc";
        const by = (req.query.by as string) || "date";

        const result = await feedRepository.list({
            page,
            size,
            order,
            orderBy: by
        });

        res.json({
            data: result.items
        });

    } catch (error) {
        res.status(500).json({
            error: "Error obteniendo noticias"
        });

    }

});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;