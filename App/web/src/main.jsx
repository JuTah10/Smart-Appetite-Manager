import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import "./index.css";

const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const RecipeDiscoveryPage = lazy(() => import("./pages/RecipeDiscoveryPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/recipes" element={<RecipeDiscoveryPage />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
