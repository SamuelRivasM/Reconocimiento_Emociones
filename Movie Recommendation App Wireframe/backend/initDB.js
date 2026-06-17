import Database from "better-sqlite3";

const db = new Database("./backend/database.db");

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_usuario TEXT UNIQUE NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS peliculas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    genero TEXT,
    anio INTEGER,
    duracion TEXT,
    director TEXT,
    cast TEXT,
    descripcion TEXT,
    imagen TEXT,
    promedio_estrellas REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resenas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    pelicula_id INTEGER,
    estrellas INTEGER CHECK(estrellas BETWEEN 1 AND 5),
    comentario TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(pelicula_id) REFERENCES peliculas(id)
);
`);

const count = db.prepare(`
SELECT COUNT(*) as total
FROM peliculas
`).get();

if (count.total === 0) {

    const insertMovie = db.prepare(`
    INSERT INTO peliculas
    (
        nombre,
        genero,
        anio,
        duracion,
        director,
        cast,
        descripcion,
        imagen
    )
    VALUES (?,?,?,?,?,?,?,?)
    `);

    insertMovie.run(
        "Noches de Neón",
        "Ciencia Ficción",
        2025,
        "2h 18min",
        "Sofia Chen",
        "Alex Rivera, Maya Patel, James Park",
        "En un futuro distópico...",
        "/pelis/NocheNeon.jpg"
    );

    insertMovie.run(
        "Oppenheimer",
        "Drama",
        2023,
        "3h",
        "Christopher Nolan",
        "Cillian Murphy",
        "Proyecto Manhattan.",
        "/pelis/oppenheimer.jpg"
    );

    console.log("Películas insertadas");
}

console.log("Base de datos creada correctamente");

db.close();