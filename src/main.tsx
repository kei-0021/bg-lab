// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LobbyRoom from "./rooms/LobbyRoom.js";

const roomModules = import.meta.glob("./rooms/*Room.tsx", { eager: true });

const autoRoutes = Object.entries(roomModules)
  .filter(([path]) => !path.includes("LobbyRoom"))
  .map(([path, module]: [string, any]) => {
    const fileName = path.split("/").pop()?.replace(".tsx", "") || "";
    // パスを小文字化
    const routePath = fileName.replace(/Room$/, "").toLowerCase();

    const RoomComponent =
      module[fileName] ||
      module.default ||
      Object.values(module).find((val) => typeof val === "function");

    return {
      path: `/${routePath}/:roomId`,
      Component: RoomComponent,
      key: fileName,
    };
  })
  .filter((route) => route.Component);

console.log(`Total games registered: ${autoRoutes.length}`);
console.table(autoRoutes.map((r) => ({ file: r.key, url: r.path })));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyRoom />} />
        {autoRoutes.map(({ path, Component, key }) => (
          <Route key={key} path={path} element={<Component />} />
        ))}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
