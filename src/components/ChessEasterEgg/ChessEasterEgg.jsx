import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import stockfishUrl from 'stockfish/bin/stockfish-18-lite-single.js?url';
import './ChessEasterEgg.css';

const DIFFICULTY_CONFIG = {
  easy:   { skill: 2,  movetime: 300  },
  medium: { skill: 8,  movetime: 500  },
  hard:   { skill: 15, movetime: 1000 },
};

export default function ChessEasterEgg({ onClose }) {
  const [screen, setScreen]       = useState('difficulty');
  const [difficulty, setDifficulty] = useState(null);
  const [fen, setFen]             = useState('start');
  const [gameOver, setGameOver]   = useState(null);   // null | { reason }
  const [thinking, setThinking]   = useState(false);
  const [moveFrom, setMoveFrom]   = useState(null);   // selected square for click-move

  const chessRef   = useRef(new Chess());
  const engineRef  = useRef(null);
  const movetimeRef = useRef(300);

  // Terminate engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.terminate();
    };
  }, []);

  const checkGameOver = useCallback(() => {
    const chess = chessRef.current;
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'b' ? 'You win!' : 'Engine wins!';
      setGameOver({ reason: `Checkmate — ${winner}` });
    } else if (chess.isStalemate()) {
      setGameOver({ reason: 'Stalemate — draw' });
    } else if (chess.isDraw()) {
      setGameOver({ reason: 'Draw' });
    }
  }, []);

  const triggerEngineMove = useCallback(() => {
    if (!engineRef.current) return;
    setThinking(true);
    const currentFen = chessRef.current.fen();
    engineRef.current.postMessage(`position fen ${currentFen}`);
    engineRef.current.postMessage(`go movetime ${movetimeRef.current}`);
  }, []);

  const initEngine = useCallback((skillLevel, movetime) => {
    if (engineRef.current) engineRef.current.terminate();
    movetimeRef.current = movetime;

    const worker = new Worker(stockfishUrl, { type: 'classic' });

    worker.onmessage = (e) => {
      const data = e.data;
      if (typeof data !== 'string') return;
      const match = data.match(/^bestmove\s+([a-h][1-8][a-h][1-8])([qrbn])?/);
      if (match) {
        const squares = match[1];
        const promo   = match[2] || 'q';
        const move = chessRef.current.move({
          from: squares.slice(0, 2),
          to:   squares.slice(2, 4),
          promotion: promo,
        });
        if (move) {
          setFen(chessRef.current.fen());
          checkGameOver();
        }
        setThinking(false);
      }
    };

    worker.postMessage('uci');
    worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
    worker.postMessage('ucinewgame');
    worker.postMessage('isready');

    engineRef.current = worker;
  }, [checkGameOver]);

  const startGame = useCallback((diff) => {
    const { skill, movetime } = DIFFICULTY_CONFIG[diff];
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setGameOver(null);
    setThinking(false);
    setMoveFrom(null);
    setDifficulty(diff);
    setScreen('game');
    initEngine(skill, movetime);
  }, [initEngine]);

  const resetGame = useCallback(() => {
    if (difficulty) startGame(difficulty);
  }, [difficulty, startGame]);

  const handleDrop = useCallback((sourceSquare, targetSquare) => {
    if (thinking || gameOver) return false;
    const move = chessRef.current.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });
    if (!move) return false;
    setFen(chessRef.current.fen());
    setMoveFrom(null);
    checkGameOver();
    if (!chessRef.current.isGameOver()) triggerEngineMove();
    return true;
  }, [thinking, gameOver, checkGameOver, triggerEngineMove]);

  const handleSquareClick = useCallback((square) => {
    if (thinking || gameOver) return;
    const chess = chessRef.current;

    if (moveFrom) {
      const move = chess.move({ from: moveFrom, to: square, promotion: 'q' });
      setMoveFrom(null);
      if (move) {
        setFen(chess.fen());
        checkGameOver();
        if (!chess.isGameOver()) triggerEngineMove();
      }
      return;
    }

    // Select a piece (only white pieces — player is always white)
    const piece = chess.get(square);
    if (piece && piece.color === 'w') {
      setMoveFrom(square);
    }
  }, [thinking, gameOver, moveFrom, checkGameOver, triggerEngineMove]);

  // Highlight selected square
  const customSquareStyles = moveFrom
    ? { [moveFrom]: { backgroundColor: 'rgba(255, 0, 222, 0.35)' } }
    : {};

  return (
    <div className="chess-modal-backdrop" onClick={onClose}>
      <div className="chess-modal" onClick={(e) => e.stopPropagation()}>

        {screen === 'difficulty' && (
          <div className="chess-difficulty-screen">
            <h2>Chess</h2>
            <p className="chess-subtitle">You found the easter egg.</p>
            <p className="chess-difficulty-label">Select difficulty</p>
            <div className="chess-difficulty-btns">
              <button onClick={() => startGame('easy')}>Easy</button>
              <button onClick={() => startGame('medium')}>Medium</button>
              <button onClick={() => startGame('hard')}>Hard</button>
            </div>
            <button className="chess-close-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>×</button>
          </div>
        )}

        {screen === 'game' && (
          <div className="chess-game-screen">
            <div className="chess-game-header">
              <span className="chess-diff-label">{difficulty}</span>
              {thinking && <span className="chess-thinking">thinking…</span>}
              {!thinking && !gameOver && (
                <span className="chess-status">
                  {chessRef.current.turn() === 'w' ? 'Your turn' : ''}
                </span>
              )}
              <button className="chess-close-btn" onClick={onClose}>×</button>
            </div>

            <Chessboard
              position={fen}
              onPieceDrop={handleDrop}
              onSquareClick={handleSquareClick}
              boardOrientation="white"
              customDarkSquareStyle={{ backgroundColor: '#1a1a2e' }}
              customLightSquareStyle={{ backgroundColor: '#2d2d44' }}
              customBoardStyle={{ borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
              customSquareStyles={customSquareStyles}
              arePiecesDraggable={!thinking && !gameOver}
            />

            {gameOver && (
              <div className="chess-game-over">
                <span>{gameOver.reason}</span>
                <div className="chess-game-over-btns">
                  <button onClick={resetGame}>Play Again</button>
                  <button onClick={onClose}>Close</button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
