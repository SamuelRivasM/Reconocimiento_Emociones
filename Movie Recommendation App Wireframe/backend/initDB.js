import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "database.db");

// Forzar limpieza borrando el archivo de base de datos anterior si existe para evitar duplicados residuales
if (fs.existsSync(dbPath)) {
    try {
        fs.unlinkSync(dbPath);
        console.log("Base de datos antigua eliminada para limpieza total.");
    } catch (err) {
        console.log("No se pudo eliminar el archivo físico, limpiando tablas internamente.");
    }
}

const db = new Database(dbPath);

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

const peliculasSemilla = [
    ["Oppenheimer", "Drama", 2023, "3h 00min", "Christopher Nolan", "Cillian Murphy, Emily Blunt", "El físico J. Robert Oppenheimer lidera el Proyecto Manhattan.", "https://images.themoviedb.org/t/p/w500/8GxF06GvjgYwIV6zoG67w8i6e4n.jpg"],
    ["Interstellar", "Ciencia Ficción", 2014, "2h 49min", "Christopher Nolan", "Matthew McConaughey, Anne Hathaway", "Un grupo de científicos viaja a través de un agujero de gusano.", "https://images.themoviedb.org/t/p/w500/gEU2vYmBGaZMw3m6Yg7j3rtvYwB.jpg"],
    ["Duna: Parte Dos", "Ciencia Ficción", 2024, "2h 46min", "Denis Villeneuve", "Timothée Chalamet, Zendaya", "Paul Atreides se une a los Fremen para vengarse de los conspiradores.", "https://images.themoviedb.org/t/p/w500/66Un699wS294fTAtw6Sknm88f3v.jpg"],
    ["Mad Max: Furia en el Camino", "Acción", 2015, "2h 00min", "George Miller", "Tom Hardy, Charlize Theron", "En un desierto postapocalíptico, una mujer se rebela contra un tirano.", "https://images.themoviedb.org/t/p/w500/87hT6b7CxU68RLZ6uU368U68ZzY.jpg"],
    ["El Conjuro", "Terror", 2013, "1h 52min", "James Wan", "Vera Farmiga, Patrick Wilson", "Investigadores paranormales ayudan a una familia aterrorizada por una presencia oscura.", "https://images.themoviedb.org/t/p/w500/zS78QeU75Ue4E6h7W2Oq2Ue8Y7m.jpg"],
    ["Batman: El Caballero de la Noche", "Acción", 2008, "2h 32min", "Christopher Nolan", "Christian Bale, Heath Ledger", "Batman se enfrenta al Joker en una guerra psicológica por el control de Gotham.", "https://images.themoviedb.org/t/p/w500/qJ2tWGBp3ue6SVcm6Hq9K39ZwMg.jpg"],
    ["Pulp Fiction", "Drama", 1994, "2h 34min", "Quentin Tarantino", "John Travolta, Uma Thurman", "Las vidas de dos asesinos a sueldo, un boxeador y una actriz se cruzan.", "https://images.themoviedb.org/t/p/w500/d5iIlfHmw9g0jSI77HWwYUpVk75.jpg"],
    ["El Origen", "Ciencia Ficción", 2010, "2h 28min", "Christopher Nolan", "Leonardo DiCaprio, Elliot Page", "Un ladrón que roba secretos a través del subconsciente intenta implantar una idea.", "https://images.themoviedb.org/t/p/w500/edv5CZvXj6Yvavv8I6w28Xw917Z.jpg"],
    ["Gladiador", "Acción", 2000, "2h 35min", "Ridley Scott", "Russell Crowe, Joaquin Phoenix", "Un general romano traicionado regresa como gladiador para buscar venganza.", "https://images.themoviedb.org/t/p/w500/ty8T6aypU86g9vufp86gUu66M9p.jpg"],
    ["La La Land", "Romance", 2016, "2h 08min", "Damien Chazelle", "Ryan Gosling, Emma Stone", "Un pianista de jazz y una aspirante a actriz se enamoran en Los Ángeles.", "https://images.themoviedb.org/t/p/w500/uDO8vM78XUv9w3O86w28XUv97Zp.jpg"],
    ["Hereditary", "Terror", 2018, "2h 07min", "Ari Aster", "Toni Collette, Alex Wolff", "Una familia comienza a desmoronarse tras la muerte de la abuela reclusiva.", "https://images.themoviedb.org/t/p/w500/o79wS283WvU9w8OuZ6U28wWv98p.jpg"],
    ["Perdida", "Suspenso", 2014, "2h 29min", "David Fincher", "Ben Affleck, Rosamund Pike", "Un hombre se convierte en el sospechoso principal tras la desaparición de su esposa.", "https://images.themoviedb.org/t/p/w500/qy8T6aypU86g9vufp86gUu66M9p.jpg"],
    ["Cuestión de Tiempo", "Romance", 2013, "2h 03min", "Richard Curtis", "Domhnall Gleason, Rachel McAdams", "Un joven descubre que puede viajar en el tiempo e intenta mejorar su vida amorosa.", "https://images.themoviedb.org/t/p/w500/i8O3vYm9Z6Yvavv8I6w28Xw917Z.jpg"],
    ["Isla Siniestra", "Suspenso", 2010, "2h 18min", "Martin Scorsese", "Leonardo DiCaprio, Mark Ruffalo", "Dos agentes investigan la desaparición de una asesina en un hospital psiquiátrico.", "https://images.themoviedb.org/t/p/w500/edv5CZvXj6Yvavv8I6w28Xw917Z.jpg"],
    ["Un Lugar en Silencio", "Terror", 2018, "1h 30min", "John Krasinski", "Emily Blunt, John Krasinski", "Una familia debe vivir en silencio para evadir a criaturas que cazan por el sonido.", "https://images.themoviedb.org/t/p/w500/66Un699wS294fTAtw6Sknm88f3v.jpg"],
    ["Parasite", "Drama", 2019, "2h 12min", "Bong Joon Ho", "Song Kang-ho, Lee Sun-kyun", "Una familia de bajos recursos se infiltra astutamente en una casa adinerada.", "https://images.themoviedb.org/t/p/w500/7IiTT0wXvI6w28Xw917Zavv8I6w.jpg"],
    ["John Wick 4", "Acción", 2023, "2h 49min", "Chad Stahelski", "Keanu Reeves, Donnie Yen", "John Wick encuentra un camino para derrotar a la Alta Mesa.", "https://images.themoviedb.org/t/p/w500/8GxF06GvjgYwIV6zoG67w8i6e4n.jpg"],
    ["Efecto Mariposa", "Suspenso", 2004, "1h 53min", "Eric Bress", "Ashton Kutcher, Amy Smart", "Un joven viaja a su pasado para cambiar eventos, alterando gravemente su presente.", "https://images.themoviedb.org/t/p/w500/zS78QeU75Ue4E6h7W2Oq2Ue8Y7m.jpg"],
    ["Orgullo y Prejuicio", "Romance", 2005, "2h 09min", "Joe Wright", "Keira Knightley, Matthew Macfadyen", "Las complicaciones del amor y las clases sociales en la Inglaterra del siglo XIX.", "https://images.themoviedb.org/t/p/w500/uDO8vM78XUv9w3O86w28XUv97Zp.jpg"],
    ["Whiplash", "Drama", 2014, "1h 46min", "Damien Chazelle", "Miles Teller, J.K. Simmons", "Un joven baterista de jazz es llevado al límite por un instructor despiadado.", "https://images.themoviedb.org/t/p/w500/o79wS283WvU9w8OuZ6U28wWv98p.jpg"]
];

const insertMovie = db.prepare(`
INSERT INTO peliculas (nombre, genero, anio, duracion, director, cast, descripcion, imagen)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of peliculasSemilla) {
    insertMovie.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
}

console.log("¡Éxito! Base de datos reiniciada con 20 películas reales únicas.");
db.close();