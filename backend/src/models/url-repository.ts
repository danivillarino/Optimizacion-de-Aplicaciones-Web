import path from "path";

const urlJsonPath = path.join(__dirname, "../data/url-list.json");

export class UrlRepository {
    private cachedUrls: string[] = [];

    constructor() {
        this.loadUrls();
    }

    private loadUrls(): void {
        try {
            const data = require(urlJsonPath);
            if (Array.isArray(data)) {
                this.cachedUrls = data;
            } else {
                console.warn(
                    "El archivo url-list.json no contiene un array válido.",
                );
            }
        } catch (error) {
            console.error("Error al cargar url-list.json:", error);
        }
    }

    getUrls(): string[] {
        return this.cachedUrls;
    }

    addUrl(url: string): void {
        if (!this.cachedUrls.includes(url)) {
            this.cachedUrls.push(url);
            this.saveUrls();
        }
    }

    private saveUrls(): void {
        const fs = require("fs");
        fs.writeFile(
            urlJsonPath,
            JSON.stringify(this.cachedUrls, null, 2),
            (err: any) => {
                if (err) {
                    console.error("Error al guardar url-list.json:", err);
                }
            },
        );
    }
}
