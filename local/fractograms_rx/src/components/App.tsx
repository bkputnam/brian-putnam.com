import "./App.css";
import PlayArea from "./PlayArea.tsx";

function App() {
  return (
    <>
      <h1>Fractograms</h1>
      <form id="timer-hint-form">
        <label id="timer"></label>
        <button id="hint-btn">Hint</button>
        <button id="random-btn">Random Game</button>
      </form>
      <div id="play-area">
        <PlayArea></PlayArea>
      </div>
      <div id="dialogs"></div>
    </>
  );
}

export default App;
