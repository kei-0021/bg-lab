import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AmanogawaRoom } from "./rooms/AmanogawaRoom.js";
import DeepAbyssRoom from "./rooms/DeepAbyssRoom.js";
import FireworksRoom from "./rooms/FireworksRoom.js";
import LobbyRoom from "./rooms/LobbyRoom.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ロビー */}
        <Route path="/" element={<LobbyRoom />} />

        {/* 各ゲームルーム */}
        <Route path="/fireworks/:roomId" element={<FireworksRoom />} />
        <Route path="/deepabyss/:roomId" element={<DeepAbyssRoom />} />
        <Route path="/amanogawa/:roomId" element={<AmanogawaRoom />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
