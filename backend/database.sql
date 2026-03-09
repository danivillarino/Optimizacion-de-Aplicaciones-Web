-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS feeds_db /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE feeds_db;

-- Crear tabla de feeds
CREATE TABLE IF NOT EXISTS feed (
  id int NOT NULL AUTO_INCREMENT,
  guid varchar(255) NOT NULL,
  title varchar(255) DEFAULT NULL,
  url longtext,
  image longtext,
  description longtext,
  content longtext,
  date datetime DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY guid_UNIQUE (guid)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS feed_categories (
  id int NOT NULL AUTO_INCREMENT,
  feed_id int NOT NULL,
  category varchar(100) NOT NULL,
  PRIMARY KEY (id),
  KEY fk_feed_id (feed_id),
  CONSTRAINT fk_feed_id FOREIGN KEY (feed_id) REFERENCES feed (id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
