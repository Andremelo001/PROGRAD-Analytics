import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/App";

// Jaldi (fonte do design no Figma) empacotada junto com o site — sem depender
// do CDN do Google em produção (GitHub Pages).
import "@fontsource/jaldi/latin-400.css";
import "@fontsource/jaldi/latin-700.css";
import "@/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Elemento #root não encontrado em index.html");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
