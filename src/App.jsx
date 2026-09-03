import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotificationListener from "./components/NotificationListener";
import AnimatedBackground from "./components/AnimatedBackground";
import LoadingAnimation from "./components/LoadingAnimation";
import ToastHost from "./components/Toast";
import ConfirmHost from "./components/ConfirmDialog";

// Route-based code splitting: each page loads its own chunk on demand,
// so the login/splash paint no longer download Three.js, Leaflet, gsap, etc.
const Splash = lazy(() => import("./pages/Splash"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Login = lazy(() => import("./pages/Login"));
const Main = lazy(() => import("./pages/Main"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RoutePlanner = lazy(() => import("./pages/RoutePlanner"));
const ImageAnalysis = lazy(() => import("./pages/ImageAnalysis"));
const History = lazy(() => import("./pages/History"));

// Simple auth wrapper (can be expanded later)
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <NotificationListener />
      <ToastHost />
      <ConfirmHost />
      <Suspense fallback={<LoadingAnimation />}>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/main" element={<Main />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/route-planner" element={<ProtectedRoute><RoutePlanner /></ProtectedRoute>} />
          <Route path="/image-analysis" element={<ProtectedRoute><ImageAnalysis /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;