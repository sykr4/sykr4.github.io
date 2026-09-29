import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "lenis/dist/lenis.css";
import "./index.css";
import App from "./App";
import { startLoop } from "./lib/loop";

// Un único bucle de animación para toda la web (gsap.ticker)
startLoop();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
