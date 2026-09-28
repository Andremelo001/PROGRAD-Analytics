// Copia backend/app/data/processed/dashboard.json (gerado pelo pipeline Python) pra
// frontend/public/data/, de onde o Vite serve como asset estático — tanto em
// dev quanto no build de produção (GitHub Pages não roda servidor nenhum,
// só serve arquivo).
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(
    __dirname,
    "..",
    "..",
    "backend",
    "app",
    "data",
    "processed",
    "dashboard.json"
);
const DEST = resolve(__dirname, "..", "public", "data", "dashboard.json");

if (!existsSync(SOURCE)) {
    console.error(
        `dashboard.json não encontrado em ${SOURCE}\n` +
            "Rode o pipeline Python antes: cd backend && poetry run python -m app.cmd dashboard"
    );
    process.exit(1);
}

mkdirSync(dirname(DEST), { recursive: true });
copyFileSync(SOURCE, DEST);
console.log(`dashboard.json sincronizado -> ${DEST}`);
