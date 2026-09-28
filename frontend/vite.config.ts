import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages hospeda como project page (Andremelo001.github.io/PROGRAD-Analytics/),
// então o build de produção precisa desse prefixo nas URLs dos assets. Em dev
// (`vite dev`) e no `vite preview` local, a env não é setada e o base fica "/".
const BASE = process.env.GITHUB_PAGES === "true" ? "/PROGRAD-Analytics/" : "/";

export default defineConfig({
    base: BASE,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
});
