'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Shield, MessageSquare, Lightbulb, Lock, HelpCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface LabGameViewProps {
  hints: string[];
  revealedHints: number;
  onRevealHint: () => Promise<void>;
  points: number;
  labStatus: 'idle' | 'starting' | 'running' | 'completed';
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  avatar: string;
  color: string;
  hintIndex: number;
}

export default function LabGameView({ hints, revealedHints, onRevealHint, points, labStatus }: LabGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [player, setPlayer] = useState({ x: 400, y: 240, speed: 4, width: 24, height: 24 });
  const [activeNpc, setActiveNpc] = useState<Entity | null>(null);
  const [dialogue, setDialogue] = useState<{ isOpen: boolean; text: string; showOptions: boolean } | null>(null);
  const [typedText, setTypedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [keysPressed, setKeysPressed] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Map obstacles definitions (bounding boxes)
  const obstacles = [
    // Outer walls boundary collision is handled separately, these are interior obstacles
    { x: 100, y: 150, width: 120, height: 40, label: 'Bàn Server A' },
    { x: 580, y: 150, width: 120, height: 40, label: 'Bàn Server B' },
    { x: 280, y: 80, width: 240, height: 30, label: 'Bàn Điều Khiển Trung Tâm' },
    { x: 200, y: 320, width: 60, height: 100, label: 'Tủ Rack 1' },
    { x: 540, y: 320, width: 60, height: 100, label: 'Tủ Rack 2' },
  ];

  // NPCs definitions
  const npcs: Entity[] = [
    {
      x: 160,
      y: 120,
      width: 24,
      height: 24,
      name: 'Mentor SQLi (Guru Xanh)',
      avatar: '🕵️‍♂️',
      color: '#00a3ff',
      hintIndex: 0,
    },
    {
      x: 640,
      y: 120,
      width: 24,
      height: 24,
      name: 'Agent Guard (Ninja Đỏ)',
      avatar: '🥷',
      color: '#ff2d55',
      hintIndex: 1,
    },
    {
      x: 400,
      y: 350,
      width: 24,
      height: 24,
      name: 'Hacker Bóng Đêm (Bóng Tím)',
      avatar: '🧙‍♂️',
      color: '#af52de',
      hintIndex: 2,
    },
  ].slice(0, hints.length); // Render only as many NPCs as there are hints

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.code]: true }));
      
      // Prevent scrolling with arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // E key to talk
      if (e.code === 'KeyE') {
        handleInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeysPressed((prev) => ({ ...prev, [e.code]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [player, activeNpc, dialogue, revealedHints]);

  // Handle interaction E
  const handleInteraction = async () => {
    if (dialogue?.isOpen) {
      // Close dialogue
      setDialogue(null);
      setTypedText('');
      return;
    }

    if (activeNpc) {
      const idx = activeNpc.hintIndex;
      if (idx < revealedHints) {
        // Already unlocked
        triggerDialogue(hints[idx], false);
      } else if (idx === revealedHints) {
        // Next to unlock
        if (labStatus === 'running') {
          triggerDialogue(
            `Tôi giữ Gợi ý số ${idx + 1}. Mở khóa gợi ý này sẽ tiêu tốn ${points / 10} điểm. Bạn có đồng ý mở khóa không?`,
            true
          );
        } else {
          triggerDialogue('Bạn cần Khởi động Lab trước để mở khóa gợi ý này.', false);
        }
      } else {
        // Locked
        triggerDialogue(
          `Gợi ý này đã bị khóa. Hãy mở khóa gợi ý số ${revealedHints + 1} của ${npcs[revealedHints]?.name} trước!`,
          false
        );
      }
    }
  };

  const triggerDialogue = (text: string, showOptions: boolean) => {
    setDialogue({ isOpen: true, text, showOptions });
    setTypedText('');
    setTypingIndex(0);
  };

  // Typewriter effect
  useEffect(() => {
    if (dialogue && dialogue.isOpen && typingIndex < dialogue.text.length) {
      const timer = setTimeout(() => {
        setTypedText((prev) => prev + dialogue.text[typingIndex]);
        setTypingIndex((prev) => prev + 1);
      }, 15);
      return () => clearTimeout(timer);
    }
  }, [dialogue, typingIndex]);

  // Handle unlock confirm Yes
  const handleConfirmUnlock = async () => {
    if (onRevealHint) {
      try {
        setDialogue({ isOpen: true, text: 'Đang mở khóa gợi ý...', showOptions: false });
        setTypedText('Đang kết nối API bảo mật để giải mã dữ liệu...');
        await onRevealHint();
        // Wait a bit, then show the hint
        setTimeout(() => {
          triggerDialogue(hints[revealedHints], false);
        }, 1000);
      } catch (e: any) {
        triggerDialogue(`Lỗi khi mở gợi ý: ${e.message || 'Lỗi không xác định'}`, false);
      }
    }
  };

  // Game loop & physics updating
  useEffect(() => {
    let animationId: number;

    const updatePhysics = () => {
      // Don't move if dialogue is open
      if (dialogue?.isOpen) return;

      let dx = 0;
      let dy = 0;

      if (keysPressed['ArrowUp'] || keysPressed['KeyW']) dy = -player.speed;
      if (keysPressed['ArrowDown'] || keysPressed['KeyS']) dy = player.speed;
      if (keysPressed['ArrowLeft'] || keysPressed['KeyA']) dx = -player.speed;
      if (keysPressed['ArrowRight'] || keysPressed['KeyD']) dx = player.speed;

      if (dx !== 0 || dy !== 0) {
        // Diagonal speed correction
        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        let newX = player.x + dx;
        let newY = player.y + dy;

        // Boundary collision (800x480 map)
        if (newX < 12) newX = 12;
        if (newX > 800 - player.width - 12) newX = 800 - player.width - 12;
        if (newY < 12) newY = 12;
        if (newY > 480 - player.height - 12) newY = 480 - player.height - 12;

        // Obstacle collision check
        const playerBox = { x: newX, y: newY, width: player.width, height: player.height };
        let hasCollision = false;

        for (const obs of obstacles) {
          if (
            playerBox.x < obs.x + obs.width &&
            playerBox.x + playerBox.width > obs.x &&
            playerBox.y < obs.y + obs.height &&
            playerBox.y + playerBox.height > obs.y
          ) {
            hasCollision = true;
            break;
          }
        }

        // NPC collision check (cannot walk through NPCs)
        for (const npc of npcs) {
          if (
            playerBox.x < npc.x + npc.width &&
            playerBox.x + playerBox.width > npc.x &&
            playerBox.y < npc.y + npc.height &&
            playerBox.y + playerBox.height > npc.y
          ) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          setPlayer((prev) => ({ ...prev, x: newX, y: newY }));
        }
      }
    };

    const detectNpcProximity = () => {
      let closeNpc: Entity | null = null;
      for (const npc of npcs) {
        // Distance calculation
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const nx = npc.x + npc.width / 2;
        const ny = npc.y + npc.height / 2;
        const dist = Math.sqrt(Math.pow(px - nx, 2) + Math.pow(py - ny, 2));
        
        if (dist < 48) {
          closeNpc = npc;
          break;
        }
      }
      setActiveNpc(closeNpc);
    };

    const loop = () => {
      updatePhysics();
      detectNpcProximity();
      drawGame();
      animationId = requestAnimationFrame(loop);
    };

    const drawGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Clear background & draw grid pattern
      ctx.fillStyle = '#0b0f19'; // Retro dark navy
      ctx.fillRect(0, 0, 800, 480);

      // Grid line drawings
      ctx.strokeStyle = '#151e33';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let i = 0; i < 800; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 480);
        ctx.stroke();
      }
      for (let j = 0; j < 480; j += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(800, j);
        ctx.stroke();
      }

      // Outer room boundaries wall
      ctx.strokeStyle = '#2d4066';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 800 - 12, 480 - 12);

      // 2. Draw Obstacles
      obstacles.forEach((obs) => {
        // Draw server table base shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.width, obs.height);

        // Draw cabinet
        ctx.fillStyle = '#1e293b'; // Slate grey
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        if (obs.label.startsWith('Tủ Rack')) {
          // Draw server blades lines and flashing neon LED pixels
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x + 4, obs.y + 6, obs.width - 8, obs.height - 12);
          
          // Blade lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let ly = obs.y + 12; ly < obs.y + obs.height - 8; ly += 10) {
            ctx.beginPath();
            ctx.moveTo(obs.x + 8, ly);
            ctx.lineTo(obs.x + obs.width - 8, ly);
            ctx.stroke();

            // Flashing LEDs
            const seed = Math.sin(Date.now() * 0.005 + ly) * 10;
            ctx.fillStyle = seed > 5 ? '#00f2fe' : seed < -5 ? '#ff2d55' : '#00a3ff';
            ctx.fillRect(obs.x + 10, ly - 3, 3, 3);
            ctx.fillStyle = seed > 2 ? '#27c93f' : '#10b981';
            ctx.fillRect(obs.x + 16, ly - 3, 3, 3);
          }
        } else {
          // Console desks
          ctx.fillStyle = '#38bdf8'; // Blue screen light glow
          ctx.fillRect(obs.x + 12, obs.y + 6, obs.width - 24, 4);
          ctx.fillStyle = '#475569';
          ctx.font = '9px monospace';
          ctx.fillText('CONSOLE', obs.x + 16, obs.y + 24);
        }
      });

      // 3. Draw NPCs
      npcs.forEach((npc) => {
        // Draw glowing aura under NPC
        const isLocked = npc.hintIndex > revealedHints;
        const isUnlockable = npc.hintIndex === revealedHints;
        
        ctx.beginPath();
        ctx.arc(npc.x + npc.width / 2, npc.y + npc.height / 2 + 10, 16, 0, Math.PI * 2);
        ctx.fillStyle = isLocked 
          ? 'rgba(71,85,105,0.2)' 
          : isUnlockable 
            ? 'rgba(250,204,21,0.25)' 
            : 'rgba(0,242,254,0.25)';
        ctx.fill();

        // Draw shadow ring border
        ctx.strokeStyle = isLocked ? '#475569' : isUnlockable ? '#fac015' : '#00f2fe';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw emoji avatar
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          isLocked ? '🔒' : npc.avatar, 
          npc.x + npc.width / 2, 
          npc.y + npc.height / 2
        );

        // Draw tag text above NPC
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px monospace';
        ctx.fillText(
          isLocked ? 'Gợi ý bị khóa' : npc.name.split(' (')[0],
          npc.x + npc.width / 2,
          npc.y - 12
        );
      });

      // 4. Draw Player
      // Player shadow
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2 + 10, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Draw hacker player
      ctx.fillStyle = '#10b981'; // Cyber emerald green hoodie
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Face
      ctx.fillStyle = '#ffdbb5';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2 + 2, 6, 0, Math.PI * 2);
      ctx.fill();

      // Hoodie hood top
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2 - 2, 8, Math.PI, 0);
      ctx.fill();

      // Sunglasses
      ctx.fillStyle = '#000';
      ctx.fillRect(player.x + player.width / 2 - 5, player.y + player.height / 2, 4, 3);
      ctx.fillRect(player.x + player.width / 2 + 1, player.y + player.height / 2, 4, 3);
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2 - 1, player.y + player.height / 2 + 1);
      ctx.lineTo(player.x + player.width / 2 + 1, player.y + player.height / 2 + 1);
      ctx.stroke();

      // Glowing laptop in hand
      ctx.fillStyle = '#00f2fe';
      ctx.fillRect(player.x + player.width / 2 - 4, player.y + player.height / 2 + 8, 8, 4);

      // Player name tag
      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.fillText('HACKER', player.x + player.width / 2, player.y - 12);

      // 5. Draw interactive prompt indicator bubble
      if (activeNpc) {
        const text = isMobile ? 'Chạm để nói chuyện' : 'Ấn [E] để nói chuyện';
        ctx.fillStyle = 'rgba(16,185,129,0.95)';
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.5;
        
        // Render speech bubble shape
        const bx = player.x + player.width / 2 - 60;
        const by = player.y - 48;
        const bw = 120;
        const bh = 22;
        
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);

        // Arrow pointer pointing to player
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2 - 6, by + bh);
        ctx.lineTo(bx + bw / 2, by + bh + 6);
        ctx.lineTo(bx + bw / 2 + 6, by + bh);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16,185,129,0.95)';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(text, player.x + player.width / 2, by + bh / 2 + 1);
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [player, activeNpc, dialogue, revealedHints]);

  // Mobile controller touch pad triggers
  const handleTouchStart = (dir: string) => {
    setKeysPressed((prev) => ({ ...prev, [dir]: true }));
  };

  const handleTouchEnd = (dir: string) => {
    setKeysPressed((prev) => ({ ...prev, [dir]: false }));
  };

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* Game Screen Container */}
      <div style={{
        position: 'relative',
        background: '#020617',
        border: '3px solid var(--border-default)',
        borderRadius: 'var(--radius-base)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Canvas Screen */}
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          onClick={() => activeNpc && handleInteraction()}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
          }}
        />

        {/* Scanlines overlay effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          opacity: 0.4,
        }}></div>

        {/* HUD Score Overlay */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '6px 12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border-default-medium)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: '#38bdf8',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} /> Points: {points}
          </span>
          <span style={{ color: 'var(--text-body-subtle)' }}>|</span>
          <span>Unlocked Hints: {revealedHints}/{hints.length}</span>
        </div>

        {/* Retro monospaced Dialog Overlay */}
        {dialogue?.isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${activeNpc?.color || 'var(--border-default)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            display: 'flex',
            gap: '16px',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          }}>
            {/* NPC Avatar */}
            <div style={{
              width: '54px',
              height: '54px',
              background: 'rgba(0,0,0,0.3)',
              border: `2px solid ${activeNpc?.color || 'var(--border-default)'}`,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0,
            }}>
              {activeNpc?.avatar || '❓'}
            </div>

            {/* Dialogue text box */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: activeNpc?.color || 'var(--text-heading)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {activeNpc?.name || 'Hacker Guide'}
              </div>
              <p style={{
                fontSize: '13px',
                color: '#f8fafc',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.55,
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {typedText}
                {typingIndex < dialogue.text.length && (
                  <span style={{ display: 'inline-block', width: '6px', height: '12px', background: '#fff', marginLeft: '2px', animation: 'blink 0.8s step-end infinite' }}></span>
                )}
              </p>

              {/* Unlock Yes/No Dialog Prompt Options */}
              {dialogue.showOptions && typingIndex >= dialogue.text.length && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleConfirmUnlock}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      padding: '4px 16px',
                    }}
                  >
                    Có, mua gợi ý (-{points / 10} pts)
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDialogue(null);
                      setTypedText('');
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      padding: '4px 16px',
                    }}
                  >
                    Để sau
                  </button>
                </div>
              )}

              {/* Press enter/click to close instruction */}
              {!dialogue.showOptions && typingIndex >= dialogue.text.length && (
                <div 
                  onClick={handleInteraction}
                  style={{
                    alignSelf: 'flex-end',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-body-subtle)',
                    marginTop: '8px',
                    cursor: 'pointer',
                    animation: 'pulse-glow 1.5s infinite',
                  }}
                >
                  {isMobile ? '[ Chạm vào đây để đóng ]' : '[ Ấn E hoặc Click để đóng ]'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile controls: touch arrow buttons overlay */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 42px)',
            gridTemplateRows: 'repeat(3, 42px)',
            gap: '4px',
            zIndex: 10,
          }}>
            <div></div>
            <button
              onTouchStart={() => handleTouchStart('KeyW')}
              onTouchEnd={() => handleTouchEnd('KeyW')}
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ArrowUp size={20} />
            </button>
            <div></div>

            <button
              onTouchStart={() => handleTouchStart('KeyA')}
              onTouchEnd={() => handleTouchEnd('KeyA')}
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onTouchStart={handleInteraction}
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(16, 185, 129, 0.85)',
                border: '1px solid #059669',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                fontSize: '14px',
              }}
            >
              E
            </button>
            <button
              onTouchStart={() => handleTouchStart('KeyD')}
              onTouchEnd={() => handleTouchEnd('KeyD')}
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ArrowRight size={20} />
            </button>

            <div></div>
            <button
              onTouchStart={() => handleTouchStart('KeyS')}
              onTouchEnd={() => handleTouchEnd('KeyS')}
              style={{
                width: '42px',
                height: '42px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <ArrowDown size={20} />
            </button>
            <div></div>
          </div>
        )}
      </div>

      {/* On-screen controls instructions */}
      {!isMobile && (
        <div style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-body-subtle)',
          fontFamily: 'var(--font-mono)',
        }}>
          Điều khiển: Di chuyển bằng phím <strong style={{ color: 'var(--fg-brand)' }}>WASD</strong> hoặc <strong style={{ color: 'var(--fg-brand)' }}>Mũi tên</strong>. Ấn phím <strong style={{ color: 'var(--fg-brand)' }}>E</strong> khi ở gần NPC để trò chuyện.
        </div>
      )}
    </div>
  );
}
