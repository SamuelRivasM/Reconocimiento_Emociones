import { Search, Star, Play, Plus, X, Check, User, LogOut, Calendar, Clock, Users, Send, Edit2, Lock, Trash2, Mail, Camera, CameraOff, Smile, Frown, Meh, Angry, AlertCircle, Zap, Eye, Shield, BarChart3, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AdminDashboard from './components/admin/AdminDashboard';


interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: number;
  year: number;
  duration: string;
  director: string;
  cast: string[];
  description: string;
  image: string;
}

interface Review {
  id: number;
  usuario_id: number;
  pelicula_id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  joinDate: string;
  emotionAnalysisEnabled: boolean;
}

interface Emotion {
  type: 'feliz' | 'triste' | 'sorprendido' | 'asustado' | 'enojado' | 'neutral' | 'emocionado';
  timestamp: number;
  intensity: number;
}

interface EmotionalSession {
  movieId: number;
  movieTitle: string;
  emotions: Emotion[];
  duration: number;
  startTime: string;
}

interface EmotionalSummary {
  predominantEmotion: string;
  emotionPercentages: { [key: string]: number };
  satisfactionLevel: number;
  mostImpactfulScenes: { timestamp: number; emotion: string }[];
  recommendedGenres: string[];
}

export default function App() {
  const [appState, setAppState] = useState<'landing' | 'auth-login' | 'auth-register' | 'app' | 'admin'>('landing');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [currentView, setCurrentView] = useState<'explore' | 'mylist' | 'profile' | 'photo'>('explore');
  const [photoStep, setPhotoStep] = useState<'intro' | 'capture'>('intro');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null);
  const [photoRecommendations, setPhotoRecommendations] = useState<Movie[]>([]);
  const [manualRecommendations, setManualRecommendations] = useState<Movie[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [myList, setMyList] = useState<number[]>([]);
  const [user, setUser] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [editProfileForm, setEditProfileForm] = useState({ name: '', email: '' });
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [showMovieForm, setShowMovieForm] = useState(false);
  const [movieForm, setMovieForm] = useState({ nombre: "", genero: "", anio: "", duracion: "", director: "", cast: "", descripcion: "", imagen: "" });
  const [allEmotionsData, setAllEmotionsData] = useState<{ [key: string]: number } | null>(null);

  // Emotion Detection State
  const [showEmotionConsent, setShowEmotionConsent] = useState(false);
  const [emotionAnalysisActive, setEmotionAnalysisActive] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [emotionalSessions, setEmotionalSessions] = useState<EmotionalSession[]>([]);
  const [activeSession, setActiveSession] = useState<EmotionalSession | null>(null);
  const [showEmotionalSummary, setShowEmotionalSummary] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<EmotionalSummary | null>(null);
  const [watchingMovie, setWatchingMovie] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const sessionStartTimeRef = useRef<number>(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);


  // 🎬 1. CARGAR PELÍCULAS DESDE EL BACKEND
  useEffect(() => {
    fetch("http://localhost:3001/movies")
      .then(res => res.json())
      .then(data => {
        const peliculas: Movie[] = data.map((m: any) => ({
          id: m.id,
          title: m.title,
          genre: m.genre,
          rating: m.rating || 0,
          year: m.year,
          duration: m.duration,
          director: m.director,
          cast: m.cast || [],
          description: m.description,
          image: m.image
        }));

        const uniqueLocalMovies = Array.from(new Map(peliculas.map((m: Movie) => [m.title.toLowerCase(), m])).values()) as Movie[];

        console.log("PELICULAS CARGADAS:", uniqueLocalMovies);
        setMovies(uniqueLocalMovies);
        setRecommendations(uniqueLocalMovies.slice(0, 4));
      })
      .catch(err => console.error(err));
  }, []);

  // 🛡️ 2. CONTROL DE PERSISTENCIA INTELIGENTE (FIX F5 PARA EL ADMIN Y USUARIO)
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (usuarioGuardado) {
      try {
        const profile = JSON.parse(usuarioGuardado);

        setUser(profile.name);
        setUserProfile(profile);

        setEditProfileForm({
          name: profile.name,
          email: profile.email
        });

        // 🔀 Aquí decidimos a dónde va según su correo real
        if (profile.email === "admin@movieflix.com") {
          setAppState("admin"); // ¡Se queda bloqueado en el panel elegante!
        } else {
          setAppState("app");   // Va al catálogo si es usuario común
        }

      } catch (error) {
        console.error("Error al procesar la sesión guardada:", error);
      }
    }
  }, []);
  





  const allMovies = [...movies, ...recommendations];

  const categories = ['Todas', 'Acción', 'Drama', 'Ciencia Ficción', 'Romance', 'Suspenso', 'Terror'];

  const filteredMovies =
    selectedCategory === 'Todas'
      ? movies
      : movies.filter(movie => movie.genre === selectedCategory);

  const filteredRecommendations = selectedCategory === 'Todas'
    ? recommendations
    : recommendations.filter(movie => movie.genre === selectedCategory);

  const myListMovies = allMovies
  .filter(movie => myList.includes(movie.id))
  .filter((movie, index, self) => 
    self.findIndex(m => m.id === movie.id) === index
  ); {/*aquí cambié el duplicado de peliculas en mi lista*/}

  const toggleMyList = (movieId: number) => {
    setMyList(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {

      const res = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          correo: loginForm.email,
          password: loginForm.password
        })
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      const profile: UserProfile = {
        id: data.usuario.id,
        name: data.usuario.nombre_usuario,
        email: data.usuario.correo,
        joinDate: new Date().toISOString().split("T")[0],
        emotionAnalysisEnabled: false
      };
      setUser(profile.name);
      setUserProfile(profile);

      localStorage.setItem(
        "usuario",
        JSON.stringify(profile)
      );
      setEditProfileForm({
        name: profile.name,
        email: profile.email
      });
      setLoginForm({
        email: "",
        password: ""
      });

      // 🔀 REDIRECCIÓN INTELIGENTE POR ROL DESDE LA BD
      if (data.usuario.rol === "admin") {
        setAppState("admin"); // 📊 Si es admin, directo al módulo de administración
      } else {
        setAppState("app");   // 🎬 Si es usuario normal, al catálogo principal
      }

    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión");
    }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {

      const res = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre_usuario: registerForm.name,
          correo: registerForm.email,
          password: registerForm.password
        })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || data.message);
        return;
      }

      alert("Usuario registrado correctamente");

      setRegisterForm({
        name: "",
        email: "",
        password: ""
      });

      setAppState("auth-login");

    } catch (error) {
      console.error(error);
      alert("Error al registrar usuario");
    }
  };

  const handleLogout = () => {

    localStorage.removeItem("usuario");

    setUser(null);
    setUserProfile(null);
    setMyList([]);
    setCurrentView("explore");
    setAppState("landing");

  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (userProfile && editProfileForm.name && editProfileForm.email) {
      const updatedProfile: UserProfile = {
        ...userProfile,
        name: editProfileForm.name,
        email: editProfileForm.email
      };
      setUserProfile(updatedProfile);
      setUser(updatedProfile.name);
      setEditingProfile(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    alert("Función pendiente de conectar con la base de datos");

    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    setChangingPassword(false);
  };

  // const handleChangePassword = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (userProfile && changePasswordForm.currentPassword === userProfile.password) {
  //     if (changePasswordForm.newPassword === changePasswordForm.confirmPassword) {
  //       const updatedProfile: UserProfile = {
  //         ...userProfile,
  //         password: changePasswordForm.newPassword
  //       };
  //       setUserProfile(updatedProfile);
  //       setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  //       setChangingPassword(false);
  //       alert('Contraseña actualizada exitosamente');
  //     } else {
  //       alert('Las contraseñas nuevas no coinciden');
  //     }
  //   } else {
  //     alert('Contraseña actual incorrecta');
  //   }
  // };

  const handleDeleteAccount = () => {
    setUser(null);
    setUserProfile(null);
    setMyList([]);
    setReviews(reviews.filter(review => review.userName !== user));
    setCurrentView('explore');
    setAppState('landing');
    setShowDeleteConfirm(false);
  };

  // Emotion Detection Functions
  const emotionTypes: Emotion['type'][] = ['feliz', 'triste', 'sorprendido', 'asustado', 'enojado', 'neutral', 'emocionado'];

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy': case 'feliz': return '😊 :D Happy';
      case 'sad': case 'triste': return '😢 D: Sad';
      case 'surprise': case 'sorprendido': return '😲 :O Surprised';
      case 'fear': case 'asustado': return '😨 D:> Fearful';
      case 'angry': case 'enojado': return '😠 >:V Angry';
      case 'emocionado': return '🤩';
      case 'disgust': return '🤮 UGH Disgusted';
      default: return '😐 -_- Neutral';
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy': case 'feliz': return 'bg-emerald-500';     // Verde brillante
      case 'sad': case 'triste': return 'bg-blue-600';          // Azul
      case 'angry': case 'enojado': return 'bg-red-600';        // Rojo
      case 'fear': case 'asustado': return 'bg-purple-600';     // Púrpura
      case 'surprise': case 'sorprendido': return 'bg-cyan-500';// Cyan
      case 'disgust': return 'bg-green-800';                    // Verde oscuro
      default: return 'bg-zinc-500';                            // Gris Neutral
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Simulated camera permission (in real app, use navigator.mediaDevices.getUserMedia)
      setCameraPermissionGranted(true);
      if (userProfile) {
        setUserProfile({ ...userProfile, emotionAnalysisEnabled: true });
      }
      setShowEmotionConsent(false);
      return true;
    } catch (error) {
      alert('No se pudo acceder a la cámara');
      return false;
    }
  };

  const startEmotionDetection = (movie: Movie) => {
    if (!cameraPermissionGranted || !userProfile?.emotionAnalysisEnabled) {
      setShowEmotionConsent(true);
      return;
    }

    const session: EmotionalSession = {
      movieId: movie.id,
      movieTitle: movie.title,
      emotions: [],
      duration: 0,
      startTime: new Date().toISOString()
    };

    setActiveSession(session);
    setEmotionAnalysisActive(true);
    setWatchingMovie(true);
    sessionStartTimeRef.current = Date.now();
  };

  const stopEmotionDetection = () => {
    if (activeSession) {
      const finalSession = {
        ...activeSession,
        duration: Date.now() - sessionStartTimeRef.current
      };
      setEmotionalSessions([...emotionalSessions, finalSession]);
      generateEmotionalSummary(finalSession);
    }
    setEmotionAnalysisActive(false);
    setWatchingMovie(false);
    setActiveSession(null);
  };

  const generateEmotionalSummary = (session: EmotionalSession) => {
    if (session.emotions.length === 0) return;

    // Calculate emotion percentages
    const emotionCounts: { [key: string]: number } = {};
    session.emotions.forEach(e => {
      emotionCounts[e.type] = (emotionCounts[e.type] || 0) + 1;
    });

    const total = session.emotions.length;
    const emotionPercentages: { [key: string]: number } = {};
    Object.keys(emotionCounts).forEach(key => {
      emotionPercentages[key] = Math.round((emotionCounts[key] / total) * 100);
    });

    // Find predominant emotion
    const predominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // Calculate satisfaction (based on positive emotions)
    const positiveEmotions = ['feliz', 'emocionado', 'sorprendido'];
    const positiveCount = session.emotions.filter(e => positiveEmotions.includes(e.type)).length;
    const satisfactionLevel = Math.round((positiveCount / total) * 100);

    // Find most impactful scenes (high intensity emotions)
    const mostImpactfulScenes = session.emotions
      .filter(e => e.intensity > 0.7)
      .slice(0, 5)
      .map(e => ({ timestamp: e.timestamp, emotion: e.type }));

    // Generate recommendations based on emotions
    const recommendedGenres: string[] = [];
    if (emotionPercentages['feliz'] > 30) recommendedGenres.push('Comedia');
    if (emotionPercentages['asustado'] > 20) recommendedGenres.push('Terror', 'Suspenso');
    if (emotionPercentages['triste'] > 25) recommendedGenres.push('Drama');
    if (emotionPercentages['emocionado'] > 30) recommendedGenres.push('Acción');
    if (emotionPercentages['sorprendido'] > 25) recommendedGenres.push('Ciencia Ficción', 'Misterio');

    const summary: EmotionalSummary = {
      predominantEmotion,
      emotionPercentages,
      satisfactionLevel,
      mostImpactfulScenes,
      recommendedGenres: recommendedGenres.length > 0 ? recommendedGenres : ['Drama', 'Comedia']
    };

    setCurrentSummary(summary);
    setShowEmotionalSummary(true);
  };

  // Stop camera stream when leaving photo view
  useEffect(() => {
    if (currentView !== 'photo') {
      stopPhotoCamera();
    }
  }, [currentView]);

  // Simulate emotion detection (in real app, this would use face-api.js or similar)
  useEffect(() => {
    if (!emotionAnalysisActive || !activeSession) return;

    const interval = setInterval(() => {
      const randomEmotion: Emotion = {
        type: emotionTypes[Math.floor(Math.random() * emotionTypes.length)],
        timestamp: playbackProgress,
        intensity: Math.random()
      };

      setCurrentEmotion(randomEmotion);
      setActiveSession({
        ...activeSession,
        emotions: [...activeSession.emotions, randomEmotion]
      });

      // Simulate playback progress
      setPlaybackProgress(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [emotionAnalysisActive, activeSession, playbackProgress]);

  const activatePhotoCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Forzamos al navegador a escuchar el flujo antes de reproducir
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => console.log("Webcam reproduciendo en vivo."))
            .catch(err => console.error("El navegador bloqueó el play automático:", err));
        };
      }
      setCameraActive(true);
      setCapturedPhoto(null);
      setDetectedEmotion(null);
    } catch (error) {
      console.error("Error detallado de cámara:", error);
      alert('No se pudo acceder a la cámara. Revisa que ninguna otra aplicación (como Zoom, Teams o el script prueba.py) la esté reteniendo.');
    }
  };

  const stopPhotoCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 1. Dibujar el frame actual de la webcam en el canvas oculto
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. Convertir la captura a formato Base64 para enviarlo por red
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedPhoto(dataUrl);
    stopPhotoCamera();

    try {
      // 3. Petición HTTP POST a tu API de Python en el puerto 5000
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // A) Guardamos los porcentajes para las barras del HUD lateral derecho
        setAllEmotionsData(data.all_emotions);

        // B) Traducimos la emoción dominante para el título principal
        const translationMap: { [key: string]: string } = {
          happy: 'feliz',
          sad: 'triste',
          angry: 'enojado',
          surprise: 'sorprendido',
          neutral: 'neutral',
          fear: 'asustado',
          disgust: 'desagrado'
        };
        const emotionInSpanish = translationMap[data.dominant_emotion] || 'neutral';
        setDetectedEmotion(emotionInSpanish);

        //  C) CONEXIÓN GLOBAL TMDB: Mapeamos asegurando que React entienda los datos de internet
        if (data.movies && data.movies.length > 0) {
          const parsedMovies = data.movies.map((m: any) => ({
            id: m.id,
            title: m.title || 'Sin Título',
            genre: m.genre || 'Recomendación Global',
            rating: m.rating || 0,
            year: parseInt(m.year) || 2026,
            duration: m.duration || '2h',
            director: m.director || 'Desconocido',
            cast: m.cast || [],
            description: m.description || '',
            image: m.image // Asegura la URL completa (https://image.tmdb.org/...) que armamos en Python
          }));
          setPhotoRecommendations(parsedMovies);
        } else {
          setPhotoRecommendations([]);
        }
        // Aquí borramos la línea de setFilteredMovies para eliminar el error rojo.

      } else {
        console.error("Error devuelto por la IA en Python:", data.error);
        setDetectedEmotion('neutral');
        setPhotoRecommendations([]);
      }
    } catch (error: any) {
      console.error("Error de comunicación de red:", error);
      alert("Error real devuelto: " + error.message);
      setDetectedEmotion('neutral');
    }
  };

  const selectEmotionManually = (emotion: string) => {
    setDetectedEmotion(emotion);
    const emotionGenreMap: { [key: string]: string[] } = {
      feliz: ['Comedia', 'Romance'],
      triste: ['Drama', 'Romance'],
      enojado: ['Acción', 'Suspenso'],
      sorprendido: ['Ciencia Ficción', 'Suspenso'],
      neutral: ['Todas'],
      emocionado: ['Acción', 'Ciencia Ficción'],
      asustado: ['Terror', 'Suspenso'],
    };
    const genres = emotionGenreMap[emotion] || ['Todas'];

    // Filtramos del catálogo general (puedes usar allMovies o movies según cómo se llame tu estado local)
    const recs = (allMovies || movies || []).filter(m => genres.includes(m.genre) || genres.includes('Todas')).slice(0, 5);
    const finalRecs = recs.length > 0 ? recs : (allMovies || movies || []).slice(0, 5);

    // Mapeador estricto para homologar las variables locales a formato inglés
    const mappedManual = finalRecs.map((m: any) => ({
      id: m.id,
      title: m.title || m.nombre || 'Sin Título',
      year: m.year || m.anio || 2026,
      rating: m.rating || m.calificacion || 0,
      image: m.image || m.imagen || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400',
      description: m.description || m.descripcion || '',
      genre: m.genre || m.genero || 'Local',
      duration: m.duration || m.duracion || '2h',
      director: m.director || 'Desconocido',
      cast: m.cast || []
    }));

    // El truco está en poner "as Movie[]" aquí para eliminar el error rojo:
    setManualRecommendations(mappedManual as Movie[]);
    setPhotoRecommendations([]); // Limpiamos las de la foto para avisarle al render que estamos en modo manual
    setCapturedPhoto(null);
  };

  const handleAddReview = () => {
    if (newReview.comment.trim() && selectedMovie) {
      const review: Review = {
        id: reviews.length + 1,
        usuario_id: userProfile?.id || 0,
        pelicula_id: selectedMovie.id,
        userName: user || 'Usuario',
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split('T')[0]
      };
      setReviews([...reviews, review]);
      setNewReview({ rating: 5, comment: '' });
    }
  };

  const getMovieReviews = (peliculaId: number) => {
    return reviews.filter(
      review => review.pelicula_id === peliculaId
    );
  };

  const getAverageRating = (movieId: number) => {
    const movieReviews = getMovieReviews(movieId);
    if (movieReviews.length === 0) return 0;
    const sum = movieReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / movieReviews.length).toFixed(1);
  };

  useEffect(() => {

    const usuarioGuardado =
      localStorage.getItem("usuario");

    if (usuarioGuardado) {

      const profile =
        JSON.parse(usuarioGuardado);

      setUser(profile.name);
      setUserProfile(profile);

      setEditProfileForm({
        name: profile.name,
        email: profile.email
      });

      setAppState("app");
    }

  }, []);

  //pa poner pelis
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();

    try {

      const res = await fetch("http://localhost:3001/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(movieForm)
      });

      const data = await res.json();

      if (data.success) {

        alert("Película registrada");

        const moviesRes = await fetch("http://localhost:3001/movies");
        const moviesData = await moviesRes.json();

        setMovies(moviesData);

        setMovieForm({
          nombre: "",
          genero: "",
          anio: "",
          duracion: "",
          director: "",
          cast: "",
          descripcion: "",
          imagen: ""
        });

        setShowMovieForm(false);
      }

    } catch (error) {
      console.error(error);
      alert("Error al registrar película");
    }
  };


  // 🌟 PANEL DE ADMINISTRACIÓN (VISTA MEJORADA)
  // ==========================================
  if (appState === 'admin') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans antialiased overflow-auto">
        
        {/* NAVBAR DEL ADMINISTRADOR */}
        <nav className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* LOGO MOVIEFLIX */}
            <div className="text-2xl font-black tracking-tighter text-red-650 select-none">
              MOVIE<span className="text-white font-light">FLIX</span>
              <span className="ml-2 text-xs bg-red-600/15 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase tracking-widest">
                Admin
              </span>
            </div>
          </div>

          {/* ACCIONES DEL NAVBAR (BOTÓN SALIR) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // Limpiamos la sesión del admin al salir si lo deseas, o solo vuelve a la landing
                setUser(null);
                setUserProfile(null);
                localStorage.removeItem("usuario");
                setAppState('landing');
              }}
              className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 px-4 py-2 rounded-lg font-medium transition-all border border-zinc-700/50"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </nav>

        {/* CUERPO PRINCIPAL DEL PANEL */}
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* COLUMNA IZQUIERDA: APARTADO DE DATOS DEL ADMIN */}
          <aside className="lg:col-span-1">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 sticky top-24 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center pb-5 border-b border-zinc-800">
                {/* Avatar con inicial */}
                <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-amber-500 rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-red-950/40 mb-3 text-white">
                  A
                </div>
                <h3 className="font-bold text-lg text-zinc-100">Administrador</h3>
                <span className="text-xs text-red-400 font-semibold tracking-wider uppercase mt-1">
                  Soporte TI / Root
                </span>
              </div>

              {/* Datos detallados */}
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <label className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Correo Electrónico</label>
                  <p className="text-zinc-200 font-medium break-all mt-0.5">admin@movieflix.com</p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Nivel de Acceso</label>
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mt-0.5">
                    <Shield size={14} />
                    Control Total
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Base de Datos</label>
                  <p className="text-zinc-300 font-mono text-xs mt-1 bg-zinc-950 px-2 py-1.5 rounded border border-zinc-800/60">
                    SQLite (database.db)
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* COLUMNA DERECHA: DASHBOARD ORIGINAL */}
          <main className="lg:col-span-3 bg-zinc-900/30 border border-zinc-800/40 rounded-xl p-6 min-h-[60vh]">
            <div className="mb-6 pb-4 border-b border-zinc-800/60">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Panel de Control General</h1>
              <p className="text-sm text-zinc-400 mt-1">Métricas en tiempo real del sistema de recomendación.</p>
            </div>
            
            {/* Aquí se mantiene tu componente intacto con las dos estadísticas */}
            <AdminDashboard />
          </main>

        </div>
      </div>
    );
  }

  
  // Landing Page
  if (appState === 'landing') {
    return (
      <div className="size-full bg-zinc-950 text-white overflow-auto">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="px-4 py-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <h1 className="text-3xl font-bold text-red-500">MovieFlix</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setAppState('auth-login')}
                  className="px-6 py-2 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setAppState('auth-register')}
                  className="px-6 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  Crear Cuenta
                </button>
              </div>
            </div>
          </header>

          {/* Hero Content */}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-4xl text-center">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Películas ilimitadas, <span className="text-red-500">sin límites</span>
              </h2>
              <p className="text-xl md:text-2xl text-zinc-400 mb-8">
                Descubre miles de películas, crea tu lista personal y comparte tus reseñas con la comunidad
              </p>
              <button
                onClick={() => setAppState('auth-register')}
                className="px-8 py-4 bg-red-500 rounded-lg hover:bg-red-600 transition text-lg font-semibold"
              >
                Comenzar Gratis
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <h3 className="text-2xl font-bold mb-6">Vista Previa del Catálogo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.slice(0, 6).map((movie) => (
                <div
                  key={movie.id}
                  className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 opacity-70"
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    <img
                      src={movie.image}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <h4 className="text-sm font-semibold truncate">{movie.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-zinc-900 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">¿Por qué MovieFlix?</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Miles de Películas</h4>
                <p className="text-zinc-400">Acceso a un catálogo extenso con los mejores títulos</p>
              </div>
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Tu Lista Personal</h4>
                <p className="text-zinc-400">Guarda tus películas favoritas para verlas después</p>
              </div>
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold mb-2">Reseñas Comunitarias</h4>
                <p className="text-zinc-400">Comparte y lee opiniones de otros cinéfilos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Page
  if (appState === 'auth-login') {
    return (
      <div className="size-full bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-500 mb-2">MovieFlix</h1>
            <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
          </div>
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-zinc-400">Correo Electrónico</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-zinc-400">Contraseña</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Ingresar
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-400 mb-3">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setAppState('auth-register')}
                  className="text-red-500 hover:text-red-400 font-semibold"
                >
                  Regístrate aquí
                </button>
              </p>
              <button
                type="button"
                onClick={() => setAppState('landing')}
                className="text-sm text-zinc-500 hover:text-zinc-400"
              >
                ← Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Register Page
  if (appState === 'auth-register') {
    return (
      <div className="size-full bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-500 mb-2">MovieFlix</h1>
            <h2 className="text-2xl font-bold">Crear Cuenta</h2>
          </div>
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-zinc-400">Nombre</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-zinc-400">Correo Electrónico</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-zinc-400">Contraseña</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Crear Cuenta
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-400 mb-3">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setAppState('auth-login')}
                  className="text-red-500 hover:text-red-400 font-semibold"
                >
                  Inicia sesión
                </button>
              </p>
              <button
                type="button"
                onClick={() => setAppState('landing')}
                className="text-sm text-zinc-500 hover:text-zinc-400"
              >
                ← Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="size-full bg-zinc-950 text-white overflow-auto">
      {/* Emotion Consent Modal */}
      {showEmotionConsent && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-8 max-w-2xl w-full border border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-red-500 rounded-full p-3">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Análisis Emocional Inteligente</h2>
                <p className="text-zinc-400">Consentimiento y Privacidad</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-zinc-300">
                MovieFlix utiliza tecnología de reconocimiento facial para mejorar tu experiencia de visualización.
              </p>

              <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Camera className="w-5 h-5 text-red-500" />
                  ¿Qué detectamos?
                </h3>
                <ul className="text-sm text-zinc-400 space-y-2 ml-7">
                  <li>• Expresiones faciales durante la reproducción</li>
                  <li>• Emociones en tiempo real (felicidad, sorpresa, tristeza, etc.)</li>
                  <li>• Reacciones a escenas específicas</li>
                </ul>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-red-500" />
                  ¿Cómo usamos esta información?
                </h3>
                <ul className="text-sm text-zinc-400 space-y-2 ml-7">
                  <li>• Generar recomendaciones personalizadas</li>
                  <li>• Crear estadísticas de tu experiencia emocional</li>
                  <li>• Mejorar la selección de contenido</li>
                </ul>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-500" />
                  Tu privacidad está protegida
                </h3>
                <ul className="text-sm text-zinc-400 space-y-2 ml-7">
                  <li>• Los datos se procesan localmente en tu dispositivo</li>
                  <li>• No almacenamos imágenes de tu rostro</li>
                  <li>• Solo guardamos estadísticas anónimas de emociones</li>
                  <li>• Puedes desactivar esta función en cualquier momento</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={requestCameraPermission}
                className="flex-1 px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Aceptar y Activar Cámara
              </button>
              <button
                onClick={() => setShowEmotionConsent(false)}
                className="flex-1 px-6 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
              >
                Cancelar
              </button>
            </div>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Al continuar, aceptas los términos de privacidad del análisis emocional
            </p>
          </div>
        </div>
      )}

      {/* Emotional Summary Modal */}
      {showEmotionalSummary && currentSummary && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-zinc-900 rounded-lg max-w-4xl w-full border border-zinc-800 my-8">
            <div className="relative p-8">
              <button
                onClick={() => {
                  setShowEmotionalSummary(false);
                  setCurrentSummary(null);
                }}
                className="absolute top-4 right-4 p-2 bg-zinc-950/80 hover:bg-red-500 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{getEmotionIcon(currentSummary.predominantEmotion)}</div>
                <h2 className="text-3xl font-bold mb-2">Resumen Emocional</h2>
                <p className="text-zinc-400">Tu experiencia de visualización</p>
              </div>

              {/* Predominant Emotion */}
              <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Emoción Predominante
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getEmotionIcon(currentSummary.predominantEmotion)}</div>
                  <div>
                    <p className="text-2xl font-bold capitalize">{currentSummary.predominantEmotion}</p>
                    <p className="text-zinc-400">
                      {currentSummary.emotionPercentages[currentSummary.predominantEmotion]}% del tiempo
                    </p>
                  </div>
                </div>
              </div>

              {/* Emotion Distribution */}
              <div className="bg-zinc-800 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                  Distribución de Emociones
                </h3>
                <div className="space-y-3">
                  {Object.entries(currentSummary.emotionPercentages)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emotion, percentage]) => (
                      <div key={emotion}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2 capitalize">
                            <span className="text-xl">{getEmotionIcon(emotion)}</span>
                            {emotion}
                          </span>
                          <span className="font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-zinc-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getEmotionColor(emotion)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Satisfaction Level */}
                <div className="bg-zinc-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Nivel de Satisfacción</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-zinc-700"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - currentSummary.satisfactionLevel / 100)}`}
                          className="text-red-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{currentSummary.satisfactionLevel}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most Impactful Scenes */}
                <div className="bg-zinc-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Escenas Más Impactantes</h3>
                  <div className="space-y-2">
                    {currentSummary.mostImpactfulScenes.slice(0, 3).map((scene, index) => (
                      <div key={index} className="flex items-center gap-3 bg-zinc-900 rounded p-2">
                        <span className="text-2xl">{getEmotionIcon(scene.emotion)}</span>
                        <div className="flex-1">
                          <p className="text-sm capitalize">{scene.emotion}</p>
                          <p className="text-xs text-zinc-400">
                            {Math.floor(scene.timestamp / 60)}:{(scene.timestamp % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-lg p-6 border border-red-800/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" />
                  Recomendaciones Personalizadas
                </h3>
                <p className="text-zinc-300 mb-4">
                  Basado en tus emociones, te recomendamos explorar estos géneros:
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentSummary.recommendedGenres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-red-500 rounded-full text-sm font-semibold"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEmotionalSummary(false);
                  setCurrentSummary(null);
                  setCurrentView('explore');
                }}
                className="w-full mt-6 px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold"
              >
                Explorar Recomendaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg p-8 max-w-2xl w-full border border-zinc-800">
            {onboardingStep === 0 && (
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4">¡Bienvenido a MovieFlix!</h2>
                <p className="text-zinc-400 mb-6">
                  Descubre miles de películas, guarda tus favoritas y comparte tus opiniones con la comunidad.
                </p>
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="px-8 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  Comenzar
                </button>
              </div>
            )}
            {onboardingStep === 1 && (
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Crea tu Lista Personal</h2>
                <p className="text-zinc-400 mb-6">
                  Agrega películas a tu lista para verlas después. Solo toca el botón + en cualquier película.
                </p>
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="px-8 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  Siguiente
                </button>
              </div>
            )}
            {onboardingStep === 2 && (
              <div className="text-center">
                <div className="bg-red-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 fill-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Comparte tus Reseñas</h2>
                <p className="text-zinc-400 mb-6">
                  Haz clic en cualquier película para ver detalles y agregar tu reseña. Ayuda a otros a descubrir grandes películas.
                </p>
                <button
                  onClick={() => {
                    setShowOnboarding(false);
                    setOnboardingStep(0);
                  }}
                  className="px-8 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  ¡Empezar a Explorar!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* poner pelis */}
      {showMovieForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <form
            onSubmit={handleAddMovie}
            className="bg-zinc-900 p-6 rounded-xl w-full max-w-2xl space-y-4"
          >

            <h2 className="text-2xl font-bold">
              Registrar Película
            </h2>

            <input
              type="text"
              placeholder="Nombre"
              value={movieForm.nombre}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  nombre: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
              required
            />

            <input
              type="text"
              placeholder="Género"
              value={movieForm.genero}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  genero: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <input
              type="number"
              placeholder="Año"
              value={movieForm.anio}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  anio: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <input
              type="text"
              placeholder="Duración (2h 15min)"
              value={movieForm.duracion}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  duracion: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <input
              type="text"
              placeholder="Director"
              value={movieForm.director}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  director: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <input
              type="text"
              placeholder="Reparto separado por comas"
              value={movieForm.cast}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  cast: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <textarea
              placeholder="Descripción"
              value={movieForm.descripcion}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  descripcion: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <input
              type="text"
              placeholder="/pelis/imagen.jpg"
              value={movieForm.imagen}
              onChange={(e) =>
                setMovieForm({
                  ...movieForm,
                  imagen: e.target.value
                })
              }
              className="w-full p-3 bg-zinc-800 rounded"
            />

            <div className="flex gap-3">

              <button
                type="submit"
                className="bg-green-600 px-4 py-2 rounded-lg"
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={() => setShowMovieForm(false)}
                className="bg-red-600 px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Movie Detail Modal */}
{selectedMovie && (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
    <div className="bg-zinc-900 rounded-lg max-w-4xl w-full border border-zinc-800 max-h-[90vh] flex flex-col relative overflow-hidden">
      
      {/* Header with close button */}
      <button
        onClick={() => setSelectedMovie(null)}
        className="absolute top-4 right-4 p-2 bg-zinc-950/80 hover:bg-red-500 text-white rounded-full transition z-50"
      >
        <X className="w-5 h-5" />
      </button>

      {/* CONTENEDOR CON SCROLL INTERNO (Aplica a todo el contenido restante) */}
      <div className="overflow-y-auto flex-1 min-h-0">
        
        {/* Movie Banner / Watching Interface */}
        <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center rounded-t-lg relative overflow-hidden">
          {!watchingMovie ? (
            <>
              <Play className="w-20 h-20 text-zinc-600" />
              <button
                onClick={() => toggleMyList(selectedMovie.id)}
                className={`absolute top-4 left-4 px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  myList.includes(selectedMovie.id)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-zinc-950/80 hover:bg-red-500'
                }`}
              >
                {myList.includes(selectedMovie.id) ? (
                  <>
                    <Check className="w-4 h-4" />
                    En Mi Lista
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Agregar a Mi Lista
                  </>
                )}
              </button>

              {/* Watch Buttons */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={() => {
                    setWatchingMovie(true);
                    setPlaybackProgress(0);
                  }}
                  className="px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition font-semibold flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Reproducir
                </button>
                {userProfile?.emotionAnalysisEnabled && (
                  <button
                    onClick={() => startEmotionDetection(selectedMovie)}
                    className="px-6 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Ver con Análisis Emocional
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Simulated Video Player */}
              <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-2xl text-zinc-600">[ Reproduciendo película... ]</p>
                </div>

                {/* Emotion Detection Overlay */}
                {emotionAnalysisActive && (
                  <>
                    {/* Camera Indicator */}
                    <div className="absolute top-4 right-4 bg-red-500 rounded-lg px-3 py-2 flex items-center gap-2 animate-pulse">
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-semibold">Análisis Activo</span>
                    </div>

                    {/* Current Emotion Display */}
                    {currentEmotion && (
                      <div className="absolute top-4 left-4 bg-zinc-950/90 rounded-lg px-4 py-3 border border-zinc-700">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getEmotionIcon(currentEmotion.type)}</span>
                          <div>
                            <p className="text-xs text-zinc-400">Emoción detectada</p>
                            <p className="font-semibold capitalize">{currentEmotion.type}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mini Camera Preview (Simulated) */}
                    <div className="absolute bottom-20 right-4 w-32 h-24 bg-zinc-900 rounded-lg border-2 border-red-500 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <User className="w-12 h-12 text-zinc-600" />
                      </div>
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </>
                )}

                {/* Playback Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  {/* Progress Bar with Emotional Timeline */}
                  <div className="mb-3">
                    <div className="relative">
                      {/* Emotion Markers */}
                      {emotionAnalysisActive && activeSession && (
                        <div className="absolute -top-6 left-0 right-0 h-4 flex items-center">
                          {activeSession.emotions.map((emotion, index) => (
                            <div
                              key={index}
                              className="absolute w-2 h-2 rounded-full"
                              style={{
                                left: `${(emotion.timestamp / 180) * 100}%`,
                                backgroundColor: getEmotionColor(emotion.type).replace('bg-', '#')
                              }}
                              title={emotion.type}
                            >
                              <span className="absolute -top-5 text-xs">
                                {getEmotionIcon(emotion.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-700 rounded-full h-1 cursor-pointer">
                        <div
                          className="bg-red-500 h-1 rounded-full"
                          style={{ width: `${(playbackProgress / 180) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-zinc-400">
                      <span>{Math.floor(playbackProgress / 60)}:{(playbackProgress % 60).toString().padStart(2, '0')}</span>
                      <span>3:00</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button className="hover:text-white transition">
                        <Play className="w-6 h-6" />
                      </button>
                      {emotionAnalysisActive ? (
                        <button
                          onClick={stopEmotionDetection}
                          className="px-3 py-1 bg-red-500 rounded text-sm flex items-center gap-2 hover:bg-red-600 transition"
                        >
                          <CameraOff className="w-4 h-4" />
                          Detener Análisis
                        </button>
                      ) : (
                        <button
                          onClick={() => startEmotionDetection(selectedMovie)}
                          className="px-3 py-1 bg-zinc-700 rounded text-sm flex items-center gap-2 hover:bg-zinc-600 transition"
                        >
                          <Camera className="w-4 h-4" />
                          Activar Análisis
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setWatchingMovie(false);
                        if (emotionAnalysisActive) {
                          stopEmotionDetection();
                        }
                      }}
                      className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700 transition text-sm"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Movie Info */}
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-2">{selectedMovie.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-zinc-400 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>{selectedMovie.rating}</span>
              <span className="text-xs">({getMovieReviews(selectedMovie.id).length} reseñas)</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{selectedMovie.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{selectedMovie.duration}</span>
            </div>
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm">{selectedMovie.genre}</span>
          </div>

          <p className="text-zinc-300 mb-4">{selectedMovie.description}</p>

          <div className="mb-4">
            <p className="text-sm text-zinc-400 mb-1">
              <strong>Director:</strong> {selectedMovie.director}
            </p>
            <p className="text-sm text-zinc-400">
              <strong>Reparto:</strong> {selectedMovie.cast.join(', ')}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-zinc-800 pt-4 mt-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Reseñas ({getMovieReviews(selectedMovie.id).length})
            </h3>

            {/* Add Review Form */}
            <div className="bg-zinc-800 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-3">Escribe tu reseña</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-zinc-400">Tu calificación:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="transition hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newReview.rating
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-semibold">{newReview.rating}/5</span>
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Comparte tu opinión sobre esta película..."
                className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500 mb-3 min-h-[100px]"
              />
              <button
                onClick={handleAddReview}
                className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition flex items-center gap-2"
                disabled={!newReview.comment.trim()}
              >
                <Send className="w-4 h-4" />
                Publicar Reseña
              </button>
            </div>

            {/* Reviews List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {getMovieReviews(selectedMovie.id).length === 0 ? (
                <p className="text-zinc-400 text-center py-8">
                  No hay reseñas aún. ¡Sé el primero en compartir tu opinión!
                </p>
              ) : (
                getMovieReviews(selectedMovie.id).map((review) => (
                  <div key={review.id} className="bg-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {review.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold">{review.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-zinc-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-zinc-400">{review.date}</span>
                      </div>
                    </div>
                    <p className="text-zinc-300">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div> {/* AQUÍ CIERRA EL SCROLL INTERNO */}
    </div>
  </div>
)}

      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-red-500 cursor-pointer" onClick={() => setCurrentView('explore')}>
              MovieFlix
            </h1>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar películas..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('mylist')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${currentView === 'mylist'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
              >
                Mi Lista
                {myList.length > 0 && (
                  <span className="bg-red-600 text-xs px-2 py-0.5 rounded-full">
                    {myList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setCurrentView('photo');
                  setPhotoStep('intro');
                  setCapturedPhoto(null);
                  setDetectedEmotion(null);
                  setCameraActive(false);
                }}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${currentView === 'photo'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
              >
                <Camera className="w-4 h-4" />
                Capturar Foto
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${currentView === 'profile'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          {currentView === 'explore' && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition whitespace-nowrap ${selectedCategory === category
                    ? 'bg-red-500 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'explore' ? (
          <>
            {/* Trending Section */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Tendencias Ahora</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-red-500 transition cursor-pointer group"
                  >
                    {/* Movie Poster Placeholder */}
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMyList(movie.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition ${myList.includes(movie.id)
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-zinc-950/80 hover:bg-red-500'
                          }`}
                        title={myList.includes(movie.id) ? 'Quitar de mi lista' : 'Agregar a mi lista'}
                      >
                        {myList.includes(movie.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Movie Info */}
                    <div className="p-3">
                      <h3 className="font-semibold mb-1 truncate">{movie.title}</h3>
                      <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{movie.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommendations Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Recomendadas Para Ti</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {filteredRecommendations.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-red-500 transition cursor-pointer group"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMyList(movie.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition ${myList.includes(movie.id)
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-zinc-950/80 hover:bg-red-500'
                          }`}
                        title={myList.includes(movie.id) ? 'Quitar de mi lista' : 'Agregar a mi lista'}
                      >
                        {myList.includes(movie.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold mb-1 truncate">{movie.title}</h3>
                      <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{movie.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : currentView === 'mylist' ? (
          /* My List View */
          <section>
            <h2 className="text-2xl font-bold mb-6">Mi Lista</h2>
            {myListMovies.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-zinc-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl mb-2">Tu lista está vacía</h3>
                <p className="text-zinc-400 mb-4">Agrega películas para verlas más tarde</p>
                <button
                  onClick={() => setCurrentView('explore')}
                  className="px-6 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                >
                  Explorar Películas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myListMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-red-500 transition cursor-pointer group"
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <img
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMyList(movie.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full transition ${myList.includes(movie.id)
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-zinc-950/80 hover:bg-red-500'
                          }`}
                        title={myList.includes(movie.id) ? 'Quitar de mi lista' : 'Agregar a mi lista'}
                      >
                        {myList.includes(movie.id) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold mb-1 truncate">{movie.title}</h3>
                      <div className="flex items-center justify-between text-sm text-zinc-400">
                        <span>{movie.genre}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span>{movie.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : currentView === 'photo' ? (
          /* Photo Capture View */
          <section>
            {photoStep === 'intro' ? (
              /* Intro screen */
              <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-12">
                {/* Hero */}
                <div className="mb-12">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="text-red-500">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3zM7 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8 16V8l8 4-8 4z" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-red-500">MovieFlix</h1>
                  </div>

                  <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                    Películas que reflejan<br />tus emociones
                  </h2>
                  <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10">
                    Nuestra IA analiza tu rostro para detectar tu estado de ánimo y
                    recomendar películas perfectas para ti
                  </p>
                  <button
                    onClick={() => setPhotoStep('capture')}
                    className="px-10 py-4 bg-red-500 hover:bg-red-600 transition rounded-lg text-lg font-bold"
                  >
                    ¡Comencemos!
                  </button>
                </div>

                {/* Feature cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
                    <div className="text-3xl mb-3">🎭</div>
                    <h3 className="font-bold mb-2">Análisis de Emociones</h3>
                    <p className="text-sm text-zinc-400">
                      Tecnología de IA avanzada que detecta tu estado emocional en tiempo real
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
                    <div className="text-3xl mb-3">🎬</div>
                    <h3 className="font-bold mb-2">Recomendaciones Personalizadas</h3>
                    <p className="text-sm text-zinc-400">
                      Películas seleccionadas específicamente para tu estado de ánimo actual
                    </p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
                    <div className="text-3xl mb-3">⚡</div>
                    <h3 className="font-bold mb-2">Instantáneo</h3>
                    <p className="text-sm text-zinc-400">
                      Obtén recomendaciones en segundos con solo una foto
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Capture screen */
              <div className="max-w-3xl mx-auto py-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Detecta tu emoción</h2>
                  <p className="text-zinc-400">
                    Activa la cámara y deja que nuestra IA detecte tu estado de ánimo
                  </p>
                </div>

                {/* Camera / Photo area */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6">
                  <div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
                    {capturedPhoto ? (
                      <img
                        src={capturedPhoto}
                        alt="Foto capturada"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        {/* El video se queda siempre montado para no perder la referencia de la webcam, pero lo ocultamos si no está activo */}
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          playsInline
                          className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                        />

                        {/* Si la cámara está apagada y no hay foto, mostramos el icono de marcador de posición */}
                        {!cameraActive && (
                          <div className="flex flex-col items-center gap-4 text-zinc-600">
                            <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center">
                              <Camera className="w-12 h-12" />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Scanning overlay when camera is active */}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-red-500 rounded-tl-lg" />
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-red-500 rounded-tr-lg" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-red-500 rounded-bl-lg" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-red-500 rounded-br-lg" />
                        <div className="absolute top-2 right-2 flex items-center gap-2 bg-red-500 rounded-full px-3 py-1 text-xs font-semibold">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          EN VIVO
                        </div>
                      </div>
                    )}

                    {/* Detected emotion overlay on captured photo */}
                    {capturedPhoto && detectedEmotion && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-950/90 border border-zinc-700 rounded-xl px-6 py-3 flex items-center gap-3">
                        <span className="text-3xl">{getEmotionIcon(detectedEmotion)}</span>
                        <div>
                          <p className="text-xs text-zinc-400">Emoción detectada</p>
                          <p className="font-bold capitalize text-lg">{detectedEmotion}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera controls */}
                  <div className="p-4 flex items-center justify-center gap-3">
                    {!cameraActive && !capturedPhoto && (
                      <button
                        onClick={activatePhotoCamera}
                        className="px-8 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Activar Cámara
                      </button>
                    )}
                    {cameraActive && (
                      <>
                        <button
                          onClick={capturePhoto}
                          className="px-8 py-3 bg-red-500 rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Tomar Foto
                        </button>
                        <button
                          onClick={stopPhotoCamera}
                          className="px-6 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition flex items-center gap-2"
                        >
                          <CameraOff className="w-5 h-5" />
                          Cancelar
                        </button>
                      </>
                    )}
                    {capturedPhoto && (
                      <button
                        onClick={() => {
                          setCapturedPhoto(null);
                          setDetectedEmotion(null);
                          setPhotoRecommendations([]);
                        }}
                        className="px-6 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Nueva Foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Manual emotion selection */}
                <div className="mb-6">
                  <p className="text-center text-sm text-zinc-400 mb-4">
                    {capturedPhoto ? 'O ajusta tu emoción manualmente:' : '¿O prefieres seleccionar tu emoción?'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {[
                      { key: 'feliz', label: 'Feliz' },
                      { key: 'triste', label: 'Triste' },
                      { key: 'enojado', label: 'Enojado' },
                      { key: 'sorprendido', label: 'Sorprendido' },
                      { key: 'neutral', label: 'Neutral' },
                      { key: 'emocionado', label: 'Emocionado' },
                      { key: 'asustado', label: 'Asustado' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => selectEmotionManually(key)}
                        className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition border ${detectedEmotion === key && !capturedPhoto
                          ? 'bg-zinc-700 border-red-500'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                          }`}
                      >
                        <span className="text-2xl">{getEmotionIcon(key)}</span>
                        <span className="text-xs text-zinc-300">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Movie Recommendations based on emotion */}
                {detectedEmotion && (
                  <div className="w-full space-y-8">
                    {/* Generamos una lista segura combinando TMDB o tus películas locales filtradas por género */}
                    {(() => {
                      // Eliminamos duplicados de las recomendaciones de la foto primero
                      let cleanRecs = Array.from(new Map(photoRecommendations.map((movie: any) => [movie.id, movie])).values());

                      // Si vino vacío de Python, respaldamos con tus películas locales filtradas por la emoción actual
                      if (cleanRecs.length === 0) {
                        const emotionGenreMap: { [key: string]: string[] } = {
                          feliz: ['Comedia', 'Romance'],
                          triste: ['Drama', 'Romance'],
                          enojado: ['Acción', 'Suspenso'],
                          sorprendido: ['Ciencia Ficción', 'Suspenso'],
                          neutral: ['Todas'],
                          emocionado: ['Acción', 'Ciencia Ficción'],
                          asustado: ['Terror', 'Suspenso'],
                        };
                        const targetGenres = emotionGenreMap[detectedEmotion] || ['Todas'];
                        cleanRecs = allMovies.filter(m => targetGenres.includes(m.genre) || targetGenres.includes('Todas')).slice(0, 5);

                        // Si aún así no hay nada, mandamos las primeras 5 de tu catálogo general
                        if (cleanRecs.length === 0) {
                          cleanRecs = allMovies.slice(0, 5);
                        }
                      }

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="md:col-span-2 space-y-6">
                              <div className="bg-gradient-to-r from-red-950/20 to-red-800/10 border border-red-800/40 rounded-2xl p-6">
                                <h3 className="text-lg font-bold mb-1 flex items-center gap-2 text-white">
                                  <Zap className="w-5 h-5 text-red-500" />
                                  Películas para tu estado de ánimo
                                </h3>
                                <p className="text-sm text-zinc-400 mb-4">
                                  Basado en tu emoción <span className="capitalize font-semibold text-white">{detectedEmotion}</span>
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  {cleanRecs.slice(0, 3).map((movie: any) => (
                                    <div
                                      key={movie.id}
                                      onClick={() => setSelectedMovie(movie)}
                                      className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-red-500 transition cursor-pointer group"
                                    >
                                      <div className="aspect-[2/3] relative overflow-hidden">
                                        <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="p-3">
                                        <h4 className="font-semibold truncate mb-1 text-white text-sm">{movie.title}</h4>
                                        <div className="flex items-center justify-between text-xs text-zinc-400">
                                          <span>{movie.genre}</span>
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            <span>{movie.rating}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="bg-zinc-900/90 border border-zinc-700/50 rounded-2xl p-5 flex flex-col shadow-2xl">
                              <h3 className="text-xs font-bold text-red-500 tracking-[0.2em] mb-6 flex items-center gap-2 uppercase">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                Análisis de Datos Real
                              </h3>

                              {allEmotionsData ? (
                                <div className="space-y-4">
                                  {Object.entries(allEmotionsData)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([emotion, percentage]) => (
                                      <div key={emotion} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-tight">
                                          <span className="text-zinc-300 flex items-center gap-1">
                                            {getEmotionIcon(emotion).split(' ')[0]}
                                            {emotion}
                                          </span>
                                          <span className="text-red-400 font-bold">{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                                          <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getEmotionColor(emotion)}`}
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                <div className="flex-1 flex items-center justify-center text-center">
                                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed px-4">
                                    SISTEMA ESPERANDO<br />CAPTURA DE DATOS BIOMÉTRICOS...
                                  </p>
                                </div>
                              )}

                              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                                <div className="text-[9px] font-mono text-zinc-600">
                                  ID_SCAN: {Math.random().toString(36).substring(7).toUpperCase()}<br />
                                  SOURCE: DEEPFACE_V8
                                </div>
                                <div className="bg-red-500/10 text-red-500 text-[8px] font-bold px-2 py-1 rounded border border-red-500/20">
                                  LIVE_DATA
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 🍿 CARTELERA GLOBAL GRANDE INFERIOR */}
                          <div className="mt-12 border-t border-zinc-800 pt-8 w-full">
                            <div className="bg-gradient-to-r from-cyan-950/20 to-zinc-900/50 border border-cyan-800/30 rounded-2xl p-6 mb-8 text-left">
                              <h2 className="text-xl md:text-2xl font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                </span>
                                Estas películas se adecuan a tu estado de ánimo
                              </h2>
                              <p className="text-sm text-zinc-400 mt-2 font-sans">
                                Nuestra Inteligencia Artificial detectó que tu humor actual es <span className="capitalize font-bold text-cyan-400 font-mono text-base">{detectedEmotion}</span>. Hemos consultado la cartelera {photoRecommendations.length > 0 ? 'global de TMDB en tiempo real' : 'local de nuestra base de datos'} para recomendarte las mejores opciones únicas para ti:
                              </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                              {(photoRecommendations.length > 0 ? photoRecommendations : manualRecommendations).slice(0, 5).map((movie: any) => (
                                <div
                                  key={movie.id}
                                  className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:scale-105 transition duration-300 cursor-pointer group hover:border-cyan-500 shadow-lg"
                                  onClick={() => setSelectedMovie(movie)}
                                >
                                  <div className="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                                    <img
                                      src={movie.image || movie.imagen || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400'}
                                      alt={movie.title || movie.nombre}
                                      className="w-full h-full object-cover group-hover:opacity-80 transition"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400';
                                      }}
                                    />
                                  </div>
                                  <div className="p-3 bg-zinc-900/50">
                                    <h3 className="font-semibold truncate text-white text-sm group-hover:text-cyan-400 transition">
                                      {movie.title || movie.nombre}
                                    </h3>
                                    <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                                      <span className="text-cyan-400">{movie.year || movie.anio}</span>
                                      <span className="text-zinc-500 flex items-center gap-0.5">
                                        ⭐ {movie.rating ? Number(movie.rating).toFixed(1) : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </section>
        ) : (
          /* Profile View */
          <section>
            <h2 className="text-2xl font-bold mb-6">Mi Perfil</h2>

            {userProfile && (
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Profile Info Card */}
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{userProfile.name}</h3>
                        <p className="text-zinc-400">Miembro desde {userProfile.joinDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <p className="text-sm text-zinc-400 mb-1">Películas en Mi Lista</p>
                      <p className="text-2xl font-bold text-red-500">{myList.length}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4">
                      <p className="text-sm text-zinc-400 mb-1">Reseñas Publicadas</p>
                      <p className="text-2xl font-bold text-red-500">
                        {reviews.filter(r => r.userName === user).length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Section */}
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Edit2 className="w-5 h-5" />
                      Información Personal
                    </h3>
                    {!editingProfile && (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  {editingProfile ? (
                    <form onSubmit={handleEditProfile} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2 text-zinc-400">Nombre</label>
                        <input
                          type="text"
                          value={editProfileForm.name}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2 text-zinc-400">Correo Electrónico</label>
                        <input
                          type="email"
                          value={editProfileForm.email}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                        >
                          Guardar Cambios
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfile(false);
                            setEditProfileForm({ name: userProfile.name, email: userProfile.email });
                          }}
                          className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-zinc-300">
                        <User className="w-5 h-5 text-zinc-500" />
                        <span>{userProfile.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-zinc-300">
                        <Mail className="w-5 h-5 text-zinc-500" />
                        <span>{userProfile.email}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Password Section */}
                <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Cambiar Contraseña
                    </h3>
                    {!changingPassword && (
                      <button
                        onClick={() => setChangingPassword(true)}
                        className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  {changingPassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm mb-2 text-zinc-400">Contraseña Actual</label>
                        <input
                          type="password"
                          value={changePasswordForm.currentPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2 text-zinc-400">Nueva Contraseña</label>
                        <input
                          type="password"
                          value={changePasswordForm.newPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2 text-zinc-400">Confirmar Nueva Contraseña</label>
                        <input
                          type="password"
                          value={changePasswordForm.confirmPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-red-500"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
                        >
                          Actualizar Contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setChangingPassword(false);
                            setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-zinc-400">••••••••</p>
                  )}
                </div>

                {/* Emotion Analysis Settings */}
                

                {/* Delete Account Section */}
                <div className="bg-zinc-900 rounded-lg p-6 border border-red-900/50">
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-2 text-red-500">
                    <Trash2 className="w-5 h-5" />
                    Zona de Peligro
                  </h3>
                  <p className="text-zinc-400 mb-4">
                    Eliminar tu cuenta es permanente y no se puede deshacer. Todos tus datos, listas y reseñas serán eliminados.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                  >
                    Eliminar Cuenta
                  </button>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-red-900">
                  <h3 className="text-xl font-bold mb-4 text-red-500">¿Eliminar Cuenta?</h3>
                  <p className="text-zinc-300 mb-6">
                    Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos, películas guardadas y reseñas.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                      Sí, Eliminar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

/*REAL DEFINITIVO NO FAKE AHDJAS :V ESPERO ENCUENTREN ESTE TEXTO POR AQUÍ */