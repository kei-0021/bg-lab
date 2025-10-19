import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import DeepAbyssRoom from "./rooms/DeepAbyssRoom.js";
import LobbyRoom from "./rooms/LobbyRoom.js";
import SkyRoom from "./rooms/SkyRoom.js";
import VolcanoRoom from "./rooms/VolcanoRoom.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ロビー */}
        <Route path="/" element={<LobbyRoom />} />

        {/* 各ゲームルーム */}
        <Route path="/deepabyss/:roomId" element={<DeepAbyssRoom />} />
        <Route path="/sky/:roomId" element={<SkyRoom />} />
        <Route path="/volcano/:roomId" element={<VolcanoRoom />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
