'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import LabSimulator from '@/components/LabSimulator';

interface LabGameViewProps {
  hints: string[];
  revealedHints: number;
  onRevealHint: () => Promise<void>;
  points: number;
  labStatus: 'idle' | 'starting' | 'running' | 'completed';
  onSubmitFlag: (flag: string) => Promise<void>;
  flagResult: 'correct' | 'wrong' | null;
  vulnerabilityName: string;
  isSimulated?: boolean;
  dockerPort?: number;
  containerPort?: number;
  apiError?: string | null;
  onSimulatedSuccess?: (flag: string) => void;
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

export default function LabGameView({ 
  hints, 
  revealedHints, 
  onRevealHint, 
  points, 
  labStatus, 
  onSubmitFlag, 
  flagResult,
  vulnerabilityName,
  isSimulated,
  dockerPort,
  containerPort,
  apiError,
  onSimulatedSuccess
}: LabGameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game engine refs (for 60fps lag-free rendering and zero stale closures)
  const playerRef = useRef({ x: 400, y: 240, speed: 4.5, width: 24, height: 24 });
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const activeNpcRef = useRef<Entity | null>(null);
  
  // UI states (for React dialog overlay)
  const [dialogue, setDialogue] = useState<{ isOpen: boolean; text: string; showOptions: boolean } | null>(null);
  const [typedText, setTypedText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [uiActiveNpcName, setUiActiveNpcName] = useState<string | null>(null);
  const dialogueIsOpenRef = useRef(false);

  // In-game Flag overlay states
  const [isFlagOverlayOpen, setIsFlagOverlayOpen] = useState(false);
  const [localFlag, setLocalFlag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-game Vulnerable Server Console Modal state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  // Redraw state triggers to sync active label states in React
  const [activeNpcNameState, setActiveNpcNameState] = useState<string | null>(null);

  // Reset overlay when flagResult changes
  useEffect(() => {
    if (flagResult === 'correct') {
      setIsSubmitting(false);
    } else if (flagResult === 'wrong') {
      setIsSubmitting(false);
    }
  }, [flagResult]);

  // Map obstacles definitions (bounding boxes)
  const obstacles = [
    { x: 100, y: 150, width: 120, height: 40, label: 'Bàn Server A' },
    { x: 580, y: 150, width: 120, height: 40, label: 'Bàn Server B' },
    { x: 280, y: 80, width: 240, height: 30, label: 'Bàn Console Trung Tâm' },
    { x: 200, y: 320, width: 60, height: 100, label: 'Tủ Rack 1' },
    { x: 540, y: 320, width: 60, height: 100, label: 'Tủ Rack 2' },
  ];

  // Base mentors array based on hints length
  const baseMentors = [
    {
      x: 160,
      y: 120,
      width: 24,
      height: 24,
      name: '2. Gợi ý 1',
      avatar: '',
      color: '#00a3ff',
      hintIndex: 0,
    },
    {
      x: 640,
      y: 120,
      width: 24,
      height: 24,
      name: '3. Gợi ý 2',
      avatar: '',
      color: '#ff2d55',
      hintIndex: 1,
    },
    {
      x: 400,
      y: 350,
      width: 24,
      height: 24,
      name: '4. Gợi ý 3',
      avatar: '',
      color: '#af52de',
      hintIndex: 2,
    },
  ].slice(0, hints.length);

  // Dynamic names for interactive workflow steps
  const practiceStepNum = 2 + hints.length;
  const submitStepNum = 3 + hints.length;

  const npcs: Entity[] = [
    ...baseMentors,
    {
      x: 240,
      y: 85,
      width: 24,
      height: 24,
      name: '1. Nhiệm vụ',
      avatar: '',
      color: '#eab308',
      hintIndex: 99,
    },
    {
      x: 400,
      y: 85,
      width: 24,
      height: 24,
      name: `${practiceStepNum}. Thực hành`,
      avatar: '',
      color: '#38bdf8',
      hintIndex: 98,
    },
    {
      x: 560,
      y: 85,
      width: 24,
      height: 24,
      name: `${submitStepNum}. Nộp FLAG`,
      avatar: '',
      color: '#10b981',
      hintIndex: 100,
    }
  ];

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  // Handle interaction E
  const handleInteraction = () => {
    const npc = activeNpcRef.current;
    if (!npc) return;

    if (dialogueIsOpenRef.current && dialogue) {
      if (typingIndex < dialogue.text.length) {
        setTypedText(dialogue.text);
        setTypingIndex(dialogue.text.length);
      } else {
        setDialogue(null);
        dialogueIsOpenRef.current = false;
        setTypedText('');
      }
      return;
    }

    // Special NPC: Mission Board
    if (npc.hintIndex === 99) {
      triggerDialogue(
        `NHIỆM VỤ BÀI THỰC HÀNH:\n\n1. Di chuyển lại gần máy tính "${practiceStepNum}. Thực hành" ở giữa và tương tác để thực hành khai thác lỗ hổng [${vulnerabilityName}].\n\n2. Trích xuất mã cờ bí mật (FLAG).\n\n3. Đến Thiết Bị "${submitStepNum}. Nộp FLAG" bên phải để nộp bài!`,
        false
      );
      return;
    }

    // Special NPC: Vulnerable App Server Console
    if (npc.hintIndex === 98) {
      setIsServerModalOpen(true);
      return;
    }

    // Special NPC: Flag Submission Terminal
    if (npc.hintIndex === 100) {
      setIsFlagOverlayOpen(true);
      return;
    }

    // Standard mentors (Hints)
    const idx = npc.hintIndex;
    if (idx < revealedHints) {
      triggerDialogue(hints[idx], false);
    } else if (idx === revealedHints) {
      if (labStatus === 'running') {
        triggerDialogue(
          `Tôi giữ Gợi ý số ${idx + 1}. Mở khóa gợi ý này sẽ tiêu tốn ${points / 10} điểm. Bạn có đồng ý mở khóa không?`,
          true
        );
      } else {
        triggerDialogue('Bạn cần Khởi động Lab trước để mở khóa gợi ý này.', false);
      }
    } else {
      triggerDialogue(
        `Gợi ý này đã bị khóa. Hãy mở khóa gợi ý số ${revealedHints + 1} của Mentor trước!`,
        false
      );
    }
  };

  const triggerDialogue = (text: string, showOptions: boolean) => {
    setDialogue({ isOpen: true, text, showOptions });
    dialogueIsOpenRef.current = true;
    setTypedText('');
    setTypingIndex(0);
  };

  // Typewriter effect
  useEffect(() => {
    if (dialogue && dialogue.isOpen && typingIndex < dialogue.text.length) {
      const timer = setTimeout(() => {
        setTypedText((prev) => prev + dialogue.text[typingIndex]);
        setTypingIndex((prev) => prev + 1);
      }, 12);
      return () => clearTimeout(timer);
    }
  }, [dialogue, typingIndex]);

  // Handle unlock confirm Yes
  const handleConfirmUnlock = async () => {
    if (onRevealHint) {
      try {
        setDialogue({ isOpen: true, text: 'Đang mở khóa gợi ý...', showOptions: false });
        setTypedText('Đang giải mã dữ liệu gợi ý từ máy chủ...');
        await onRevealHint();
        setTimeout(() => {
          triggerDialogue(hints[revealedHints], false);
        }, 800);
      } catch (e: any) {
        triggerDialogue(`Lỗi: ${e.message || 'Không thể mở gợi ý'}`, false);
      }
    }
  };

  const handleFlagSubmit = async () => {
    if (!localFlag.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitFlag(localFlag);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  // Game loop & physics updating
  useEffect(() => {
    let animationId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      keysPressedRef.current[e.code] = true;
      keysPressedRef.current[e.key.toLowerCase()] = true;
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        if (!isTyping) {
          e.preventDefault();
        }
      }

      // Handle Escape key to close dialogue, flag overlay, or server modal
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (dialogueIsOpenRef.current) {
          setDialogue(null);
          dialogueIsOpenRef.current = false;
          setTypedText('');
        }
        if (isFlagOverlayOpen) {
          setIsFlagOverlayOpen(false);
        }
        if (isServerModalOpen) {
          setIsServerModalOpen(false);
        }
        return;
      }

      if (e.code === 'KeyE' || e.key.toLowerCase() === 'e') {
        if (isTyping) return;
        
        if (isFlagOverlayOpen) {
          setIsFlagOverlayOpen(false);
        } else if (isServerModalOpen) {
          // ESC closes server modal to allow typing inside simulation
        } else {
          handleInteraction();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
      keysPressedRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const updatePhysics = () => {
      if (dialogueIsOpenRef.current || isFlagOverlayOpen || isServerModalOpen) return;

      let dx = 0;
      let dy = 0;

      const keys = keysPressedRef.current;
      if (keys['ArrowUp'] || keys['KeyW'] || keys['w'] || keys['u']) dy = -playerRef.current.speed;
      if (keys['ArrowDown'] || keys['KeyS'] || keys['s']) dy = playerRef.current.speed;
      if (keys['ArrowLeft'] || keys['KeyA'] || keys['a']) dx = -playerRef.current.speed;
      if (keys['ArrowRight'] || keys['KeyD'] || keys['d']) dx = playerRef.current.speed;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // SLIDING COLLISION PHYSICS (X and Y resolved independently)
      if (dx !== 0) {
        let newX = playerRef.current.x + dx;
        if (newX < 15) newX = 15;
        if (newX > 800 - playerRef.current.width - 15) newX = 800 - playerRef.current.width - 15;

        const playerBoxX = { x: newX, y: playerRef.current.y, width: playerRef.current.width, height: playerRef.current.height };
        let collidesX = false;

        for (const obs of obstacles) {
          if (
            playerBoxX.x < obs.x + obs.width &&
            playerBoxX.x + playerBoxX.width > obs.x &&
            playerBoxX.y < obs.y + obs.height &&
            playerBoxX.y + playerBoxX.height > obs.y
          ) {
            collidesX = true;
            break;
          }
        }

        for (const npc of npcs) {
          if (
            playerBoxX.x < npc.x + npc.width &&
            playerBoxX.x + playerBoxX.width > npc.x &&
            playerBoxX.y < npc.y + npc.height &&
            playerBoxX.y + playerBoxX.height > npc.y
          ) {
            collidesX = true;
            break;
          }
        }

        if (!collidesX) {
          playerRef.current.x = newX;
        }
      }

      if (dy !== 0) {
        let newY = playerRef.current.y + dy;
        if (newY < 15) newY = 15;
        if (newY > 480 - playerRef.current.height - 15) newY = 480 - playerRef.current.height - 15;

        const playerBoxY = { x: playerRef.current.x, y: newY, width: playerRef.current.width, height: playerRef.current.height };
        let collidesY = false;

        for (const obs of obstacles) {
          if (
            playerBoxY.x < obs.x + obs.width &&
            playerBoxY.x + playerBoxY.width > obs.x &&
            playerBoxY.y < obs.y + obs.height &&
            playerBoxY.y + playerBoxY.height > obs.y
          ) {
            collidesY = true;
            break;
          }
        }

        for (const npc of npcs) {
          if (
            playerBoxY.x < npc.x + npc.width &&
            playerBoxY.x + playerBoxY.width > npc.x &&
            playerBoxY.y < npc.y + npc.height &&
            playerBoxY.y + playerBoxY.height > npc.y
          ) {
            collidesY = true;
            break;
          }
        }

        if (!collidesY) {
          playerRef.current.y = newY;
        }
      }
    };

    const detectNpcProximity = () => {
      let closeNpc: Entity | null = null;
      const p = playerRef.current;
      
      for (const npc of npcs) {
        const px = p.x + p.width / 2;
        const py = p.y + p.height / 2;
        const nx = npc.x + npc.width / 2;
        const ny = npc.y + npc.height / 2;
        
        const dist = Math.sqrt(Math.pow(px - nx, 2) + Math.pow(py - ny, 2));
        if (dist < 48) {
          closeNpc = npc;
          break;
        }
      }

      activeNpcRef.current = closeNpc;
      const name = closeNpc ? closeNpc.name : null;
      setUiActiveNpcName(name);
      setActiveNpcNameState(name);
    };

    // Helper to draw text with a solid dark outline inside canvas
    const drawTextWithOutline = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, textColor: string) => {
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.strokeText(text, x, y);
      ctx.fillStyle = textColor;
      ctx.fillText(text, x, y);
    };

    // Helper to draw a dashed flowing arrow showing step direction
    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -Math.floor(Date.now() * 0.018) % 16;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
      ctx.setLineDash([]);

      const angle = Math.atan2(toY - fromY, toX - fromX);
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX - 9 * Math.cos(angle - Math.PI / 6), midY - 9 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(midX - 9 * Math.cos(angle + Math.PI / 6), midY - 9 * Math.sin(angle + Math.PI / 6));
      ctx.fill();
    };

    const drawGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw Cyberpunk/Matrix Dark Grid & Radar Sweep
      ctx.fillStyle = '#060a13'; // Deep rich cyber navy
      ctx.fillRect(0, 0, 800, 480);

      // Radar Pulse in center
      const radarPulse = 220 + Math.sin(Date.now() * 0.0035) * 35;
      const radarGlow = ctx.createRadialGradient(400, 240, 10, 400, 240, radarPulse);
      radarGlow.addColorStop(0, 'rgba(8, 47, 73, 0.18)');
      radarGlow.addColorStop(1, 'rgba(6, 10, 19, 0)');
      ctx.fillStyle = radarGlow;
      ctx.beginPath();
      ctx.arc(400, 240, radarPulse, 0, Math.PI * 2);
      ctx.fill();

      // Blueprint style grid and crosses
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= 800; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 480);
      }
      for (let y = 0; y <= 480; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
      }
      ctx.stroke();

      // Draw subtle intersection crosses (+)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1.2;
      for (let x = gridSize; x < 800; x += gridSize) {
        for (let y = gridSize; y < 480; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      // Scanner Scanline sweep
      const scanY = (Date.now() * 0.065) % 480;
      const scanGrad = ctx.createLinearGradient(0, scanY - 18, 0, scanY);
      scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0.07)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 18, 800, 18);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(800, scanY);
      ctx.stroke();

      // Cyber room outer border
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 800 - 6, 480 - 6);

      // 2. Draw animated flowing arrow paths connecting objects
      const pathPoints = [
        { x: 240 + 12, y: 85 + 12 }, // 1. Nhiệm vụ
      ];
      baseMentors.forEach((m) => {
        pathPoints.push({ x: m.x + 12, y: m.y + 12 });
      });
      pathPoints.push({ x: 400 + 12, y: 85 + 12 }); // 3. Thực hành
      pathPoints.push({ x: 560 + 12, y: 85 + 12 }); // 4. Nộp FLAG

      for (let i = 0; i < pathPoints.length - 1; i++) {
        drawArrow(ctx, pathPoints[i].x, pathPoints[i].y, pathPoints[i + 1].x, pathPoints[i + 1].y, 'rgba(56, 189, 248, 0.5)');
      }

      // 3. Draw pulsing glowing auras under entities
      npcs.forEach((npc) => {
        const isSpecial = npc.hintIndex >= 98;
        const isUnlockable = !isSpecial && npc.hintIndex === revealedHints;
        
        const glowPulse = Math.sin(Date.now() * 0.005 + npc.hintIndex * 1.7) * 4 + 18;
        const radialGlow = ctx.createRadialGradient(
          npc.x + npc.width / 2, npc.y + npc.height / 2 + 10, 2,
          npc.x + npc.width / 2, npc.y + npc.height / 2 + 10, glowPulse
        );
        radialGlow.addColorStop(0, npc.color + '44');
        radialGlow.addColorStop(1, npc.color + '00');
        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(npc.x + npc.width / 2, npc.y + npc.height / 2 + 10, glowPulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Extra pulsing outer ring for unlocked mentor hints
        if (isUnlockable) {
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(npc.x + npc.width / 2, npc.y + npc.height / 2 + 10, glowPulse + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Ambient pulsing light under player
      const p = playerRef.current;
      const playerGlowRad = Math.sin(Date.now() * 0.007) * 3 + 24;
      const playerGlow = ctx.createRadialGradient(p.x + 12, p.y + 12, 2, p.x + 12, p.y + 12, playerGlowRad);
      playerGlow.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
      playerGlow.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(p.x + 12, p.y + 12, playerGlowRad, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw Obstacles (with premium Glassmorphic + Neon details)
      obstacles.forEach((obs) => {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(obs.x + 4, obs.y + 4, obs.width, obs.height);

        // Glassmorphic Body
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // Transparent slate-900
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        // Neon borders
        ctx.strokeStyle = obs.label.startsWith('Tủ Rack') ? 'rgba(71, 85, 105, 0.6)' : 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        if (obs.label.startsWith('Tủ Rack')) {
          // Tech lines / Server cabinet slots
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.9)';
          ctx.lineWidth = 1.5;
          for (let ly = obs.y + 10; ly < obs.y + obs.height - 6; ly += 9) {
            ctx.beginPath();
            ctx.moveTo(obs.x + 6, ly);
            ctx.lineTo(obs.x + obs.width - 6, ly);
            ctx.stroke();

            // Blinking server LEDs
            const flashVal = Math.sin(Date.now() * 0.006 + ly) * 10;
            ctx.fillStyle = flashVal > 5 ? '#22c55e' : flashVal < -5 ? '#ef4444' : '#3b82f6';
            ctx.fillRect(obs.x + 10, ly - 2, 2.5, 2.5);
            ctx.fillStyle = flashVal > 0 ? '#10b981' : '#475569';
            ctx.fillRect(obs.x + 16, ly - 2, 2.5, 2.5);
          }
          // Server glass gleam
          const gleamGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
          gleamGrad.addColorStop(0.1, 'rgba(255, 255, 255, 0)');
          gleamGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.06)');
          gleamGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gleamGrad;
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        } else {
          // Dynamic status screen wave charts on Console Desks
          ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
          ctx.fillRect(obs.x + 10, obs.y + 6, obs.width - 20, obs.height - 12);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.strokeRect(obs.x + 10, obs.y + 6, obs.width - 20, obs.height - 12);

          // Moving grid/graph lines
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let gx = 0; gx < obs.width - 24; gx += 3) {
            const gy = Math.sin(Date.now() * 0.007 + (gx + obs.x) * 0.15) * 5 + obs.y + obs.height / 2;
            if (gx === 0) ctx.moveTo(obs.x + 12 + gx, gy);
            else ctx.lineTo(obs.x + 12 + gx, gy);
          }
          ctx.stroke();

          // Console header outline
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(obs.label.toUpperCase(), obs.x + obs.width / 2, obs.y + obs.height - 10);
        }
      });

      // 5. Draw NPCs & Kiosks (Procedural holographic tech sprites)
      npcs.forEach((npc) => {
        if (npc.hintIndex === 99) {
          // 1. Mission Kiosk Board
          // Stand
          ctx.fillStyle = '#475569';
          ctx.fillRect(npc.x + 9, npc.y + 14, 6, 8);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(npc.x + 4, npc.y + 22, 16, 2);

          // Hologram frame
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.fillRect(npc.x + 2, npc.y, 20, 14);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(npc.x + 2, npc.y, 20, 14);

          // Glowing holographic lines
          const hLine = (Date.now() * 0.02) % 10;
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(npc.x + 4, npc.y + 2 + hLine);
          ctx.lineTo(npc.x + 20, npc.y + 2 + hLine);
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(npc.x + 6, npc.y + 4, 3, 3);
          ctx.fillStyle = 'rgba(234,179,8,0.7)';
          ctx.fillRect(npc.x + 11, npc.y + 6, 7, 2);
        } else if (npc.hintIndex === 98) {
          // 3. CRT Practice Server Terminal
          ctx.fillStyle = '#334155';
          ctx.fillRect(npc.x + 2, npc.y + 2, 20, 20);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.strokeRect(npc.x + 2, npc.y + 2, 20, 20);

          // CRT Terminal screen glowing neon blue
          ctx.fillStyle = '#020617';
          ctx.fillRect(npc.x + 4, npc.y + 4, 16, 10);
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(npc.x + 4, npc.y + 4, 16, 10);

          // Interactive terminal scan lines
          const pulse = Math.sin(Date.now() * 0.015) * 3;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
          ctx.fillRect(npc.x + 6 + (pulse > 0 ? 1 : 0), npc.y + 6, 8, 1);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.fillRect(npc.x + 6, npc.y + 9, 10, 1);

          // Keyboardshelf
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(npc.x, npc.y + 15, 24, 3);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(npc.x + 5, npc.y + 16, 14, 1);
        } else if (npc.hintIndex === 100) {
          // 4. Flag Validator Terminal Kiosk
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(npc.x + 3, npc.y + 2, 18, 20);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.strokeRect(npc.x + 3, npc.y + 2, 18, 20);

          // Bio slot
          ctx.fillStyle = '#020617';
          ctx.fillRect(npc.x + 6, npc.y + 13, 12, 2.5);

          // Glowing status monitor
          const pulseDisk = Math.sin(Date.now() * 0.01) * 10;
          ctx.fillStyle = pulseDisk > 0 ? '#10b981' : '#059669';
          ctx.fillRect(npc.x + 6, npc.y + 4, 12, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(npc.x + 8, npc.y + 5, 2, 2);
        } else {
          // Mentors (Hooded Hacker Wizard with neon trims & glowing eyes)
          // Hoodie Body
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(npc.x + 4, npc.y + 8, 16, 13);
          
          ctx.strokeStyle = npc.color;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(npc.x + 4, npc.y + 8, 16, 13);

          // Neon wizard hood
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(npc.x + 12, npc.y + 6, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = npc.color;
          ctx.stroke();

          // Dark face cavity
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(npc.x + 12, npc.y + 7, 5, 0, Math.PI * 2);
          ctx.fill();

          // Glowing neon eyes
          const eyePulse = Math.sin(Date.now() * 0.01) > 0 ? npc.color : 'rgba(255,255,255,0.2)';
          ctx.fillStyle = eyePulse;
          ctx.fillRect(npc.x + 9, npc.y + 6, 2, 2);
          ctx.fillRect(npc.x + 13, npc.y + 6, 2, 2);
        }
      });

      // 6. Draw Player (Cyber Astronaut Sprite with Hovering Animation)
      const hoverOffset = Math.sin(Date.now() * 0.0055) * 2.5;
      const py = p.y + hoverOffset;

      // Drop shadow on floor under the astronaut (shrinks/grows with hovering)
      const shadowScale = 1 - (hoverOffset / 12);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(p.x + 12, p.y + 21, 9 * shadowScale, 3 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Backpack
      ctx.fillStyle = '#047857';
      ctx.fillRect(p.x + 2, py + 8, 4, 11);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(p.x + 2, py + 9, 3, 9);

      // Cyber suit body
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(p.x + 6, py + 8, 12, 11);
      
      // Neon green lining
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 6, py + 8, 12, 11);

      // Cybernetic core light
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(p.x + 11, py + 13, 2, 2);

      // Space boots
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x + 6, py + 19, 4, 3);
      ctx.fillRect(p.x + 14, py + 19, 4, 3);

      // Matte dark helmet
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(p.x + 12, py + 6, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      // Visor glowing bright neon green
      ctx.fillStyle = 'rgba(34, 197, 94, 0.95)';
      ctx.fillRect(p.x + 8, py + 4, 9, 4);

      // Visor light reflection gleam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + 14, py + 4, 2, 1);

      // Simple Sharp "YOU" label drawn on canvas directly above head
      drawTextWithOutline(ctx, 'BẠN', p.x + p.width / 2, py - 6, '#4ade80');
    };

    const renderLoop = () => {
      updatePhysics();
      detectNpcProximity();
      drawGame();
      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [revealedHints, hints, points, labStatus, isFlagOverlayOpen, isServerModalOpen]);

  const handleTouchStart = (key: string) => {
    keysPressedRef.current[key] = true;
  };

  const handleTouchEnd = (key: string) => {
    keysPressedRef.current[key] = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeNpcRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 800;
      const clickY = ((e.clientY - rect.top) / rect.height) * 480;

      const npc = activeNpcRef.current;
      const npcCenterX = npc.x + npc.width / 2;
      const npcCenterY = npc.y + npc.height / 2;
      
      const distance = Math.sqrt(Math.pow(clickX - npcCenterX, 2) + Math.pow(clickY - npcCenterY, 2));
      if (distance < 50) {
        handleInteraction();
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <div style={{
        position: 'relative',
        background: '#020617',
        border: '3px solid var(--border-default)',
        borderRadius: 'var(--radius-base)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Render Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
            cursor: uiActiveNpcName ? 'pointer' : 'default',
          }}
        />

        {/* 100% SHARP HTML OVERLAY LABELS (Renders on native screen resolution, crystal clear!) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Lets mouse events pass through to canvas
        }}>
          {npcs.map((npc) => {
            const isCurrentActive = activeNpcNameState === npc.name;
            const isSpecial = npc.hintIndex >= 98;
            const isUnlockable = !isSpecial && npc.hintIndex === revealedHints;
            
            // Calculate percentage coords mapping to 800x480 canvas aspect ratio
            const leftPct = ((npc.x + npc.width / 2) / 800) * 100;
            const topPct = (npc.y / 480) * 100;

            return (
              <div
                key={npc.name}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: 'translate(-50%, -105%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  zIndex: isCurrentActive ? 30 : 20,
                  transition: 'all 0.15s ease',
                }}
              >
                {isUnlockable && (
                  <div style={{
                    fontSize: '8px',
                    fontFamily: 'var(--font-mono)',
                    color: '#eab308',
                    background: 'rgba(234, 179, 8, 0.12)',
                    border: '1px solid #eab308',
                    borderRadius: '3px',
                    padding: '1px 4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    marginBottom: '1px',
                    boxShadow: '0 0 8px rgba(234,179,8,0.2)',
                  }}>
                    Gợi ý mở
                  </div>
                )}

                <div style={{
                  background: isCurrentActive ? 'rgba(9, 13, 22, 0.95)' : 'rgba(9, 13, 22, 0.75)',
                  border: isCurrentActive 
                    ? `1.5px solid ${npc.color}` 
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  color: isCurrentActive ? '#ffffff' : '#cbd5e1',
                  whiteSpace: 'nowrap',
                  boxShadow: isCurrentActive 
                    ? `0 0 12px ${npc.color}55` 
                    : '0 2px 5px rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(2px)',
                }}>
                  {npc.name}
                </div>

                {isCurrentActive && (
                  <div style={{
                    fontSize: '8px',
                    fontFamily: 'var(--font-mono)',
                    color: '#ffffff',
                    background: npc.color,
                    borderRadius: '3px',
                    padding: '1px 5px',
                    fontWeight: 900,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    marginTop: '1px',
                  }}>
                    {isMobile ? 'CHẠM ĐỂ CHỌN' : 'ẤN PHÍM E'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scanline CRT overlay filter */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          opacity: 0.25,
        }}></div>

        {/* HUD Info bar */}
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
          <span>Points: {points}</span>
          <span style={{ color: 'var(--text-body-subtle)' }}>|</span>
          <span>Gợi ý mở: {revealedHints}/{hints.length}</span>
        </div>

        {/* In-Game Dialogue window overlay */}
        {dialogue?.isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: `2px solid ${activeNpcRef.current?.color || 'var(--border-default)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6)',
          }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: activeNpcRef.current?.color || 'var(--text-heading)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {activeNpcRef.current?.name || 'Hacker Guide'}
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

              {dialogue.showOptions && typingIndex >= dialogue.text.length && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleConfirmUnlock}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 16px' }}
                  >
                    Đồng ý (-{points / 10} pts)
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDialogue(null);
                      dialogueIsOpenRef.current = false;
                      setTypedText('');
                    }}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '4px 16px' }}
                  >
                    Bỏ qua
                  </button>
                </div>
              )}

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
                  {isMobile ? '[ Chạm để đóng ]' : '[ Ấn E hoặc Click để đóng ]'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flag Submission Terminal Overlay */}
        {isFlagOverlayOpen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 23, 42, 0.96)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '24px',
            width: '360px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 110,
            color: '#e2e8f0',
            fontFamily: 'var(--font-mono)',
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '8px' }}>
              THIẾT BỊ NỘP FLAG
            </h4>
            
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Nhập mã flag thu thập được từ bài lab để tiến hành xác thực hệ thống.
            </p>

            <input
              type="text"
              value={localFlag}
              onChange={(e) => {
                setLocalFlag(e.target.value);
              }}
              placeholder="FLAG{...}"
              style={{
                width: '100%',
                background: '#090d16',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '16px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleFlagSubmit();
                }
              }}
            />

            {flagResult === 'correct' && (
              <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✓ Hệ thống xác thực THÀNH CÔNG! (+{points}đ)
              </div>
            )}
            {flagResult === 'wrong' && (
              <div style={{ color: '#ff2d55', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✗ SAI LỆCH MÃ! Vui lòng thử lại.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsFlagOverlayOpen(false);
                }}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                Đóng
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleFlagSubmit}
                disabled={isSubmitting || !localFlag.trim() || labStatus === 'completed'}
                style={{ fontSize: '12px', padding: '6px 16px', background: '#10b981', border: 'none' }}
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác thực'}
              </button>
            </div>
          </div>
        )}

        {/* In-Game Vulnerable Server Console Overlay */}
        {isServerModalOpen && (
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            width: '90%',
            height: '90%',
            background: '#ffffff',
            border: '2px solid var(--border-default)',
            borderRadius: '12px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            zIndex: 120,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            userSelect: 'text', // Allow drag-select text inside the server modal!
          }}>
            {/* Custom browser header */}
            <div style={{ background: 'var(--bg-neutral-tertiary)', borderBottom: '1px solid var(--border-default)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
              </div>
              <div style={{ background: 'var(--bg-neutral-secondary-medium)', border: '1px solid var(--border-default-medium)', borderRadius: '4px', padding: '3px 16px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-body-subtle)', flex: 1, textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
                http://localhost:{containerPort}
              </div>
              <button
                onClick={() => setIsServerModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-body-subtle)',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Application Practice Frame */}
            <div style={{ flex: 1, overflow: 'auto', background: isSimulated ? 'var(--bg-neutral-primary-medium)' : '#ffffff' }}>
              {isSimulated ? (
                <div style={{ padding: '20px' }}>
                  <LabSimulator 
                    dockerPort={dockerPort || 8081} 
                    flag={apiError || 'FLAG{sechub_simulated_success}'}
                    onSuccess={onSimulatedSuccess || (() => {})}
                  />
                </div>
              ) : (
                <iframe 
                  src={`http://localhost:${containerPort}`} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Mobile controls overlay */}
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
              onTouchStart={() => handleTouchStart('ArrowUp')}
              onTouchEnd={() => handleTouchEnd('ArrowUp')}
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
              onTouchStart={() => handleTouchStart('ArrowLeft')}
              onTouchEnd={() => handleTouchEnd('ArrowLeft')}
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
              onTouchStart={() => handleTouchStart('ArrowRight')}
              onTouchEnd={() => handleTouchEnd('ArrowRight')}
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
              onTouchStart={() => handleTouchStart('ArrowDown')}
              onTouchEnd={() => handleTouchEnd('ArrowDown')}
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

      {!isMobile && (
        <div style={{
          marginTop: '8px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'var(--text-body-subtle)',
          fontFamily: 'var(--font-mono)',
        }}>
          Điều khiển: Di chuyển bằng phím <strong style={{ color: 'var(--fg-brand)' }}>WASD</strong> hoặc <strong style={{ color: 'var(--fg-brand)' }}>Mũi tên</strong>. Ấn phím <strong style={{ color: 'var(--fg-brand)' }}>E</strong> khi ở gần thiết bị để tương tác.
        </div>
      )}
    </div>
  );
}
