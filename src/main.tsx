import { createRoot } from "react-dom/client";
import { installCanvasRoundRectPolyfill } from "@/lib/canvasRoundRectPolyfill";
import App from "./App.tsx";
import "./index.css";

installCanvasRoundRectPolyfill();

createRoot(document.getElementById("root")!).render(<App />);
