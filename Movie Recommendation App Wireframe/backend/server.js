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

// Reemplaza el cors anterior por este:
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Esto asegura que la petición "preflight" de la imagen (status 204) responda con éxito automático
//app.options('*', cors()); 

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
   LOGIN (BASE DE DATOS PURA)
===================== */
app.post("/login", async (req, res) => {
    const { correo, password } = req.body;

    try {
        // Buscamos en la base de datos (va a encontrar al admin o a un usuario común)
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

        // Bcrypt verificará la clave tanto para admin como para usuarios
        const valido = await bcrypt.compare(password, usuario.password_hash);

        if (!valido) {
            return res.status(401).json({
                success: false,
                message: "Contraseña incorrecta"
            });
        }

        // Devolvemos el ROL REAL guardado en la columna de SQLite ('admin' o 'user')
        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nombre_usuario: usuario.nombre_usuario,
                correo: usuario.correo,
                rol: usuario.rol // 👈 'admin' o 'user' directo de la BD
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});


// 📊 RUTA DE ESTADÍSTICAS PURA (SÓLO 2 MÉTRICAS)
app.get('/admin/stats', (req, res) => {
  try {
    // 1. Contar usuarios reales
    const userCountRow = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
    const totalUsuarios = userCountRow ? userCountRow.total : 0;

    // 2. Contar películas reales
    const movieCountRow = db.prepare('SELECT COUNT(*) AS total FROM peliculas').get();
    const totalPeliculas = movieCountRow ? movieCountRow.total : 0;

    // Enviamos solo las dos variables necesarias a React
    res.json({
      totalUsuarios,
      totalPeliculas
    });

  } catch (error) {
    console.error("Error al calcular estadísticas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 📸 RUTA PARA REGISTRAR QUE UN USUARIO USÓ LA CÁMARA
app.post('/camera/activate', (req, res) => {
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: "Falta el usuario_id" });
  }

  try {
    const stmt = db.prepare('INSERT INTO registro_camara (usuario_id) VALUES (?)');
    stmt.run(usuario_id);
    res.status(201).json({ message: "Uso de cámara registrado con éxito" });
  } catch (error) {
    console.error("Error al registrar cámara:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
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

// =========================================================================
// 🌟 ENDPOINTS ADAPTADOS PARA EL MÓDULO ADMINISTRADOR (BETTER-SQLITE3)
// =========================================================================

// 1. Agregar una nueva película
app.post('/movies', (req, res) => {
  try {
    const { title, genre, year, duration, director, description, image } = req.body;
    
    // Si el año viene vacío o roto, le asignamos 2026 de forma automática
    const numericYear = isNaN(Number(year)) || Number(year) === 0 ? 2026 : Number(year);
    const castDefault = "Varios"; 

    // Preparamos la consulta con los nombres reales de tu base de datos en español
    const stmt = db.prepare(`
      INSERT INTO peliculas (nombre, genero, anio, duracion, director, descripcion, imagen, promedio_estrellas, cast) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);
    
    // Ejecutamos la inserción en sqlite
    const info = stmt.run(title, genre, numericYear, duration, director, description, image, castDefault);
    
    // Le respondemos a React que todo salió excelente
    res.status(201).json({ 
      id: info.lastInsertRowid, 
      title, 
      genre, 
      year: numericYear, 
      duration, 
      director, 
      description, 
      image, 
      rating: 0 
    });
  } catch (err) {
    console.error("🔴 ERROR EN BASE DE DATOS:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Eliminar una película
app.delete('/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`DELETE FROM peliculas WHERE id = ?`);
    const info = stmt.run(id);
    
    res.json({ message: "Película eliminada correctamente", changes: info.changes });
  } catch (err) {
    console.error("Error en DELETE /movies:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Editar una película existente
app.put('/movies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, genre, year, duration, director, description, image } = req.body;
    
    const stmt = db.prepare(`
      UPDATE peliculas 
      SET nombre = ?, genero = ?, anio = ?, duracion = ?, director = ?, descripcion = ?, imagen = ? 
      WHERE id = ?
    `);
    
    stmt.run(title, genre, year, duration, director, description, image, id);
    
    res.json({ message: "Película actualizada correctamente" });
  } catch (err) {
    console.error("Error en PUT /movies:", err.message);
    res.status(500).json({ error: err.message });
  }
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