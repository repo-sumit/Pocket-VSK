import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { dataProvider } from "./data/provider";
import "./index.css";

// Boot gate: load the data provider's seed (its own lazily-fetched chunk) before
// mounting React, so every render sees a fully-populated provider. The lightweight
// loading shell in index.html stays visible until this resolves.
const root = createRoot(document.getElementById("root")!);
dataProvider
  .init()
  .then(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((err) => {
    console.error("Failed to load portal data", err);
    root.render(<div style={{ padding: 24, fontFamily: "system-ui", color: "#B91C1C" }}>Could not load portal data. Please refresh.</div>);
  });
