import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GameRoom from "./rooms/DeepSeaRoom.js";
import LobbyRoom from "./rooms/LobbyRoom.js";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* ルートパス (/) をロビーに設定 */}
        <Route path="/" element={<LobbyRoom />} /> 
        
        {/* /room/:roomId にアクセスした時だけゲームルーム（Socket接続を含む）を表示 */}
        <Route path="/room/:roomId" element={<GameRoom />} /> 
        
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
