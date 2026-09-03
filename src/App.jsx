import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import NotificationListener from "./components/NotificationListener";
import AnimatedBackground from "./components/AnimatedBackground";
import LoadingAnimation from "./components/LoadingAnimation";
import ToastHost from "./components/Toast";
import ConfirmHost from "./components/ConfirmDialog";

// Route-based code splitting: each page loads its own chunk on demand.
const Splash = lazy(() => import("./pages/Splash"));
const Welcome = lazy(() => import("./pages/Welcome"));
const Login = lazy(() => import("./pages/Login"));
const Home = lazy(() => import("./pages/Main"));
const About = lazy(() => import("./pages/About"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RoutePlanner = lazy(() => import("./pages/RoutePlanner"));
const ImageAnalysis = lazy(() => import("./pages/ImageAnalysis"));
const History = lazy(() => import("./pages/History"));

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Opacity-only page transition — keeps sticky nav & fixed overlays intact
// (a transform on the wrapper would re-anchor position:fixed/sticky children).
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <Suspense fallback={<LoadingAnimation />}>
          <Routes location={location}>
            <Route path="/" element={<Splash />} />
            <Route path="/home" element={<Home />} />
            <Route path="/main" element={<Navigate to="/home" replace />} />
            <Route path="/about" element={<About />} />
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
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <NotificationListener />
      <ToastHost />
      <ConfirmHost />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
