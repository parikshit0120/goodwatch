import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Finder from "./pages/Finder";
import Results from "./pages/Results";

// Handle GitHub Pages SPA routing
function RouteHandler() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('p');
    if (path) {
      navigate(path, { replace: true });
    }
  }, [navigate]);
  
  return null;
}

function App() {
  return (
    <BrowserRouter basename="/goodwatch">
      <RouteHandler />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/finder" element={<Finder />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
