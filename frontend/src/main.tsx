import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/App";

// Plus Jakarta Sans (variável) empacotada junto com o site — sem depender do CDN do
// Google em produção (GitHub Pages).
import "@fontsource-variable/plus-jakarta-sans";
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
