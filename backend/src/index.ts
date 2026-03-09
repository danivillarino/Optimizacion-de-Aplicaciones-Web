import "dotenv/config";
import express, { Request, Response } from "express";
import { testService } from "./services/test";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Servidor Express con TypeScript funcionando correctamente",
    });
});

app.get("/test", async (req: Request, res: Response) => {
    console.log("Received /test request with query:", req.query);
    const query = req.query.query as string;
    const fields = (req.query.fields as string)?.split(",") || [];
    try {
        const result = await testService.testFunction({ query, fields });
        res.json({ result });
    } catch (error) {
        console.error("Error in /test route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
