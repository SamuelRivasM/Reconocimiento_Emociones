import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Configurar rutas absolutas para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cambiamos la ruta fija por una ruta absoluta dinámica
const db = new Database(path.join(__dirname, "database.db"));

app.use(cors());
app.use(express.json());

// ... Todo el resto de tus endpoints (/register, /login, /movies, etc.) se quedan EXACTAMENTE IGUAL ...

/* =====================
   REGISTRO
===================== */

app.post("/register", async (req, res) => {

    const {
        nombre_usuario,
        correo,
        password
    } = req.body;

    try {

        const hash = await bcrypt.hash(password, 10);

        db.prepare(`
            INSERT INTO usuarios
            (
                nombre_usuario,
                correo,
                password_hash
            )
            VALUES (?,?,?)
        `).run(
            nombre_usuario,
            correo,
            hash
        );

        res.json({
            success: true,
            message: "Usuario registrado"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            error: error.message
        });

    }

});

/* =====================
   LOGIN
===================== */

app.post("/login", async (req, res) => {

    const {
        correo,
        password
    } = req.body;

    const usuario = db.prepare(`
        SELECT *
        FROM usuarios
        WHERE correo = ?
    `).get(correo);

    if (!usuario) {

        return res.status(401).json({
            success: false,
            message: "Usuario no encontrado"
        });

    }

    const valido = await bcrypt.compare(
        password,
        usuario.password_hash
    );

    if (!valido) {

        return res.status(401).json({
            success: false,
            message: "Contraseña incorrecta"
        });

    }

    res.json({
        success: true,
        usuario: {
            id: usuario.id,
            nombre_usuario: usuario.nombre_usuario,
            correo: usuario.correo
        }
    });

});

/* =====================
   OBTENER PELÍCULAS
===================== */

app.get("/movies", (req, res) => {

    const movies = db.prepare(`
        SELECT *
        FROM peliculas
    `).all();

    const formattedMovies = movies.map(movie => ({
        id: movie.id,
        title: movie.nombre,
        genre: movie.genero,
        rating: movie.promedio_estrellas,
        year: movie.anio,
        duration: movie.duracion,
        director: movie.director,
        cast: movie.cast ? movie.cast.split(",") : [],
        description: movie.descripcion,
        image: movie.imagen
    }));

    res.json(formattedMovies);

});

/* =====================
   DETALLE PELÍCULA
===================== */

app.get("/movies/:id", (req, res) => {

    const movie = db.prepare(`
        SELECT *
        FROM peliculas
        WHERE id = ?
    `).get(req.params.id);

    res.json(movie);

});

/* =====================
   RESEÑAS DE PELÍCULA
===================== */

app.get("/reviews/:peliculaId", (req, res) => {

    const reviews = db.prepare(`
        SELECT
            r.*,
            u.nombre_usuario
        FROM resenas r
        INNER JOIN usuarios u
        ON r.usuario_id = u.id
        WHERE pelicula_id = ?
        ORDER BY fecha DESC
    `).all(req.params.peliculaId);

    res.json(reviews);

});

/* =====================
   AGREGAR RESEÑA
===================== */

app.post("/reviews", (req, res) => {

    const {
        usuario_id,
        pelicula_id,
        estrellas,
        comentario
    } = req.body;

    db.prepare(`
        INSERT INTO resenas
        (
            usuario_id,
            pelicula_id,
            estrellas,
            comentario
        )
        VALUES (?,?,?,?)
    `).run(
        usuario_id,
        pelicula_id,
        estrellas,
        comentario
    );

    db.prepare(`
        UPDATE peliculas
        SET promedio_estrellas =
        (
            SELECT AVG(estrellas)
            FROM resenas
            WHERE pelicula_id = ?
        )
        WHERE id = ?
    `).run(
        pelicula_id,
        pelicula_id
    );

    res.json({
        success: true
    });

});

/* =====================
   AGREGAR PELÍCULA
===================== */

app.post("/movies", (req, res) => {

    const {
        nombre,
        genero,
        anio,
        duracion,
        director,
        cast,
        descripcion,
        imagen
    } = req.body;

    db.prepare(`
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
    `).run(
        nombre,
        genero,
        anio,
        duracion,
        director,
        cast,
        descripcion,
        imagen
    );

    res.json({
        success: true
    });

});

/* =====================
   SERVIDOR
===================== */

app.listen(3001, () => {

    console.log("Servidor iniciado en puerto 3001");

});