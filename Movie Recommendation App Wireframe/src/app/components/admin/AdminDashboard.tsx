import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: number;
  year: number;
  duration: string;
  director: string;
  description: string;
  image: string;
}

export default function AdminDashboard() {
  // --- ESTADOS DE DATOS ---
  const [peliculas, setPeliculas] = useState<Movie[]>([]);
  const [usuariosCount, setUsuariosCount] = useState(0);
  const [camaraCount, setCamaraCount] = useState(0);
  const [emocionMasDetectada, setEmocionMasDetectada] = useState("Cargando...");

  // --- ESTADOS DE FORMULARIOS ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  // Estado para las métricas del panel administrativo
  const [stats, setStats] = useState({
  totalUsuarios: 1,
  totalPeliculas: 0
});
  const [movieForm, setMovieForm] = useState({
    title: "", genre: "", year: 2026, duration: "", director: "", description: "", image: ""
  });



  // Efecto para cargar las estadísticas reales del servidor
  useEffect(() => {
    fetch("http://localhost:3001/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error cargando estadísticas:", err));
  }, [peliculas]); // Se recalculan si añades o eliminas películas

  // --- 1. CARGAR DATOS DEL BACKEND REAL ---
  useEffect(() => {
    // Traer películas del servidor real )
    fetch("http://localhost:3001/movies")
      .then(res => res.json())
      .then(data => setPeliculas(data))
      .catch(err => console.error("Error cargando películas:", err));

    // Simulación de métricas de usuarios/cámara (Se pueden conectar a endpoints si existen más adelante)
    setUsuariosCount(150); 
    setCamaraCount(42);
    setEmocionMasDetectada("Felicidad 😊");
  }, []);

  // --- 2. ACCIONES: ACCIONAR EL CRUD ---

  // Guardar (Crear o Editar)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const bodyData = {
      title: movieForm.title,
      genre: movieForm.genre,
      year: movieForm.year || 2026,
      duration: movieForm.duration,
      director: movieForm.director,
      description: movieForm.description,
      image: movieForm.image
    };

    if (editingMovie) {
      // EDITAR PELÍCULA EXISTENTE
      fetch(`http://localhost:3001/movies/${editingMovie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })
      .then(() => {
        // Recarga limpia desde el servidor para actualizar la vista
        return fetch("http://localhost:3001/movies");
      })
      .then(res => res.json())
      .then(data => {
        setPeliculas(data);
        cerrarFormulario();
      })
      .catch(err => console.error("Error al editar:", err));
    } else {
      // AGREGAR NUEVA PELÍCULA
      fetch("http://localhost:3001/movies", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      })
      .then(res => res.json())
      .then(() => {
        // 🔄 Forzamos a React a pedir la lista oficial convertida directamente desde el servidor
        return fetch("http://localhost:3001/movies");
      })
      .then(res => res.json())
      .then(data => {
        setPeliculas(data); // Actualiza la tabla con los nombres formateados correctamente
        cerrarFormulario();
      })
      .catch(err => console.error("Error al agregar:", err));
    }
  };

  // Eliminar Película
  const eliminarPelicula = (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar esta película?")) {
      fetch(`http://localhost:3001/movies/${id}`, { method: 'DELETE' })
        .then(() => {
          setPeliculas(peliculas.filter(p => p.id !== id));
        })
        .catch(err => console.error("Error al eliminar:", err));
    }
  };

  // Abrir formulario para editar
  const abrirEditar = (pelicula: Movie) => {
    setEditingMovie(pelicula);
    setMovieForm({
      title: pelicula.title,
      genre: pelicula.genre,
      year: pelicula.year,
      duration: pelicula.duration,
      director: pelicula.director,
      description: pelicula.description,
      image: pelicula.image
    });
    setIsFormOpen(true);
  };

  const cerrarFormulario = () => {
    setIsFormOpen(false);
    setEditingMovie(null);
    setMovieForm({ title: "", genre: "", year: 2026, duration: "", director: "", description: "", image: "" });
  };

  return (
  <div className="p-8 max-w-6xl mx-auto space-y-6 text-white min-h-screen">
    
    {/* SECCIÓN 1: DASHBOARD (MÉTRICAS) */}
    <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mt-8">
      <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
      <Button onClick={() => setIsFormOpen(true)} className="bg-red-600 hover:bg-red-700 font-bold">
        + Añadir Nueva Película
      </Button>
    </div>

    {/* Cambiado a md:grid-cols-2 para que se distribuya perfectamente en 2 columnas grandes */}
    <div className="grid gap-4 md:grid-cols-2">
      {/* Tarjeta 1: Total Usuarios */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Total Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">👤 {stats.totalUsuarios}</div>
        </CardContent>
      </Card>

      {/* Tarjeta 2: Películas en Catálogo */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-zinc-400">Películas en Catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-400">🎬 {stats.totalPeliculas}</div>
        </CardContent>
      </Card>
    </div>

      {/* RECUADRO EMERGENTE: FORMULARIO (CREAR / EDITAR) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="bg-zinc-900 border-zinc-800 text-white w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">{editingMovie ? 'Editar Película' : 'Añadir Película'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder="Título" value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              <Input placeholder="Género" value={movieForm.genre} onChange={e => setMovieForm({...movieForm, genre: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              <div className="flex gap-2">
                <Input type="number" placeholder="Año" value={movieForm.year || ''} onChange={e => setMovieForm({...movieForm, year: e.target.value ? parseInt(e.target.value) : 0})} required className="bg-zinc-800 border-zinc-700" />
                <Input placeholder="Duración (ej: 120 min)" value={movieForm.duration} onChange={e => setMovieForm({...movieForm, duration: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              </div>
              <Input placeholder="Director" value={movieForm.director} onChange={e => setMovieForm({...movieForm, director: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              <Input placeholder="URL completa de la imagen (ej: https://...)" value={movieForm.image} onChange={e => setMovieForm({...movieForm, image: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              <Textarea placeholder="Descripción" value={movieForm.description} onChange={e => setMovieForm({...movieForm, description: e.target.value})} required className="bg-zinc-800 border-zinc-700" />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={cerrarFormulario} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SECCIÓN 2: GESTIÓN DE PELÍCULAS (TABLA CRUDS) */}
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader><CardTitle>Inventario de Películas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="border-zinc-800">
              <TableRow>
                <TableHead className="text-zinc-400">Título</TableHead>
                <TableHead className="text-zinc-400">Género</TableHead>
                <TableHead className="text-zinc-400">Año</TableHead>
                <TableHead className="text-right text-zinc-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peliculas.map((pelicula) => (
                <TableRow key={pelicula.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-medium">{pelicula.title}</TableCell>
                  <TableCell>{pelicula.genre}</TableCell>
                  <TableCell>{pelicula.year}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(pelicula)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => eliminarPelicula(pelicula.id)}>
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}