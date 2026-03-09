import express, { Request, Response } from "express";
import { testService } from "./services/test";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "Servidor Express con TypeScript funcionando correctamente",
    });
});

app.get("/test", (req: Request, res: Response) => {
    console.log("Received /test request with query:", req.query);
    const query = req.query.query as string;
    const fields = (req.query.fields as string)?.split(",") || [];
    const result = testService.testFunction({ query, fields });
    res.json(result);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
