# Lector de RSS Feeds

API REST para leer y gestionar RSS feeds.

## Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Edita el archivo `.env` y configura tus credenciales de MySQL:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=feeds_db
```

3. **Crear la base de datos:**

Ejecuta el script SQL en tu servidor MySQL:
```bash
mysql -u root -p < database.sql
```

O desde MySQL:
```sql
source database.sql;
```

4. **Compilar el proyecto:**
```bash
npm run build
```

## Ejecutar

**Modo desarrollo:**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Endpoints API

### 1. Agregar Feed RSS
```
POST /api/feeds
Content-Type: application/json

{
  "url": "https://example.com/feed.rss"
}
```

### 2. Actualizar Noticias
Descarga y guarda las noticias de todos los feeds configurados:
```
POST /api/articles/update
```

### 3. Obtener Artículo por ID
```
GET /api/articles/{id}
```

Respuesta:
```json
{
  "id": 3,
  "guid": "unique-id",
  "title": "Example",
  "url": "example.com",
  "image": "uri.com",
  "description": "example",
  "content": "example",
  "date": "2024-03-08T00:00:00.000Z",
  "categories": ["first", "second"]
}
```

### 4. Listar Artículos (con ordenamiento)
```
GET /api/articles?order=asc|desc&by=title|date|description
```

Parámetros opcionales:
- `order`: `asc` o `desc` (default: `desc`)
- `by`: campo por el que ordenar: `title`, `date`, o `description` (default: `date`)
- `page`: número de página (default: 1)
- `size`: artículos por página (default: 100)

Respuesta:
```json
{
  "data": [
    {
      "id": 3,
      "title": "Example",
      "url": "example.com",
      "image": "uri.com",
      "description": "example",
      "content": "example",
      "date": "2024-03-08T00:00:00.000Z",
      "categories": ["first", "second"]
    }
  ]
}
```

### 5. Buscar Artículos
```
GET /api/articles/search?query=texto&fields=title|date|description
```

Parámetros:
- `query`: texto a buscar (requerido)
- `fields`: campos en los que buscar, separados por `|` (opcional, default: `title|content|description`)

Respuesta:
```json
{
  "data": [
    {
      "id": 3,
      "title": "Example",
      "url": "example.com",
      "image": "uri.com",
      "description": "example",
      "content": "example",
      "date": "2024-03-08T00:00:00.000Z",
      "categories": ["first", "second"]
    }
  ]
}
```

## Ejemplo de Uso

1. **Agregar un feed RSS:**
```bash
curl -X POST http://localhost:3000/api/feeds \
  -H "Content-Type: application/json" \
  -d '{"url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"}'
```

2. **Actualizar noticias:**
```bash
curl -X POST http://localhost:3000/api/articles/update
```

3. **Listar todas las noticias ordenadas por fecha (más recientes primero):**
```bash
curl http://localhost:3000/api/articles?order=desc&by=date
```

4. **Buscar noticias que contengan "technology":**
```bash
curl "http://localhost:3000/api/articles/search?query=technology&fields=title|description"
```

5. **Obtener un artículo específico:**
```bash
curl http://localhost:3000/api/articles/1
```
