'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import LabSimulator from '@/components/LabSimulator';
import { useTranslation } from '@/context/LanguageContext';
import { GAME_OBSTACLES, getHintPositions } from '@/components/labGameLayout';

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
  runtimeUrl?: string;
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
  runtimeUrl,
  apiError,
  onSimulatedSuccess
}: LabGameViewProps) {
  const { language } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game engine refs (for 60fps lag-free rendering and zero stale closures)
  const playerRef = useRef({ x: 400, y: 240, speed: 4.5, width: 24, height: 24 });
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const activeNpcRef = useRef<Entity | null>(null);
  const walkFrameRef = useRef({ frame: 0, lastToggle: 0 });
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }>>([]);
  
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



  // Map obstacles definitions (bounding boxes)
  const obstacleLabels = language === 'vi'
    ? ['Bàn Nhiệm Vụ', 'Bàn Thực Hành', 'Bàn Nộp FLAG', 'Tủ Rack 1', 'Tủ Rack 2', 'Tủ Rack 3', 'Tủ Rack 4', 'Bàn Console Dưới']
    : ['Mission Desk', 'Practice Desk', 'FLAG Submit Desk', 'Server Rack 1', 'Server Rack 2', 'Server Rack 3', 'Server Rack 4', 'Lower Console Desk'];
  const obstacles = GAME_OBSTACLES.map((obstacle, index) => ({ ...obstacle, label: obstacleLabels[index] }));

  // Hint stations are distributed in rows so every LabSpec maps to the game automatically.
  const mentorColors = ['#00a3ff', '#ff2d55', '#af52de', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#8b5cf6'];
  const mentorPositions = getHintPositions(hints.length);

  const baseMentors = hints.map((_, hintIndex) => {
    const position = mentorPositions[hintIndex];
    return {
      x: position.x,
      y: position.y,
      width: 24,
      height: 24,
      name: `${hintIndex + 2}. ${language === 'vi' ? 'Gợi ý' : 'Hint'} ${hintIndex + 1}`,
      avatar: '',
      color: mentorColors[hintIndex % mentorColors.length],
      hintIndex,
    };
  });

  // Dynamic names for interactive workflow steps (always end with practice + submit)
  // Steps: 1.Nhiệm vụ → 2..N+1.Gợi ý → N+2.Thực hành → N+3.Nộp FLAG
  const practiceStepNum = hints.length + 2;
  const submitStepNum = hints.length + 3;

  const npcs: Entity[] = [
    ...baseMentors,
    {
      x: 108,
      y: 100,
      width: 24,
      height: 24,
      name: language === 'vi' ? '1. Nhiệm vụ' : '1. Mission',
      avatar: '',
      color: '#eab308',
      hintIndex: 99,
    },
    {
      x: 388,
      y: 100,
      width: 24,
      height: 24,
      name: `${practiceStepNum}. ${language === 'vi' ? 'Thực hành' : 'Practice'}`,
      avatar: '',
      color: '#38bdf8',
      hintIndex: 98,
    },
    {
      x: 668,
      y: 100,
      width: 24,
      height: 24,
      name: `${submitStepNum}. ${language === 'vi' ? 'Nộp FLAG' : 'Submit FLAG'}`,
      avatar: '',
      color: '#10b981',
      hintIndex: 100,
    }
  ];

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateMobileState = () => {
        setIsMobile(window.matchMedia('(max-width: 640px)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
      };
      updateMobileState();
      window.addEventListener('resize', updateMobileState);
      return () => window.removeEventListener('resize', updateMobileState);
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
        language === 'vi'
          ? `NHIỆM VỤ BÀI THỰC HÀNH:\n\n1. Di chuyển lại gần máy tính "${practiceStepNum}. Thực hành" ở giữa và tương tác để thực hành khai thác lỗ hổng [${vulnerabilityName}].\n\n2. Trích xuất mã cờ bí mật (FLAG).\n\n3. Đến Thiết Bị "${submitStepNum}. Nộp FLAG" bên phải để nộp bài!`
          : `PRACTICE MISSION:\n\n1. Move close to the "${practiceStepNum}. Practice" computer in the center and interact to exploit the [${vulnerabilityName}] vulnerability.\n\n2. Extract the secret flag value (FLAG).\n\n3. Go to the "${submitStepNum}. Submit FLAG" terminal on the right to submit your work!`,
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
          language === 'vi'
            ? `Tôi giữ Gợi ý số ${idx + 1}. Mở khóa gợi ý này sẽ tiêu tốn ${points / 10} điểm. Bạn có đồng ý mở khóa không?`
            : `I hold Hint #${idx + 1}. Unlocking this hint costs ${points / 10} points. Do you agree to unlock it?`,
          true
        );
      } else {
        triggerDialogue(language === 'vi' ? 'Bạn cần Khởi động Lab trước để mở khóa gợi ý này.' : 'You must Start the Lab first to unlock this hint.', false);
      }
    } else {
      triggerDialogue(
        language === 'vi'
          ? `Gợi ý này đã bị khóa. Hãy mở khóa gợi ý số ${revealedHints + 1} của Mentor trước!`
          : `This hint is locked. Unlock Mentor hint #${revealedHints + 1} first!`,
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

  const getStepNumber = (name: string) => name.match(/^\d+/)?.[0] ?? name;

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
        setDialogue({ isOpen: true, text: language === 'vi' ? 'Đang mở khóa gợi ý...' : 'Unlocking hint...', showOptions: false });
        setTypedText(language === 'vi' ? 'Đang giải mã dữ liệu gợi ý từ máy chủ...' : 'Decrypting hint data from server...');
        await onRevealHint();
        setTimeout(() => {
          triggerDialogue(hints[revealedHints], false);
        }, 800);
      } catch (e: unknown) {
        triggerDialogue(`${language === 'vi' ? 'Lỗi' : 'Error'}: ${(e as Error).message || (language === 'vi' ? 'Không thể mở gợi ý' : 'Could not unlock hint')}`, false);
      }
    }
  };

  const handleFlagSubmit = async () => {
    if (!localFlag.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmitFlag(localFlag);
    } catch (_e) {
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

    // Helper to draw pixel-style dashed arrow (16-bit aesthetic)
    const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -Math.floor(Date.now() * 0.02) % 8;
      ctx.beginPath();
      ctx.moveTo(Math.floor(fromX), Math.floor(fromY));
      ctx.lineTo(Math.floor(toX), Math.floor(toY));
      ctx.stroke();
      ctx.setLineDash([]);

      // Pixel arrowhead (5px triangle)
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const midX = Math.floor((fromX + toX) / 2);
      const midY = Math.floor((fromY + toY) / 2);
      ctx.fillStyle = color;
      ctx.fillRect(midX, midY, 2, 2);
      ctx.fillRect(Math.floor(midX - Math.cos(angle) * 3 - Math.sin(angle) * 3), Math.floor(midY - Math.sin(angle) * 3 + Math.cos(angle) * 3), 2, 2);
      ctx.fillRect(Math.floor(midX - Math.cos(angle) * 3 + Math.sin(angle) * 3), Math.floor(midY - Math.sin(angle) * 3 - Math.cos(angle) * 3), 2, 2);
    };

    const drawGame = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const now = Date.now();

      // Lazy-init ambient floating particles
      if (particlesRef.current.length === 0) {
        for (let i = 0; i < 25; i++) {
          particlesRef.current.push({
            x: Math.random() * 800,
            y: Math.random() * 480,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -Math.random() * 0.3 - 0.1,
            size: Math.random() > 0.6 ? 2 : 1,
            alpha: Math.random() * 0.5 + 0.2,
          });
        }
      }

      // ════════════════════════════════════════════
      // 1. SERVER ROOM ENVIRONMENT
      // ════════════════════════════════════════════

      // Floor base
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, 800, 480);

      // Floor tiles (larger 32px, metallic look)
      for (let tx = 0; tx < 800; tx += 32) {
        for (let ty = 0; ty < 480; ty += 32) {
          const isAlt = ((tx / 32 + ty / 32) % 2 === 0);
          ctx.fillStyle = isAlt ? '#0d1526' : '#101b30';
          ctx.fillRect(tx, ty, 32, 32);
          // Tile groove lines
          ctx.fillStyle = '#1a2744';
          ctx.fillRect(tx + 31, ty, 1, 32);
          ctx.fillRect(tx, ty + 31, 32, 1);
          // Subtle highlight at top-left
          ctx.fillStyle = '#152040';
          ctx.fillRect(tx, ty, 32, 1);
          ctx.fillRect(tx, ty, 1, 32);
        }
      }

      // Floor reflective sheen (horizontal bands)
      for (let fy = 0; fy < 480; fy += 64) {
        ctx.globalAlpha = 0.03;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(0, fy, 800, 2);
        ctx.globalAlpha = 1;
      }

      // ── FLOOR DECORATIONS (cables, cracks, stains) ──

      // 1. Embedded cable runs (under-floor conduits visible through tiles)
      ctx.globalAlpha = 0.25;
      // Main horizontal cable run
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(60, 200, 680, 2);
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(60, 202, 680, 1);
      // Branch cables going to server racks
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(200, 200, 2, 120);  // left branch to rack 1
      ctx.fillRect(540, 200, 2, 120);  // right branch to rack 2
      // Second cable run (blue data cable)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(80, 280, 640, 2);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(80, 282, 640, 1);
      // Vertical branch from data cable
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(400, 100, 2, 180);  // center vertical to console
      // Red power cable (diagonal run)
      ctx.fillStyle = '#ef4444';
      for (let rx = 120; rx < 350; rx += 4) {
        ctx.fillRect(rx, 380 + Math.floor((rx - 120) * 0.15), 3, 2);
      }
      // Cable junction boxes (small squares where cables cross)
      ctx.fillStyle = '#475569';
      ctx.fillRect(198, 198, 6, 6);
      ctx.fillRect(538, 198, 6, 6);
      ctx.fillRect(398, 198, 6, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(199, 199, 4, 4);
      ctx.fillRect(539, 199, 4, 4);
      ctx.fillRect(399, 199, 4, 4);
      ctx.globalAlpha = 1;

      // 2. Cracked / broken floor tiles
      // Crack pattern 1 (near rack 1)
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#0a101c';
      ctx.fillRect(180, 300, 1, 18);
      ctx.fillRect(180, 300, 12, 1);
      ctx.fillRect(192, 300, 1, 8);
      ctx.fillRect(185, 310, 8, 1);
      ctx.fillRect(193, 305, 6, 1);
      // Crack pattern 2 (center-left)
      ctx.fillRect(320, 420, 1, 14);
      ctx.fillRect(320, 420, 8, 1);
      ctx.fillRect(328, 420, 1, 6);
      ctx.fillRect(322, 428, 10, 1);
      // Crack pattern 3 (right area)
      ctx.fillRect(620, 250, 15, 1);
      ctx.fillRect(620, 250, 1, 10);
      ctx.fillRect(635, 250, 1, 7);
      ctx.fillRect(625, 255, 1, 12);
      // Broken tile chips (small displaced pixels)
      ctx.fillStyle = '#1a2744';
      ctx.fillRect(183, 315, 2, 2);
      ctx.fillRect(193, 308, 2, 1);
      ctx.fillRect(325, 432, 2, 2);
      ctx.fillRect(623, 258, 3, 1);
      ctx.globalAlpha = 1;

      // 3. Oil / coolant stains (irregular dark patches with sheen)
      // Stain 1 — large coolant leak near rack 2
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(550, 430, 28, 16);
      ctx.fillRect(546, 434, 36, 8);
      ctx.fillRect(554, 426, 16, 4);
      // Iridescent sheen on stain
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(556, 434, 8, 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(562, 436, 6, 2);
      ctx.globalAlpha = 0.05;
      // Stain 2 — small oil drip near console A
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(140, 195, 16, 10);
      ctx.fillRect(136, 198, 24, 4);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(144, 198, 4, 2);
      // Stain 3 — faint drip trail from center
      ctx.fillStyle = '#0f172a';
      for (let dy = 240; dy < 280; dy += 8) {
        ctx.fillRect(410, dy, 4 + (dy % 3), 3);
      }
      ctx.globalAlpha = 1;

      // 4. Drain grates (floor utility access points)
      ctx.globalAlpha = 0.2;
      // Grate 1 (left area)
      ctx.fillStyle = '#374151';
      ctx.fillRect(70, 400, 20, 20);
      ctx.fillStyle = '#0f172a';
      for (let gy = 402; gy < 418; gy += 3) {
        ctx.fillRect(72, gy, 16, 1);
      }
      // Grate 2 (right area)
      ctx.fillStyle = '#374151';
      ctx.fillRect(710, 380, 20, 20);
      ctx.fillStyle = '#0f172a';
      for (let gy = 382; gy < 398; gy += 3) {
        ctx.fillRect(712, gy, 16, 1);
      }
      ctx.globalAlpha = 1;

      // 5. Scuff marks (equipment drag marks)
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#1e293b';
      // Long horizontal scuff
      ctx.fillRect(300, 360, 60, 2);
      ctx.fillRect(302, 362, 56, 1);
      // Short diagonal scuffs near server racks
      for (let sx = 0; sx < 20; sx += 3) {
        ctx.fillRect(230 + sx, 310 + sx, 3, 1);
      }
      for (let sx = 0; sx < 16; sx += 3) {
        ctx.fillRect(570 - sx, 315 + sx, 3, 1);
      }
      ctx.globalAlpha = 1;

      // 6. Anti-static grounding strips (thin copper lines along floor)
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, 44, 772, 1);  // top strip along wall
      ctx.fillRect(14, 470, 772, 1); // bottom strip
      // Cross strips
      ctx.fillRect(250, 44, 1, 426);
      ctx.fillRect(550, 44, 1, 426);
      ctx.globalAlpha = 1;

      // ── WALLS (top boundary strip with depth) ──
      ctx.fillStyle = '#1a2332';
      ctx.fillRect(0, 0, 800, 40);
      ctx.fillStyle = '#0f1923';
      ctx.fillRect(0, 35, 800, 8);
      // Wall base molding
      ctx.fillStyle = '#2a3a5c';
      ctx.fillRect(0, 40, 800, 3);
      ctx.fillStyle = '#3b5278';
      ctx.fillRect(0, 40, 800, 1);

      // ── CEILING PIPE RUNS ──
      ctx.fillStyle = '#374151';
      ctx.fillRect(50, 8, 700, 4);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(50, 8, 700, 1);
      // Pipe joints
      for (let pj = 100; pj < 750; pj += 120) {
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(pj, 6, 8, 8);
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(pj + 1, 6, 1, 8);
      }

      // Second pipe
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(60, 18, 680, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(60, 18, 680, 1);

      // ── CABLE TRAYS (hanging cables) ──
      const cableColors = ['#22c55e', '#38bdf8', '#eab308', '#a855f7', '#ef4444'];
      for (let ci = 0; ci < 5; ci++) {
        const cx = 80 + ci * 150;
        const sag = Math.sin(now * 0.001 + ci) * 2;
        ctx.fillStyle = cableColors[ci];
        // Vertical drop from pipe
        ctx.fillRect(cx, 12, 2, 20 + sag);
        // Small drip/connector at bottom
        ctx.fillRect(cx - 1, 30 + sag, 4, 3);
      }

      // ── WALL DECORATIONS ──
      // Warning poster 1 (left wall)
      ctx.fillStyle = '#eab308';
      ctx.fillRect(30, 10, 24, 18);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(32, 12, 20, 14);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(36, 14, 12, 2); // text line
      ctx.fillRect(36, 18, 8, 2);
      // Hazard triangle
      ctx.fillStyle = '#eab308';
      ctx.fillRect(40, 22, 4, 2);

      // "SECURITY" poster (right wall)
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(720, 10, 50, 22);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(722, 12, 46, 18);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(726, 15, 20, 2);
      ctx.fillRect(726, 19, 30, 2);
      ctx.fillRect(726, 23, 14, 2);

      // Emergency exit sign
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(390, 6, 20, 10);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(392, 8, 16, 6);
      ctx.fillStyle = '#166534';
      ctx.fillRect(396, 9, 4, 4); // person icon
      ctx.fillRect(401, 10, 6, 1); // arrow

      // ── EMERGENCY / AMBIENT LIGHTS ──
      // Ceiling LED strips
      for (let lx = 60; lx < 800; lx += 200) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(lx, 0, 80, 5);
        // Light glow
        const lightPulse = Math.sin(now * 0.002 + lx * 0.01) * 0.3 + 0.7;
        ctx.globalAlpha = lightPulse * 0.15;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(lx - 20, 0, 120, 50);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(lx + 2, 1, 76, 2);
      }

      // ── SIDE WALL ELEMENTS (left & right boundaries) ──
      // Left wall panel
      ctx.fillStyle = '#1a2332';
      ctx.fillRect(0, 40, 12, 440);
      ctx.fillStyle = '#2a3a5c';
      ctx.fillRect(10, 40, 3, 440);

      // Right wall panel
      ctx.fillStyle = '#1a2332';
      ctx.fillRect(788, 40, 12, 440);
      ctx.fillStyle = '#2a3a5c';
      ctx.fillRect(787, 40, 3, 440);

      // Wall-mounted ethernet panels
      for (let ep = 80; ep < 460; ep += 140) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(2, ep, 8, 20);
        ctx.fillStyle = '#374151';
        ctx.fillRect(3, ep + 1, 6, 18);
        // Port LEDs
        ctx.fillStyle = Math.sin(now * 0.003 + ep) > 0 ? '#22c55e' : '#064e3b';
        ctx.fillRect(4, ep + 4, 2, 2);
        ctx.fillStyle = Math.sin(now * 0.005 + ep) > 0 ? '#38bdf8' : '#0c4a6e';
        ctx.fillRect(4, ep + 10, 2, 2);
      }

      // ── FLOOR MARKINGS (safety lines) ──
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(14, 450, 772, 2);
      ctx.fillRect(14, 460, 772, 2);
      ctx.globalAlpha = 1;

      // ════════════════════════════════════════════
      // 2. AMBIENT DATA PARTICLES (floating upward)
      // ════════════════════════════════════════════
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.y < 0) { pt.y = 480; pt.x = Math.random() * 800; }
        if (pt.x < 0) pt.x = 800;
        if (pt.x > 800) pt.x = 0;
        const twinkle = Math.sin(now * 0.004 + pt.x * 0.05) * 0.2;
        ctx.globalAlpha = Math.max(0.05, pt.alpha + twinkle);
        ctx.fillStyle = pt.size > 1 ? '#67e8f9' : '#a5f3fc';
        ctx.fillRect(Math.floor(pt.x), Math.floor(pt.y), pt.size, pt.size);
      });
      ctx.globalAlpha = 1;

      // ════════════════════════════════════════════
      // 3. PIXEL DASHED ARROW PATHS
      // ════════════════════════════════════════════
      const pathPoints: { x: number; y: number }[] = [];
      const missionNpc = npcs.find(n => n.hintIndex === 99);
      if (missionNpc) {
        pathPoints.push({ x: missionNpc.x + missionNpc.width / 2, y: missionNpc.y + missionNpc.height / 2 });
      }
      
      const sortedMentors = [...baseMentors].sort((a, b) => a.hintIndex - b.hintIndex);
      sortedMentors.forEach((m) => {
        pathPoints.push({ x: m.x + m.width / 2, y: m.y + m.height / 2 });
      });

      const practiceNpc = npcs.find(n => n.hintIndex === 98);
      if (practiceNpc) {
        pathPoints.push({ x: practiceNpc.x + practiceNpc.width / 2, y: practiceNpc.y + practiceNpc.height / 2 });
      }

      const submitNpc = npcs.find(n => n.hintIndex === 100);
      if (submitNpc) {
        pathPoints.push({ x: submitNpc.x + submitNpc.width / 2, y: submitNpc.y + submitNpc.height / 2 });
      }

      // 3. PIXEL DASHED ARROW PATHS (sequential sweep, 1s hold, sequential fade, 3s rest)
      const S = pathPoints.length - 1;
      const durationPerSegment = 800; // ms
      const T_show = S * durationPerSegment;
      const T_wait = 1000; // wait 1s after drawing final segment
      const T_visible = T_show + T_wait;
      const T_fade = S * durationPerSegment; // fade out from 1 to 6
      const T_rest = 3000; // 3 seconds rest
      const T_total = T_visible + T_fade + T_rest;
      const cycleTime = now % T_total;

      if (cycleTime < T_visible) {
        // Draw phase + Hold phase
        const currentDrawSegmentIndex = Math.min(S, Math.floor(cycleTime / durationPerSegment));
        const segmentElapsed = cycleTime % durationPerSegment;
        const fraction = cycleTime >= T_show ? 1.0 : segmentElapsed / durationPerSegment;

        for (let i = 0; i < S; i++) {
          if (i > currentDrawSegmentIndex) continue;

          const from = pathPoints[i];
          const to = pathPoints[i + 1];
          
          // Define path segment state
          let isCompleted = false;
          let isActive = false;
          
          if (i < revealedHints) {
            isCompleted = true;
          } else if (i === revealedHints) {
            isActive = true;
          }
          
          if (i === hints.length) {
            if (labStatus === 'running' || labStatus === 'completed') {
              isCompleted = true;
            } else if (revealedHints === hints.length) {
              isActive = true;
            }
          }
          
          if (i === hints.length + 1) {
            if (labStatus === 'completed') {
              isCompleted = true;
            } else if (labStatus === 'running') {
              isActive = true;
            }
          }

          const isGrowing = i === currentDrawSegmentIndex;
          const targetX = isGrowing ? from.x + (to.x - from.x) * fraction : to.x;
          const targetY = isGrowing ? from.y + (to.y - from.y) * fraction : to.y;

          // 1. Conduit
          ctx.globalAlpha = 0.08;
          ctx.strokeStyle = isCompleted ? '#10b981' : isActive ? '#38bdf8' : '#334155';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // 2. Main Arrow
          const lineColor = isCompleted 
            ? '#10b981' 
            : isActive 
              ? `hsl(${(now * 0.15) % 360}, 90%, 60%)` 
              : 'rgba(71, 85, 105, 0.25)';
          drawArrow(ctx, from.x, from.y, targetX, targetY, lineColor);

          // 3. Signal Particle
          if ((isCompleted || isActive) && !isGrowing) {
            const pulseSpeed = isCompleted ? 0.0015 : 0.001;
            const progress = (now * pulseSpeed + i * 0.3) % 1.0;
            const px = from.x + (to.x - from.x) * progress;
            const py = from.y + (to.y - from.y) * progress;
            ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)';
            ctx.fillRect(px - 4, py - 4, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 2, py - 2, 4, 4);
          }
        }
      } else if (cycleTime < T_visible + T_fade) {
        // Fade-out phase (disappears from 1 to 6)
        const fadeTime = cycleTime - T_visible;
        const currentFadeSegmentIndex = Math.floor(fadeTime / durationPerSegment);
        const segmentElapsed = fadeTime % durationPerSegment;
        const fraction = segmentElapsed / durationPerSegment;

        for (let i = 0; i < S; i++) {
          if (i < currentFadeSegmentIndex) continue;

          const from = pathPoints[i];
          const to = pathPoints[i + 1];
          
          let isCompleted = false;
          let isActive = false;
          
          if (i < revealedHints) {
            isCompleted = true;
          } else if (i === revealedHints) {
            isActive = true;
          }
          
          if (i === hints.length) {
            if (labStatus === 'running' || labStatus === 'completed') {
              isCompleted = true;
            } else if (revealedHints === hints.length) {
              isActive = true;
            }
          }
          
          if (i === hints.length + 1) {
            if (labStatus === 'completed') {
              isCompleted = true;
            } else if (labStatus === 'running') {
              isActive = true;
            }
          }

          const isFading = i === currentFadeSegmentIndex;
          const startX = isFading ? from.x + (to.x - from.x) * fraction : from.x;
          const startY = isFading ? from.y + (to.y - from.y) * fraction : from.y;

          // 1. Conduit
          ctx.globalAlpha = 0.08 * (1.0 - (isFading ? fraction : 0));
          ctx.strokeStyle = isCompleted ? '#10b981' : isActive ? '#38bdf8' : '#334155';
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // 2. Main Arrow
          const lineColor = isCompleted 
            ? '#10b981' 
            : isActive 
              ? `hsl(${(now * 0.15) % 360}, 90%, 60%)` 
              : 'rgba(71, 85, 105, 0.25)';
          drawArrow(ctx, startX, startY, to.x, to.y, lineColor);

          // 3. Signal Particle
          if ((isCompleted || isActive) && !isFading) {
            const pulseSpeed = isCompleted ? 0.0015 : 0.001;
            const progress = (now * pulseSpeed + i * 0.3) % 1.0;
            const px = from.x + (to.x - from.x) * progress;
            const py = from.y + (to.y - from.y) * progress;
            ctx.fillStyle = isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)';
            ctx.fillRect(px - 4, py - 4, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 2, py - 2, 4, 4);
          }
        }
      }

      // ════════════════════════════════════════════
      // 4. ENTITY GLOW AURAS + MARKERS
      // ════════════════════════════════════════════
      npcs.forEach((npc) => {
        const isSpecial = npc.hintIndex >= 98;
        const isUnlockable = !isSpecial && npc.hintIndex === revealedHints;
        const cx = npc.x + npc.width / 2;
        const cy = npc.y + npc.height;

        // Ground glow circle (pixel diamond shape)
        const pulse = Math.sin(now * 0.004 + npc.hintIndex * 2) * 3;
        const r = 14 + pulse;
        for (let d = 0; d < r; d += 2) {
          ctx.globalAlpha = 0.08 * (1 - d / r);
          ctx.fillStyle = npc.color;
          ctx.fillRect(cx - d, cy - 2, d * 2, 4);
        }
        ctx.globalAlpha = 1;

        // Blinking "!" for unlockable hints
        if (isUnlockable && Math.floor(now / 400) % 2 === 0) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(npc.x + 9, npc.y - 18, 6, 10);
          ctx.fillRect(npc.x + 9, npc.y - 6, 6, 4);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(npc.x + 11, npc.y - 16, 2, 6);
          ctx.fillRect(npc.x + 11, npc.y - 5, 2, 2);
        }
      });

      // Player ground glow
      const p = playerRef.current;
      const pgx = p.x + p.width / 2;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pgx - 12, p.y + p.height, 24, 3);
      ctx.fillRect(pgx - 8, p.y + p.height + 3, 16, 2);
      ctx.globalAlpha = 1;

      // ════════════════════════════════════════════
      // 5. OBSTACLES — DETAILED PIXEL FURNITURE
      // ════════════════════════════════════════════
      obstacles.forEach((obs) => {
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(obs.x + 3, obs.y + 3, obs.width, obs.height);

        if (obs.label.startsWith('Tủ Rack')) {
          // ── DETAILED SERVER RACK (tall, metallic) ──
          // Outer casing
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          // Frame edges
          ctx.fillStyle = '#475569';
          ctx.fillRect(obs.x, obs.y, obs.width, 3);
          ctx.fillRect(obs.x, obs.y + obs.height - 3, obs.width, 3);
          ctx.fillRect(obs.x, obs.y, 3, obs.height);
          ctx.fillRect(obs.x + obs.width - 3, obs.y, 3, obs.height);
          // Highlight bevel
          ctx.fillStyle = '#64748b';
          ctx.fillRect(obs.x + 1, obs.y + 1, obs.width - 2, 1);
          ctx.fillRect(obs.x + 1, obs.y + 1, 1, obs.height - 2);
          // Inner dark cavity
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(obs.x + 5, obs.y + 6, obs.width - 10, obs.height - 12);

          // Server unit slots (each 10px tall)
          for (let ly = obs.y + 8; ly < obs.y + obs.height - 10; ly += 10) {
            // Server unit faceplate
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(obs.x + 7, ly, obs.width - 14, 8);
            ctx.fillStyle = '#334155';
            ctx.fillRect(obs.x + 7, ly, obs.width - 14, 1);

            // LED array (3-4 LEDs per unit)
            const ledOffset = obs.x + 10;
            for (let li = 0; li < 4; li++) {
              const ledSeed = Math.sin(now * (0.003 + li * 0.002) + ly * (3.7 + li)) > 0;
              const ledColors = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];
              const ledDark = ['#064e3b', '#450a0a', '#451a03', '#172554'];
              ctx.fillStyle = ledSeed ? ledColors[li] : ledDark[li];
              ctx.fillRect(ledOffset + li * 5, ly + 3, 3, 3);
            }

            // Activity bar (data flow animation)
            const barW = obs.width - 40;
            const dataFlow = Math.floor(now * 0.01 + ly) % barW;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(obs.x + 32, ly + 4, barW, 2);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(obs.x + 32 + (dataFlow % barW), ly + 4, 6, 2);
          }

          // Top ventilation grille
          ctx.fillStyle = '#374151';
          for (let vx = obs.x + 8; vx < obs.x + obs.width - 8; vx += 3) {
            ctx.fillRect(vx, obs.y + obs.height - 8, 2, 4);
          }

          // Handle/latch
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(obs.x + obs.width - 8, obs.y + obs.height / 2 - 6, 3, 12);

        } else {
          // ── CONSOLE DESK WITH CRT MONITOR ──
          // Desk body (thick workstation)
          ctx.fillStyle = '#374151';
          ctx.fillRect(obs.x, obs.y + obs.height - 12, obs.width, 12);
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(obs.x, obs.y + obs.height - 12, obs.width, 2);
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(obs.x + 2, obs.y + obs.height - 2, obs.width - 4, 2);

          // Desk legs
          ctx.fillStyle = '#374151';
          ctx.fillRect(obs.x + 6, obs.y + obs.height, 4, 6);
          ctx.fillRect(obs.x + obs.width - 10, obs.y + obs.height, 4, 6);

          // CRT MONITOR (prominent)
          const monW = Math.min(obs.width - 20, 80);
          const monH = obs.height - 16;
          const monX = obs.x + (obs.width - monW) / 2;
          const monY = obs.y;

          // Monitor casing (chunky CRT shape)
          ctx.fillStyle = '#334155';
          ctx.fillRect(monX, monY, monW, monH);
          // Bevel highlights
          ctx.fillStyle = '#475569';
          ctx.fillRect(monX, monY, monW, 2);
          ctx.fillRect(monX, monY, 2, monH);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(monX + monW - 2, monY, 2, monH);
          ctx.fillRect(monX, monY + monH - 2, monW, 2);

          // Screen (green phosphor CRT)
          const scrX = monX + 4;
          const scrY = monY + 4;
          const scrW = monW - 8;
          const scrH = monH - 8;
          ctx.fillStyle = '#020617';
          ctx.fillRect(scrX, scrY, scrW, scrH);
          // Screen inner border glow
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(scrX, scrY, scrW, 1);
          ctx.fillRect(scrX, scrY, 1, scrH);

          // Terminal text lines
          const linePhase = Math.floor(now / 700) % 5;
          const textLines = [
            { color: '#22c55e', y: scrY + 3, w: scrW * 0.8 },
            { color: '#38bdf8', y: scrY + 7, w: scrW * 0.6 },
            { color: '#22c55e', y: scrY + 11, w: scrW * 0.5 },
            { color: '#a855f7', y: scrY + 15, w: scrW * 0.7 },
          ];
          textLines.forEach((line, li) => {
            if (li <= linePhase) {
              ctx.fillStyle = line.color;
              ctx.fillRect(scrX + 2, line.y, Math.min(line.w, scrW - 4), 2);
            }
          });

          // Blinking cursor
          if (Math.floor(now / 350) % 2 === 0) {
            const cursorLine = Math.min(linePhase, textLines.length - 1);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(scrX + 2 + textLines[cursorLine].w + 2, textLines[cursorLine].y, 3, 3);
          }

          // Monitor stand
          ctx.fillStyle = '#475569';
          ctx.fillRect(monX + monW / 2 - 4, monY + monH, 8, 4);
          ctx.fillRect(monX + monW / 2 - 8, monY + monH + 3, 16, 3);

          // Keyboard on desk
          const kbX = monX + monW / 2 - 16;
          const kbY = obs.y + obs.height - 10;
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(kbX, kbY, 32, 6);
          ctx.fillStyle = '#334155';
          ctx.fillRect(kbX, kbY, 32, 1);
          // Key dots
          ctx.fillStyle = '#4b5563';
          for (let kr = 0; kr < 2; kr++) {
            for (let kc = 0; kc < 10; kc++) {
              ctx.fillRect(kbX + 2 + kc * 3, kbY + 2 + kr * 2, 2, 1);
            }
          }
        }
      });

      // ════════════════════════════════════════════
      // 6. NPC SPRITES — 32-BIT CYBER CHARACTERS
      // ════════════════════════════════════════════
      npcs.forEach((npc) => {
        const nx = npc.x;
        const ny = npc.y;

        ctx.save();
        const cx = nx + npc.width / 2;
        const cy = ny + npc.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(1.3, 1.3);
        ctx.translate(-cx, -cy);

        if (npc.hintIndex === 99) {
          // ── MISSION BOARD (digital bulletin board) ──
          // Stand/mount
          ctx.fillStyle = '#475569';
          ctx.fillRect(nx + 8, ny + 18, 3, 6);
          ctx.fillRect(nx + 13, ny + 18, 3, 6);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(nx + 5, ny + 22, 14, 3);

          // Digital board frame
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(nx + 1, ny, 22, 18);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(nx + 1, ny, 22, 2);
          ctx.fillRect(nx + 1, ny, 2, 18);
          ctx.fillRect(nx + 21, ny, 2, 18);
          ctx.fillRect(nx + 1, ny + 16, 22, 2);

          // Screen area
          ctx.fillStyle = '#020617';
          ctx.fillRect(nx + 3, ny + 2, 18, 14);

          // Mission text lines (scrolling)
          const scrollOffset = Math.floor(now / 1200) % 4;
          const missionColors = ['#fbbf24', '#f59e0b', '#eab308'];
          for (let ml = 0; ml < 3; ml++) {
            const my = ny + 4 + ml * 4;
            ctx.fillStyle = missionColors[ml];
            ctx.fillRect(nx + 5, my, 10 + ((ml + scrollOffset) % 3) * 2, 2);
          }

          // Blinking indicator
          ctx.fillStyle = Math.floor(now / 500) % 2 === 0 ? '#eab308' : '#422006';
          ctx.fillRect(nx + 17, ny + 4, 2, 2);

        } else if (npc.hintIndex === 98) {
          // ── PRACTICE SERVER TERMINAL (workstation) ──
          // Monitor body (thick CRT)
          ctx.fillStyle = '#374151';
          ctx.fillRect(nx + 1, ny, 22, 14);
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(nx + 1, ny, 22, 2);
          ctx.fillRect(nx + 1, ny, 2, 14);

          // Screen
          ctx.fillStyle = '#020617';
          ctx.fillRect(nx + 3, ny + 2, 18, 10);

          // Terminal content
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(nx + 5, ny + 4, 10, 1);
          const tPhase = Math.floor(now / 500) % 3;
          if (tPhase >= 1) {
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(nx + 5, ny + 6, 14, 1);
          }
          if (tPhase >= 2) {
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(nx + 5, ny + 8, 8, 1);
          }
          // Cursor
          if (Math.floor(now / 300) % 2 === 0) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(nx + 5 + (tPhase >= 2 ? 9 : tPhase >= 1 ? 15 : 11), ny + 4 + tPhase * 2, 2, 2);
          }

          // Stand
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(nx + 9, ny + 14, 6, 3);
          ctx.fillRect(nx + 6, ny + 16, 12, 2);

          // Keyboard
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(nx + 3, ny + 19, 18, 5);
          ctx.fillStyle = '#374151';
          for (let kx = nx + 4; kx < nx + 20; kx += 2) {
            ctx.fillRect(kx, ny + 21, 1, 1);
          }

        } else if (npc.hintIndex === 100) {
          // ── FLAG SUBMISSION TERMINAL (secure kiosk) ──
          // Cabinet body
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(nx + 3, ny + 2, 18, 20);
          // Metal frame
          ctx.fillStyle = '#10b981';
          ctx.fillRect(nx + 3, ny + 2, 18, 2);
          ctx.fillRect(nx + 3, ny + 2, 2, 20);
          ctx.fillRect(nx + 19, ny + 2, 2, 20);
          ctx.fillRect(nx + 3, ny + 20, 18, 2);

          // Status screen
          ctx.fillStyle = '#020617';
          ctx.fillRect(nx + 6, ny + 5, 12, 7);
          // "FLAG" indicator
          ctx.fillStyle = '#10b981';
          ctx.fillRect(nx + 7, ny + 7, 3, 2);
          ctx.fillRect(nx + 11, ny + 7, 3, 2);
          ctx.fillRect(nx + 15, ny + 7, 2, 2);

          // Submission slot (with glow)
          ctx.fillStyle = '#030712';
          ctx.fillRect(nx + 7, ny + 15, 10, 3);
          const slotGlow = Math.sin(now * 0.006) > 0;
          ctx.fillStyle = slotGlow ? '#10b981' : '#065f46';
          ctx.fillRect(nx + 7, ny + 15, 10, 1);

          // Top LEDs (status)
          ctx.fillStyle = Math.floor(now / 700) % 2 === 0 ? '#22c55e' : '#064e3b';
          ctx.fillRect(nx + 8, ny + 3, 3, 2);
          ctx.fillStyle = Math.floor(now / 500) % 2 === 0 ? '#3b82f6' : '#172554';
          ctx.fillRect(nx + 13, ny + 3, 3, 2);

        } else {
          // ── SECURITY MENTOR (Hacker/Expert character) ──
          const color = npc.color;
          const isLocked = npc.hintIndex > revealedHints;


          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(nx + 4, ny + 22, 16, 3);

          // BODY (jacket/coat)
          ctx.fillStyle = isLocked ? '#1e293b' : '#0f172a';
          ctx.fillRect(nx + 5, ny + 10, 14, 12);
          // Jacket collar/shoulders
          ctx.fillStyle = isLocked ? '#334155' : color;
          ctx.fillRect(nx + 4, ny + 10, 16, 2);
          ctx.fillRect(nx + 4, ny + 10, 2, 5);
          ctx.fillRect(nx + 18, ny + 10, 2, 5);
          // Center line (zipper)
          ctx.fillStyle = isLocked ? '#475569' : '#4b5563';
          ctx.fillRect(nx + 11, ny + 12, 2, 8);

          // ID Badge
          if (!isLocked) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(nx + 6, ny + 14, 4, 5);
            ctx.fillStyle = color;
            ctx.fillRect(nx + 7, ny + 15, 2, 2);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(nx + 6, ny + 18, 4, 1);
          }

          // HEAD
          ctx.fillStyle = '#d4a574';
          ctx.fillRect(nx + 7, ny + 4, 10, 6);
          // Hair/hood top
          ctx.fillStyle = isLocked ? '#1e293b' : '#0f172a';
          ctx.fillRect(nx + 6, ny + 2, 12, 4);
          ctx.fillRect(nx + 8, ny + 1, 8, 2);

          // EYES
          const eyeBlink = Math.floor(now / 2500) % 25 === 0 && Math.floor(now / 80) % 3 === 0;
          if (!eyeBlink) {
            ctx.fillStyle = isLocked ? '#475569' : color;
            ctx.fillRect(nx + 8, ny + 6, 3, 2);
            ctx.fillRect(nx + 13, ny + 6, 3, 2);
            // Pupil
            ctx.fillStyle = '#020617';
            ctx.fillRect(nx + 9, ny + 6, 1, 2);
            ctx.fillRect(nx + 14, ny + 6, 1, 2);
          } else {
            ctx.fillStyle = '#b8977a';
            ctx.fillRect(nx + 8, ny + 7, 3, 1);
            ctx.fillRect(nx + 13, ny + 7, 3, 1);
          }

          // LEGS
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(nx + 6, ny + 22, 5, 3);
          ctx.fillRect(nx + 13, ny + 22, 5, 3);
          // Shoes
          ctx.fillStyle = isLocked ? '#334155' : '#374151';
          ctx.fillRect(nx + 5, ny + 24, 6, 2);
          ctx.fillRect(nx + 13, ny + 24, 6, 2);

          // LOCK ICON overlay
          if (isLocked) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#94a3b8';
            // Lock body
            ctx.fillRect(nx + 9, ny + 14, 6, 5);
            // Lock shackle
            ctx.fillRect(nx + 10, ny + 11, 4, 4);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(nx + 11, ny + 12, 2, 2);
            // Keyhole
            ctx.fillStyle = '#020617';
            ctx.fillRect(nx + 11, ny + 16, 2, 2);
            }
        }
        ctx.restore();
      });

      // ════════════════════════════════════════════
      // 7. PLAYER — PIXEL HACKER PROTAGONIST
      // ════════════════════════════════════════════
      const keys = keysPressedRef.current;
      const isMoving = keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] ||
                       keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                       keys['w'] || keys['s'] || keys['a'] || keys['d'];

      if (isMoving) {
        if (now - walkFrameRef.current.lastToggle > 180) {
          walkFrameRef.current.frame = walkFrameRef.current.frame === 0 ? 1 : 0;
          walkFrameRef.current.lastToggle = now;
        }
      } else {
        walkFrameRef.current.frame = 0;
      }

      const wf = walkFrameRef.current.frame;
      const px = p.x;
      const py = p.y;
      const idleBob = isMoving ? 0 : Math.sin(now * 0.004) * 2.0;

      ctx.save();
      const pcx = px + p.width / 2;
      const pcy = py + p.height / 2;
      ctx.translate(pcx, pcy);
      ctx.scale(1.3, 1.3);
      ctx.translate(-pcx, -pcy);

      // ── PLAYER GROUND GLOW (multi-layer pulsing aura) ──
      const pby = py + p.height;         // player bottom Y
      const glowPulse = Math.sin(now * 0.003) * 0.3 + 0.7;  // 0.4-1.0 pulse

      // Layer 1: Wide ambient spotlight on floor
      for (let gr = 28; gr > 0; gr -= 2) {
        ctx.globalAlpha = 0.04 * glowPulse * (1 - gr / 28);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(pcx - gr, pby - 1, gr * 2, 4);
      }

      // Layer 2: Bright inner glow ring
      const ringSize = 12 + Math.sin(now * 0.005) * 3;
      ctx.globalAlpha = 0.15 * glowPulse;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(pcx - ringSize, pby, ringSize * 2, 3);
      ctx.globalAlpha = 0.25 * glowPulse;
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(pcx - ringSize + 3, pby + 1, (ringSize - 3) * 2, 1);

      // Layer 3: Pixel diamond glow pattern (expanding/contracting)
      const diaSize = 8 + Math.sin(now * 0.004) * 2;
      for (let d = 0; d < diaSize; d += 2) {
        ctx.globalAlpha = 0.08 * (1 - d / diaSize);
        ctx.fillStyle = '#86efac';
        ctx.fillRect(pcx - d, pby + 2, d * 2, 1);
      }
      ctx.globalAlpha = 1;

      // Layer 4: Drop shadow (sharp pixel)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(px + 3, py + 22 + idleBob, 18, 3);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(px + 1, py + 24 + idleBob, 22, 2);

      // LEGS (walk animation)
      ctx.fillStyle = '#1e293b';
      if (wf === 0) {
        ctx.fillRect(px + 6, py + 18 + idleBob, 5, 5);
        ctx.fillRect(px + 13, py + 18 + idleBob, 5, 5);
      } else {
        ctx.fillRect(px + 5, py + 17, 5, 6);
        ctx.fillRect(px + 14, py + 18, 5, 4);
      }
      // Boots
      ctx.fillStyle = '#374151';
      if (wf === 0) {
        ctx.fillRect(px + 5, py + 22 + idleBob, 6, 2);
        ctx.fillRect(px + 13, py + 22 + idleBob, 6, 2);
      } else {
        ctx.fillRect(px + 4, py + 22, 6, 2);
        ctx.fillRect(px + 14, py + 21, 6, 2);
      }

      // BODY (hoodie)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 4, py + 8 + idleBob, 16, 10);
      // Hoodie shoulder accent
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px + 3, py + 8 + idleBob, 18, 2);
      ctx.fillRect(px + 3, py + 8 + idleBob, 2, 6);
      ctx.fillRect(px + 19, py + 8 + idleBob, 2, 6);
      // Center zip
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(px + 11, py + 10 + idleBob, 2, 7);

      // ARMS + LAPTOP
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 1, py + 11 + idleBob, 4, 5);
      ctx.fillRect(px + 19, py + 11 + idleBob, 4, 5);
      // Laptop (held in front)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 5, py + 15 + idleBob, 14, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px + 6, py + 13 + idleBob, 12, 3);
      // Screen content flicker
      if (Math.sin(now * 0.01) > 0) {
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(px + 8, py + 14 + idleBob, 4, 1);
      }
      if (Math.sin(now * 0.007 + 1) > 0) {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 13, py + 14 + idleBob, 3, 1);
      }

      // HEAD (hoodie hood)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px + 6, py + 1 + idleBob, 12, 8);
      ctx.fillRect(px + 8, py + idleBob, 8, 2);
      // Hood pointed tip
      ctx.fillRect(px + 10, py - 1 + idleBob, 4, 2);

      // FACE (visible under hood)
      ctx.fillStyle = '#d4a574';
      ctx.fillRect(px + 7, py + 4 + idleBob, 10, 5);

      // HACKER MASK / BANDANA (covers lower face)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 7, py + 7 + idleBob, 10, 2);

      // EYES (neon green, with blink)
      const playerBlink = Math.floor(now / 2500) % 18 === 0 && Math.floor(now / 80) % 3 === 0;
      if (!playerBlink) {
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 8, py + 5 + idleBob, 3, 2);
        ctx.fillRect(px + 13, py + 5 + idleBob, 3, 2);
        // Eye highlights
        ctx.fillStyle = '#86efac';
        ctx.fillRect(px + 9, py + 5 + idleBob, 1, 1);
        ctx.fillRect(px + 14, py + 5 + idleBob, 1, 1);
        // Eye glow aura (neon light spill from eyes)
        ctx.globalAlpha = 0.12 * glowPulse;
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px + 6, py + 4 + idleBob, 12, 4);
        ctx.globalAlpha = 0.06;
        ctx.fillRect(px + 5, py + 3 + idleBob, 14, 6);
        ctx.globalAlpha = 1;
      }

      // Hoodie shoulder accent shimmer
      const shimmer = Math.sin(now * 0.006) * 0.12 + 0.08;
      ctx.globalAlpha = shimmer;
      ctx.fillStyle = '#86efac';
      ctx.fillRect(px + 4, py + 8 + idleBob, 16, 1);
      ctx.globalAlpha = 1;
      ctx.restore();

      drawTextWithOutline(ctx, language === 'vi' ? 'BẠN' : 'YOU', px + p.width / 2, py - 12 + idleBob, '#4ade80');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const activeNpcColor = npcs.find(n => n.name === uiActiveNpcName)?.color || '#00f2fe';

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
            const isLockedHint = !isSpecial && npc.hintIndex > revealedHints;
            const isRevealedHint = !isSpecial && npc.hintIndex < revealedHints;
            const stepNumber = getStepNumber(npc.name);
            const labelText = npc.name.replace(/^\d+\.\s*/, '');
            const chipColor = isSpecial
              ? npc.color
              : isLockedHint
                ? '#64748b'
                : isUnlockable
                  ? '#fbbf24'
                  : isRevealedHint
                    ? '#22c55e'
                    : npc.color;
            
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
                  transform: 'translate(-50%, -118%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  zIndex: isCurrentActive ? 30 : 20,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isCurrentActive ? '7px' : '0',
                  width: isCurrentActive ? 'auto' : '28px',
                  minWidth: isCurrentActive ? '92px' : '28px',
                  maxWidth: isCurrentActive ? 'min(220px, 44vw)' : '28px',
                  minHeight: isCurrentActive ? '30px' : '28px',
                  background: isCurrentActive ? 'rgba(9, 13, 22, 0.96)' : 'rgba(9, 13, 22, 0.82)',
                  border: isCurrentActive 
                    ? `2px solid ${chipColor}`
                    : `1.5px solid ${chipColor}`,
                  borderRadius: isCurrentActive ? '7px' : '999px',
                  padding: isCurrentActive ? '5px 10px' : '0',
                  fontSize: '12px',
                  lineHeight: 1.15,
                  fontWeight: 800,
                  fontFamily: '"Courier New", Courier, monospace',
                  color: isCurrentActive ? '#ffffff' : '#e2e8f0',
                  letterSpacing: '0px',
                  boxShadow: isCurrentActive 
                    ? `0 0 14px ${chipColor}66`
                    : isUnlockable
                      ? `0 0 14px ${chipColor}66, 0 2px 6px rgba(0, 0, 0, 0.5)`
                      : '0 2px 6px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(3px)',
                  opacity: isLockedHint && !isCurrentActive ? 0.7 : 1,
                  textRendering: 'geometricPrecision',
                  textShadow: isCurrentActive 
                    ? `0 0 6px ${chipColor}88`
                    : '0 1px 2px rgba(0,0,0,0.8)',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                    width: isCurrentActive ? '19px' : '100%',
                    height: isCurrentActive ? '19px' : '100%',
                    borderRadius: '999px',
                    background: isCurrentActive ? chipColor : 'transparent',
                    color: isCurrentActive ? '#020617' : chipColor,
                    fontSize: isCurrentActive ? '11px' : '13px',
                    fontWeight: 900,
                  }}>
                    {stepNumber}
                  </span>
                  {isCurrentActive && (
                    <span style={{
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      textAlign: 'left',
                      maxWidth: '168px',
                    }}>
                      {labelText}
                    </span>
                  )}
                </div>

                {isCurrentActive && (
                  <div style={{
                    fontSize: '10px',
                    fontFamily: '"Courier New", Courier, monospace',
                    color: '#ffffff',
                    background: chipColor,
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontWeight: 900,
                    letterSpacing: '0px',
                    boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 8px ${chipColor}44`,
                    marginTop: '2px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}>
                    {isMobile ? (language === 'vi' ? 'CHẠM ĐỂ CHỌN' : 'TAP TO CHOOSE') : (language === 'vi' ? 'ẤN PHÍM E' : 'PRESS E KEY')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scanline CRT overlay filter */}
        {/* CRT Scanline + Vignette overlay (enhanced for pixel art) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 2px',
          pointerEvents: 'none',
          opacity: 0.30,
        }}></div>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}></div>

        {/* HUD Info bar - Premium Cybernetic Dashboard */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          padding: '8px 16px',
          background: 'rgba(9, 13, 22, 0.9)',
          backdropFilter: 'blur(6px)',
          border: '1.5px solid #00f2fe',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: '"Courier New", Courier, monospace',
          color: '#00f2fe',
          display: isMobile ? 'none' : 'flex',
          gap: '16px',
          alignItems: 'center',
          pointerEvents: 'none',
          boxShadow: '0 4px 15px rgba(0, 242, 254, 0.25), inset 0 0 10px rgba(0, 242, 254, 0.1)',
          letterSpacing: '0.5px',
          fontWeight: 'bold',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe', display: 'inline-block', animation: 'blink 1s step-end infinite' }}></span>
            <span>{language === 'vi' ? 'DIỂM:' : 'XP:'} <strong style={{ color: '#fff', textShadow: '0 0 4px #00f2fe' }}>{points}</strong></span>
          </div>
          <span style={{ color: 'rgba(0, 242, 254, 0.3)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{language === 'vi' ? 'GỢI Ý:' : 'HINTS:'} <strong style={{ color: '#fff', textShadow: '0 0 4px #00f2fe' }}>{revealedHints}/{hints.length}</strong></span>
          </div>
        </div>

        {/* In-Game Dialogue window overlay - Sleek Cybernetic Terminal */}
        {dialogue?.isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(5, 8, 16, 0.96)',
            border: `2px solid ${activeNpcColor}`,
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            boxShadow: `0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px ${activeNpcColor}44`,
            backdropFilter: 'blur(8px)',
          }}>
            {/* Cyberpunk corner brackets */}
            <div style={{ position: 'absolute', top: '4px', left: '4px', width: '8px', height: '8px', borderTop: `2px solid ${activeNpcColor}`, borderLeft: `2px solid ${activeNpcColor}` }}></div>
            <div style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderTop: `2px solid ${activeNpcColor}`, borderRight: `2px solid ${activeNpcColor}` }}></div>
            <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '8px', height: '8px', borderBottom: `2px solid ${activeNpcColor}`, borderLeft: `2px solid ${activeNpcColor}` }}></div>
            <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '8px', height: '8px', borderBottom: `2px solid ${activeNpcColor}`, borderRight: `2px solid ${activeNpcColor}` }}></div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 900,
                color: activeNpcColor,
                fontFamily: '"Courier New", Courier, monospace',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textShadow: `0 0 5px ${activeNpcColor}88`,
              }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: activeNpcColor, borderRadius: '50%', boxShadow: `0 0 8px ${activeNpcColor}` }}></span>
                {uiActiveNpcName || 'HACKER GUIDE'}
              </div>
              <p style={{
                fontSize: '13px',
                color: '#e2e8f0',
                fontFamily: '"Courier New", Courier, monospace',
                lineHeight: 1.6,
                margin: 0,
                whiteSpace: 'pre-wrap',
                letterSpacing: '0.3px',
              }}>
                {typedText}
                {typingIndex < dialogue.text.length && (
                  <span style={{ display: 'inline-block', width: '8px', height: '14px', background: activeNpcColor, marginLeft: '2px', animation: 'blink 0.8s step-end infinite', boxShadow: `0 0 6px ${activeNpcColor}` }}></span>
                )}
              </p>

              {dialogue.showOptions && typingIndex >= dialogue.text.length && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleConfirmUnlock}
                    style={{
                      fontFamily: '"Courier New", Courier, monospace',
                      fontSize: '12px',
                      padding: '6px 20px',
                      background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                      border: 'none',
                      color: '#000',
                      fontWeight: 'bold',
                      borderRadius: '4px',
                      boxShadow: '0 4px 10px rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    {language === 'vi' ? 'Đồng ý' : 'Agree'} (-{points / 10} pts)
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDialogue(null);
                      dialogueIsOpenRef.current = false;
                      setTypedText('');
                    }}
                    style={{
                      fontFamily: '"Courier New", Courier, monospace',
                      fontSize: '12px',
                      padding: '6px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#cbd5e1',
                      borderRadius: '4px',
                    }}
                  >
                    {language === 'vi' ? 'Bỏ qua' : 'Skip'}
                  </button>
                </div>
              )}

              {!dialogue.showOptions && typingIndex >= dialogue.text.length && (
                <div 
                  onClick={handleInteraction}
                  style={{
                    alignSelf: 'flex-end',
                    fontSize: '10px',
                    fontFamily: '"Courier New", Courier, monospace',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginTop: '12px',
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    animation: 'pulse-glow 1.5s infinite',
                  }}
                >
                  {isMobile ? (language === 'vi' ? '[ CHẠM ĐỂ ĐÓNG ]' : '[ TAP TO CLOSE ]') : (language === 'vi' ? '[ ẤN PHÍM E HOẶC CLICK ĐỂ ĐÓNG ]' : '[ PRESS E OR CLICK TO CLOSE ]')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flag Submission Terminal Overlay - Immersive validating console */}
        {isFlagOverlayOpen && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(6, 10, 18, 0.98)',
            border: '2.5px solid #10b981',
            borderRadius: '10px',
            padding: '24px',
            width: '380px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(16, 185, 129, 0.3)',
            zIndex: 110,
            color: '#e2e8f0',
            fontFamily: '"Courier New", Courier, monospace',
            backdropFilter: 'blur(10px)',
          }}>
            {/* Custom terminal scanner line effect */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              right: '2px',
              height: '3px',
              background: 'rgba(16, 185, 129, 0.3)',
              boxShadow: '0 0 10px #10b981',
              borderRadius: '2px',
            }}></div>

            <h4 style={{
              margin: '0 0 16px 0',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              borderBottom: '1px solid rgba(16,185,129,0.3)',
              paddingBottom: '10px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              textShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
            }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
              SECURE FLAG VERIFICATION
            </h4>
            
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.6 }}>
              {language === 'vi' ? 'Nhập mã FLAG thu thập được từ bài Lab để hệ thống giải mã và cộng điểm.' : 'Enter the FLAG key harvested from the lab to decrypt and receive XP.'}
            </p>

            <input
              type="text"
              value={localFlag}
              onChange={(e) => {
                setLocalFlag(e.target.value);
              }}
              placeholder="FLAG{cyber_sec_key}"
              style={{
                width: '100%',
                background: '#030712',
                border: '1.5px solid rgba(16,185,129,0.4)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '13px',
                marginBottom: '16px',
                fontFamily: '"Courier New", Courier, monospace',
                outline: 'none',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  await handleFlagSubmit();
                }
              }}
            />

            {flagResult === 'correct' && (
              <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                [OK] ✓ {language === 'vi' ? 'Hệ thống xác thực THÀNH CÔNG!' : 'Flag verified SUCCESSFULLY!'} (+{points}{language === 'vi' ? 'đ' : 'pts'})
              </div>
            )}
            {flagResult === 'wrong' && (
              <div style={{ color: '#ff2d55', fontSize: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                [ERR] ✗ {language === 'vi' ? 'SAI LỆCH MÃ! Vui lòng thử lại.' : 'INCORRECT FLAG! Please try again.'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsFlagOverlayOpen(false);
                }}
                style={{ fontSize: '12px', padding: '6px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1' }}
              >
                {language === 'vi' ? 'HỦY' : 'CANCEL'}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleFlagSubmit}
                disabled={isSubmitting || !localFlag.trim() || labStatus === 'completed'}
                style={{
                  fontSize: '12px',
                  padding: '6px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isSubmitting ? (language === 'vi' ? 'ĐANG GỬI...' : 'SUBMITTING...') : (language === 'vi' ? 'XÁC THỰC' : 'VALIDATE')}
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
                {runtimeUrl || (language === 'vi' ? 'Runtime chưa sẵn sàng' : 'Runtime not ready')}
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
                  src={runtimeUrl}
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
          {language === 'vi' ? 'Điều khiển: Di chuyển bằng phím WASD hoặc Mũi tên. Ấn phím E khi ở gần thiết bị để tương tác.' : 'Controls: Move with WASD or Arrow keys. Press E near devices to interact.'}
        </div>
      )}
    </div>
  );
}
