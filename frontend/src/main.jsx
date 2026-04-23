import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const API_BASE_URL = "https://bioflo-backend.onrender.com";
const LOCAL_API_BASES = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
];

function rewriteUrl(url) {
  if (typeof url !== "string") return url;

  let rewritten = url;
  for (const base of LOCAL_API_BASES) {
    if (rewritten.startsWith(base)) {
      rewritten = rewritten.replace(base, API_BASE_URL);
    }
  }
  return rewritten;
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init) => {
  if (typeof input === "string") {
    return originalFetch(rewriteUrl(input), init);
  }

  if (input instanceof Request) {
    const rewrittenUrl = rewriteUrl(input.url);

    if (rewrittenUrl !== input.url) {
      const clonedRequest = new Request(rewrittenUrl, input);
      return originalFetch(clonedRequest, init);
    }
  }

  return originalFetch(input, init);
};

window.API_BASE_URL = API_BASE_URL;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);