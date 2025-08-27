
-- ============================
-- Tabla garments
-- ============================

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS garments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    area TEXT NOT NULL,
    dama_cab TEXT NOT NULL,
    prenda TEXT NOT NULL,
    modelo TEXT NOT NULL,
    tela TEXT NOT NULL,
    color TEXT NOT NULL,
    talla TEXT NOT NULL,
    ficha_bordado TEXT NOT NULL,
    imagen_url TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS garments_pkey ON garments (id);
CREATE UNIQUE INDEX IF NOT EXISTS garments_codigo_unique ON garments (codigo);


-- ============================
-- Tabla users
-- ============================

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS users_pkey ON users (id);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username);
