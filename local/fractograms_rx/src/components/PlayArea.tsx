import { useState } from "react";
import "./PlayArea.css";
import { AppState } from "../data_structures/app_state.ts";

export default function PlayArea() {
  const [gameState, setGameState] = useState(null as AppState | null);

  return (
    <svg id="play-area-svg">
      <svg id="centering-svg" x="50%">
        <Board gameState={gameState}></Board>
      </svg>
    </svg>
  );
}
