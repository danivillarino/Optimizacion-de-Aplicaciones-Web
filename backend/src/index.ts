import express, { Request, Response } from "express";

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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
