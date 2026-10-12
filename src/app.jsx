import { useState, useEffect, useRef } from "react";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --crt:   #08080f;   /* phosphor black — ground */
    --crt2:  #0d0d1a;   /* panel */
    --crt3:  #151528;   /* raised panel */
    --ink:   #e8e6da;   /* phosphor white */
    --dim:   #9a97b0;   /* dimmed ink */
    --purple:#a86bff;
    --cyan:  #35e0ff;
    --pink:  #ff5c8a;
    --gold:  #ffd23f;
    --green: #52f2a0;
    --red:   #ff4d5e;
    --line:  rgba(232,230,218,0.14);
    --px:    'Press Start 2P', monospace;
    --tmn:   'VT323', monospace;
    --pad-x: 5rem;
    --sec-y: 6.5rem;
  }
  @media (max-width: 767px) {
    :root { --pad-x: 1.25rem; --sec-y: 4.5rem; }
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--crt); color: var(--ink);
    font-family: var(--tmn); font-size: 1.2rem; line-height: 1.6;
    overflow-x: hidden;
  }
  ::selection { background: var(--gold); color: var(--crt); }
  :focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }

  .px { font-family: var(--px); text-transform: uppercase; }

  /* CRT glass — scanlines + vignette over everything */
  .crt-glass {
    position: fixed; inset: 0; z-index: 9998;
    pointer-events: none;
    background:
      repeating-linear-gradient(0deg,
        rgba(0,0,0,0.30) 0px, rgba(0,0,0,0.30) 1px,
        rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px),
      radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%);
    opacity: 0.35;
  }
  .scanline {
    pointer-events: none;
    background: repeating-linear-gradient(0deg,
      rgba(0,0,0,0.30) 0px, rgba(0,0,0,0.30) 1px,
      rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px);
  }

  @keyframes blink  { 0%,100% { opacity: 1; } 50% { opacity: 0.15; } }
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes flicker {
    0%, 100% { opacity: 1; }
    92% { opacity: 1; } 93% { opacity: 0.6; } 94% { opacity: 1; }
    97% { opacity: 0.85; } 98% { opacity: 1; }
  }

  .blink { animation: blink 1.1s steps(2, start) infinite; }
  .crt-flicker { animation: flicker 6s linear infinite; }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--crt); }
  ::-webkit-scrollbar-thumb { background: var(--crt3); border: 1px solid var(--line); }

  @media (prefers-reduced-motion: reduce) {
    .blink, .crt-flicker { animation: none !important; }
    .marquee-run { animation: none !important; }
    * { transition-duration: 0.01ms !important; }
    html { scroll-behavior: auto; }
  }
`;

/* ══════════════════════════════════════════
   PIXEL SPRITE SYSTEM
═════════════════════════════════════════════ */
const PX = {
  W: "#e8e6da", P: "#a86bff", C: "#35e0ff", G: "#ffd23f",
  M: "#ff5c8a", E: "#52f2a0", R: "#ff4d5e", B: "#08080f",
  A: "rgba(232,230,218,0.40)",
};

const ART = {
  note: [
    "..GGG...",
    "..GGG...",
    "..GGG...",
    "..GGG...",
    "..GG.GG.",
    "..GGGGGG",
    "...GGGG.",
    "........",
  ],
  school: [
    "...CC...",
    "..CCCC..",
    ".CWWWWC.",
    "CWWWWWWC",
    "CWWWWWWC",
    "CWWGWWWC",
    "CWWGWWWC",
    "CCCCCCCC",
  ],
  key: [
    "GGGG....",
    "G...GGGG",
    "GGGGGG..",
    "......G.",
    "......G.",
    "......G.",
    ".....G..",
    "........",
  ],
  trophy: [
    ".GGGGGG.",
    "GWWWWWWG",
    "GWWWWWWG",
    ".GWWWWG.",
    "..GGGG..",
    "..G..G..",
    ".GG..GG.",
    "........",
  ],
  puzzle: [
    "..CCCC..",
    "..C....C",
    "..C.CCCC",
    "..C..C..",
    "CCCCCCCC",
    "C....C..",
    "C....C..",
    "CCCCCCCC",
  ],
  lozenge: [
    "C......C",
    "CC....CC",
    ".CC..CC.",
    "..CCCC..",
    "..CCCC..",
    ".CC..CC.",
    "CC....CC",
    "C......C",
  ],
  medal: [
    "..PP....",
    "..PP....",
    ".PP.PP..",
    "..GGGG..",
    ".GWWWWG.",
    "GWWGGWWG",
    "GWWGGWWG",
    ".GWWWWG.",
  ],
  github: [
    "..WWWW..",
    ".WWWWWW.",
    "WWWBWBWW",
    "WWWWWWWW",
    "WWWWWWWW",
    ".WWWWWW.",
    "..WWWW..",
    "........",
  ],
  mail: [
    "GGGGGGGG",
    "G......G",
    "G.G..G.G",
    "G..GG..G",
    "G.GG.G.G",
    "G......G",
    "GGGGGGGG",
    "........",
  ],
  monitor: [
    "CCCCCCCC",
    "C.CCCC.C",
    "C.CWWC.C",
    "C.CWWC.C",
    "C.CCCC.C",
    "CCCCCCCC",
    "..CCCC..",
    "........",
  ],
  diamond: [
    "...P...",
    "..P.P..",
    ".P...P.",
    "P.....P",
    ".P...P.",
    "..P.P..",
    "...P...",
    "........",
  ],
};

function PixelSprite({ art, size = 24, label, colorMap = PX }) {
  const rows = ART[art] || art;
  const h = rows.length, w = rows[0].length;
  const cells = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const fill = colorMap[ch];
      if (fill) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={size} height={size}
      shapeRendering="crispEdges"
      role={label ? "img" : "presentation"}
      aria-label={label}
      style={{ display: "block", imageRendering: "pixelated", flexShrink: 0 }}
    >{cells}</svg>
  );
}

/* ══════════════════════════════════════════
   HOOKS
═════════════════════════════════════════════ */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = e => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = e => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(14px)",
        transition: "opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1)",
        transitionDelay: `${delay}ms`,
      }}
    >{children}</div>
  );
}

/* ══════════════════════════════════════════
   NOTE HIGHWAY CANVAS — the signature motion
═════════════════════════════════════════════ */
function NoteHighwayCanvas({ reduced }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const LANES = 8;
    const COLORS = [
      [168, 107, 255], [53, 224, 255], [255, 92, 138], [82, 242, 160],
      [53, 224, 255], [168, 107, 255], [255, 210, 63], [168, 107, 255],
    ];
    let notes = [], raf;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const lane = Math.floor(Math.random() * LANES);
      const [r, g, b] = COLORS[lane];
      notes.push({
        lane,
        x: ((lane + 0.5) / LANES) * window.innerWidth,
        y: -30,
        speed: 1.2 + Math.random() * 1.4,
        r, g, b,
        size: 4 + Math.random() * 6,
        life: 1,
      });
    };

    const judgeY = () => window.innerHeight * 0.86;

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // lane dividers
      ctx.strokeStyle = "rgba(232,230,218,0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        const x = Math.round((i / LANES) * window.innerWidth) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, window.innerHeight); ctx.stroke();
      }

      // judgement line
      const jy = judgeY();
      ctx.fillStyle = "rgba(255,210,63,0.35)";
      ctx.fillRect(0, jy, window.innerWidth, 2);

      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.speed;
        if (n.y > window.innerHeight + 30) { notes.splice(i, 1); continue; }
        const dist = Math.abs(n.y - jy);
        const flash = dist < 20 ? (1 - dist / 20) * 0.5 : 0;
        ctx.fillStyle = `rgba(${n.r},${n.g},${n.b},${0.5 + flash})`;
        ctx.fillRect(Math.round(n.x - n.size / 2), Math.round(n.y - n.size / 2), n.size, n.size);
      }

      if (Math.random() < 0.10) spawn();
      raf = requestAnimationFrame(draw);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.strokeStyle = "rgba(232,230,218,0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < LANES; i++) {
        const x = Math.round((i / LANES) * window.innerWidth) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, window.innerHeight); ctx.stroke();
      }
      const jy = judgeY();
      ctx.fillStyle = "rgba(255,210,63,0.35)";
      ctx.fillRect(0, jy, window.innerWidth, 2);
    };

    window.addEventListener("resize", resize);
    resize();
    for (let i = 0; i < 26; i++) { spawn(); notes[notes.length - 1].y = Math.random() * window.innerHeight; }

    if (reduced) { drawStatic(); }
    else { raf = requestAnimationFrame(draw); }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        opacity: 0.55, width: "100vw", height: "100vh",
        imageRendering: "pixelated",
      }}
    />
  );
}

/* ══════════════════════════════════════════
   TYPEWRITER CYCLE
═════════════════════════════════════════════ */
const ROLES = ["FULL-STACK DEV", "COMPETITIVE PROGRAMMER", "STUDENT"];

function TypewriterCycle() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = ROLES[idx];

    if (!deleting && text === target) {
      const t = setTimeout(() => setDeleting(true), 1600);
      return () => clearTimeout(t);
    }

    const speed = deleting ? 28 : 55;
    const t = setTimeout(() => {
      if (deleting) {
        setText(prev => prev.slice(0, -1));
        if (text.length === 1) {
          setDeleting(false);
          setText("");
          setIdx(i => (i + 1) % ROLES.length);
        }
      } else {
        setText(target.slice(0, text.length + 1));
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, idx]);

  return (
    <p style={{ fontFamily: "var(--tmn)", fontSize: "1.25rem", color: "var(--cyan)", letterSpacing: "0.04em", minHeight: "1.6em" }}>
      &gt; {text}<span className="blink" style={{ color: "var(--gold)" }}>▌</span>
    </p>
  );
}

/* ══════════════════════════════════════════
   NAV — HUD
═════════════════════════════════════════════ */
const SECTIONS = ["home", "works", "skills", "achievements", "contact"];
const SECTION_LABELS = { home: "TITLE", works: "WORKS", skills: "SKILLS", achievements: "SCORES", contact: "CONTACT" };

function Nav() {
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Adjust state during render (sanctioned): close the menu the moment the
  // viewport stops being mobile, without a state-setting effect.
  const [prevMobile, setPrevMobile] = useState(isMobile);
  if (prevMobile !== isMobile) {
    setPrevMobile(isMobile);
    if (!isMobile) setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.35 }
    );
    SECTIONS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const go = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const screenNo = String(SECTIONS.indexOf(active) + 1).padStart(2, "0");

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.8rem var(--pad-x)",
        background: "rgba(8,8,15,0.92)",
        borderBottom: "1px solid var(--line)",
      }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem", padding: 0 }}>
          <PixelSprite art={ART.diamond} size={16} />
          <span className="px" style={{ color: "var(--ink)", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
            YUMO<span style={{ color: "var(--gold)" }}>_</span>
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
          {!isMobile && (
            <ul style={{ listStyle: "none", display: "flex", gap: "1.6rem" }}>
              {SECTIONS.map(id => (
                <li key={id}>
                  <button onClick={() => go(id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "var(--px)", fontSize: "0.55rem", letterSpacing: "0.06em",
                    color: active === id ? "var(--gold)" : "var(--dim)",
                    padding: "0.2rem 0",
                  }}>{SECTION_LABELS[id]}</button>
                </li>
              ))}
            </ul>
          )}
          <span className="px" style={{ color: "var(--dim)", fontSize: "0.5rem", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            SCREEN {screenNo}/0{SECTIONS.length}
          </span>

          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{
                background: "none", border: "1px solid var(--line)", cursor: "pointer",
                color: "var(--ink)", padding: "0.4rem 0.5rem", fontFamily: "var(--px)", fontSize: "0.5rem",
              }}
            >{menuOpen ? "CLOSE" : "MENU"}</button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 299,
          background: "rgba(8,8,15,0.98)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "2rem",
        }}>
          {SECTIONS.map(id => (
            <button key={id} onClick={() => go(id)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--px)", fontSize: "1rem", letterSpacing: "0.1em",
              color: active === id ? "var(--gold)" : "var(--ink)",
            }}>{SECTION_LABELS[id]}</button>
          ))}
          <div style={{ marginTop: "1rem" }}><PixelSprite art={ART.diamond} size={18} /></div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   BUTTONS
═════════════════════════════════════════════ */
function ArcadeButton({ children, href, onClick, gold = false, ghost = false, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: "0.6rem",
    fontFamily: "var(--px)", fontSize: "0.62rem", letterSpacing: "0.06em",
    textDecoration: "none", cursor: "pointer",
    padding: "0.85rem 1.4rem",
    border: "none",
    background: gold ? "var(--gold)" : ghost ? "transparent" : "#7c3aed",
    color: gold ? "var(--crt)" : ghost ? "var(--ink)" : "#fff",
    borderBottom: gold ? "4px solid #b8962c" : ghost ? "4px solid var(--crt3)" : "4px solid #6b3fd0",
    transition: "transform .12s ease, background .12s ease",
  };
  const pressed = { transform: "translateY(2px)", boxShadow: "inset 0 3px 0 rgba(0,0,0,0.25)" };
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const attrs = {
    href, onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => { setHover(false); setDown(false); },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    style: {
      ...base,
      ...(ghost && hover ? { borderBottomColor: "var(--purple)" } : {}),
      ...(down ? pressed : {}),
      ...style,
    },
  };
  return href ? <a {...attrs}>{children}</a> : <button type="button" {...attrs}>{children}</button>;
}

function Chip({ children, color = "var(--cyan)" }) {
  const [hov, setHov] = useState(false);
  return (
    <span
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        background: "var(--crt2)",
        border: `1px solid ${hov ? color : "var(--line)"}`,
        padding: "0.35rem 0.7rem",
        fontFamily: "var(--tmn)", fontSize: "1rem", letterSpacing: "0.02em",
        color: hov ? color : "var(--ink)",
        transition: "border-color .15s, color .15s",
      }}
    >
      <span style={{ width: 7, height: 7, background: color, display: "inline-block", flexShrink: 0 }} />
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════
   HERO — TITLE SCREEN
═════════════════════════════════════════════ */
function Hero() {
  const reduced = useReducedMotion();
  return (
    <section id="home" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "6rem var(--pad-x) 3rem",
      position: "relative", zIndex: 1,
    }}>
      <NoteHighwayCanvas reduced={reduced} />
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "linear-gradient(180deg, rgba(8,8,15,0.82) 0%, rgba(8,8,15,0.55) 45%, rgba(8,8,15,0.9) 100%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 900, width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.6rem" }}>
          <span className="px" style={{ color: "var(--green)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>YUMO-YMSPACE PRESENTS</span>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span className="px blink" style={{ color: "var(--gold)", fontSize: "0.55rem", letterSpacing: "0.1em" }}>INSERT COIN</span>
        </div>

        <h1 className="px crt-flicker" style={{
          fontSize: "clamp(2.4rem, 10vw, 5.2rem)",
          lineHeight: 1.05, letterSpacing: "0.02em",
          color: "var(--ink)",
          marginBottom: "1.2rem",
          textShadow: "0 0 24px rgba(232,230,218,0.30), 0 0 60px rgba(232,230,218,0.12)",
        }}>
          YUMO<span style={{ color: "var(--gold)", textShadow: "0 0 20px rgba(255,210,63,0.6)" }}>.</span>
        </h1>

        <TypewriterCycle />

        <p style={{
          color: "var(--dim)", fontSize: "1.2rem", lineHeight: 1.65,
          maxWidth: 560, marginBottom: "2.4rem",
        }}>
          I am a full-stack developer focused on building functional, user-centric
          web applications. Currently shaping digital spaces for student ecosystems
          and creating interactive web games.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <ArcadeButton gold href="#works" onClick={e => { e.preventDefault(); document.getElementById("works")?.scrollIntoView({ behavior: "smooth" }); }}>
            ▶ VIEW MY WORK
          </ArcadeButton>
          <ArcadeButton ghost href="https://github.com/yumo-ymspace" target="_blank" rel="noreferrer">
            GITHUB ↗
          </ArcadeButton>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   INTRO STATEMENT
═════════════════════════════════════════════ */
function Hi({ children, color }) {
  return <span style={{ color, fontWeight: 400 }}>{children}</span>;
}

function IntroStatement() {
  return (
    <div style={{ padding: "5rem var(--pad-x)", borderTop: "1px solid var(--line)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <p style={{
          fontSize: "clamp(1.4rem, 3.5vw, 2rem)", lineHeight: 1.5, maxWidth: 860,
          color: "var(--ink)",
        }}>
          As a <Hi color="var(--cyan)">dedicated</Hi> full-stack developer, I specialize
          in architecting <Hi color="var(--purple)">complex</Hi> systems and translating
          them into <Hi color="var(--green)">clean</Hi> user interfaces.
        </p>
      </Reveal>
    </div>
  );
}

/* ══════════════════════════════════════════
   WORKS — ARCADE HALL
═════════════════════════════════════════════ */
const PROJECTS = [
  {
    art: "note", accent: "var(--gold)", name: "RhythmMania",
    url: "https://rhythm-mania.com", label: "rhythm-mania.com",
    desc: "An engaging web-based rhythm game experience with low-latency input parsing and an osu!mania-like experience. Built with pure TypeScript and Canvas API.",
    tags: ["TypeScript", "Canvas API", "osu!mania-like"],
    image: "/assets/RM.png",
  },
  {
    art: "school", accent: "var(--cyan)", name: "Zhonghua Secondary\nUnofficial Site",
    url: "https://zhonghuasec.school", label: "zhonghuasec.school",
    desc: "A modern, high-performance, community-driven web space built for Zhonghua Secondary — just a site I made for fun for my school.",
    tags: ["Frontend", "Web Performance", "HTML / CSS"],
    image: "/assets/ZH.png",
  },
  {
    art: "key", accent: "var(--purple)", name: "ZPortal",
    url: "https://zportal.zhonghuasec.school", label: "zportal.zhonghuasec.school",
    desc: "A customized, smart dashboard for student resource coordination and scheduling — programmed using PHP with a MySQL database.",
    tags: ["PHP", "MySQL", "Dashboard"],
    image: "/assets/ZP.png",
  },
];

function Works() {
  return (
    <section id="works" style={{ padding: "var(--sec-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <SectionHead no="02" title="MY WORKS" sub="A selection of my recent projects — step up to each cabinet." />
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.6rem" }}>
        {PROJECTS.map((p, i) => (
          <Reveal key={i} delay={i * 90}>
            <Cabinet project={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Cabinet({ project: p }) {
  const [power, setPower] = useState(false);
  return (
    <a
      href={p.url} target="_blank" rel="noreferrer"
      onMouseEnter={() => setPower(true)} onMouseLeave={() => setPower(false)}
      onFocus={() => setPower(true)} onBlur={() => setPower(false)}
      aria-label={`${p.name.replace(/\n/g, " ")} — visit site`}
      style={{
        display: "flex", flexDirection: "column",
        textDecoration: "none", color: "inherit",
        background: "var(--crt2)",
        border: `1px solid ${power ? p.accent : "var(--line)"}`,
        boxShadow: power ? `0 0 0 1px ${p.accent}, 0 0 40px ${power ? "rgba(168,107,255,0.25)" : "rgba(0,0,0,0)"}` : "none",
        transition: "border-color .25s, box-shadow .25s",
      }}
    >
      {/* Marquee */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "0.6rem", padding: "0.7rem 1rem",
        background: "var(--crt3)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0 }}>
          <PixelSprite art={p.art} size={20} />
          <span className="px" style={{ color: p.accent, fontSize: "0.55rem", letterSpacing: "0.04em", lineHeight: 1.5, whiteSpace: "pre-line" }}>{p.name}</span>
        </div>
        <span className="px" style={{ color: "var(--dim)", fontSize: "0.45rem", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
          {power ? "NOW PLAYING" : "PRESS START"}
        </span>
      </div>

      {/* Screen */}
      <div style={{
        position: "relative", aspectRatio: "4 / 3", background: "#000",
        borderBottom: "1px solid var(--line)",
        overflow: "hidden",
      }}>
        {p.image ? (
          <img src={p.image} alt={`${p.name.replace(/\n/g, " ")} screenshot`}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.8rem",
          }}>
            <PixelSprite art={p.art} size={36} />
            <span className="px" style={{ color: "var(--dim)", fontSize: "0.5rem" }}>SCREENSHOT</span>
          </div>
        )}
        <div className="scanline" style={{ position: "absolute", inset: 0, opacity: power ? 0.5 : 0.9, transition: "opacity .25s" }} />
        {power && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            boxShadow: "inset 0 0 60px rgba(232,230,218,0.10)",
          }} />
        )}
      </div>

      {/* Control deck */}
      <div style={{ padding: "1.1rem 1rem", display: "flex", flexDirection: "column", gap: "0.9rem", flex: 1 }}>
        <p style={{ color: "var(--dim)", fontSize: "1.05rem", lineHeight: 1.55, flex: 1 }}>{p.desc}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {p.tags.map(t => <Chip key={t} color={p.accent}>{t}</Chip>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.2rem" }}>
          <span style={{ color: "var(--dim)", fontFamily: "var(--tmn)", fontSize: "1rem" }}>↗ {p.label}</span>
          <span className="px" style={{ color: p.accent, fontSize: "0.5rem", letterSpacing: "0.05em" }}>PLAY ▸</span>
        </div>
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════
   SECTION HEAD
═════════════════════════════════════════════ */
function SectionHead({ no, title, sub }) {
  return (
    <div style={{ marginBottom: "2.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.9rem" }}>
        <span style={{ width: 10, height: 10, background: "var(--gold)", display: "inline-block", flexShrink: 0 }} />
        <span className="px" style={{ color: "var(--dim)", fontSize: "0.5rem", letterSpacing: "0.1em", flexShrink: 0 }}>
          SCREEN {no}
        </span>
        <span style={{ flex: 1, height: 1, background: "var(--line)", minWidth: "2rem" }} />
        <h2 className="px" style={{
          fontSize: "clamp(1.1rem, 3vw, 1.5rem)", letterSpacing: "0.04em",
          color: "var(--ink)", lineHeight: 1.4,
        }}>{title}</h2>
      </div>
      {sub && <p style={{ color: "var(--dim)", fontSize: "1.15rem", lineHeight: 1.6, maxWidth: 560 }}>{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════
   OBSESSION QUOTE
═════════════════════════════════════════════ */
function ObsessionQuote() {
  return (
    <div style={{ padding: "4rem var(--pad-x)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <p className="px" style={{
          fontSize: "clamp(0.8rem, 2.2vw, 1.05rem)", lineHeight: 1.9, maxWidth: 760,
          letterSpacing: "0.03em", color: "var(--ink)",
        }}>
          I have a strong obsession for{" "}
          <span style={{ color: "var(--cyan)" }}>algorithmic precision</span>{" "}
          and <span style={{ color: "var(--purple)" }}>clean system design</span>.
        </p>
      </Reveal>
    </div>
  );
}

/* ══════════════════════════════════════════
   SKILLS — LOADOUT
═════════════════════════════════════════════ */
const SKILL_GROUPS = [
  { label: "LANGUAGES", color: "var(--gold)", items: ["Python", "JavaScript", "TypeScript", "PHP"] },
  { label: "TOOLS & FRAMEWORKS", color: "var(--purple)", items: ["React", "Node.js", "Vite", "Django", "Flask", "MySQL", "SQL"] },
  { label: "DOMAIN FOCUS", color: "var(--cyan)", items: ["Full-Stack Dev", "Competitive Programming", "Canvas / Game Dev", "DB Design", "UI/UX"] },
];

function Skills() {
  return (
    <section id="skills" style={{ padding: "var(--sec-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <SectionHead no="03" title="PLAYER LOADOUT" sub="Crafting user experiences with modern full-stack architecture and disciplined problem-solving." />
      </Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: "2.6rem" }}>
        {SKILL_GROUPS.map((g, gi) => (
          <Reveal key={gi} delay={gi * 70}>
            <div>
              <p className="px" style={{
                fontSize: "0.58rem", letterSpacing: "0.08em",
                color: g.color, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.6rem",
              }}>
                <span style={{ width: 8, height: 8, background: g.color, display: "inline-block" }} />
                {g.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                {g.items.map(item => <Chip key={item} color={g.color}>{item}</Chip>)}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={150}>
        <div style={{ marginTop: "3.5rem", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <Marquee items={["Python", "JavaScript", "TypeScript", "PHP", "React", "Node.js", "Vite", "Django", "Flask", "MySQL", "SQL"]} />
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════
   ACHIEVEMENTS — HIGH SCORE TABLE
═════════════════════════════════════════════ */
const ACHIEVEMENTS = [
  { art: "trophy", code: "NYTC 2026", name: "National Youth Tech Championship", result: "Champion (1st Place)", desc: "Winner of the 2026 national technology competition." },
  { art: "monitor", code: "NRC 2026", name: "National Robotics Games", result: "Overall Champion (Secondary) & Best Robot Performance (Secondary)", desc: "Champion robotics run in the secondary category with best robot performance." },
  { art: "puzzle", code: "BEBRAS 2025 & 2026", name: "Bebras Computational Thinking Challenge", result: "Gold & Silver", desc: "International challenge testing computational thinking skills." },
  { art: "lozenge", code: "NJIO 2025", name: "National Junior Informatics Olympiad", result: "Gold", desc: "Singapore's national-level algorithmic programming olympiad." },
  { art: "medal", code: "IJIO 2026", name: "International Junior Informatics Olympiad", result: "Bronze", desc: "Brought algorithmic expertise to the international competitive programming stage." },
];

function Achievements() {
  return (
    <section id="achievements" style={{ padding: "var(--sec-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <SectionHead no="04" title="HIGH SCORES" sub="Sharpening problem-solving through competitive programming and computational thinking championships." />
      </Reveal>
      <Reveal delay={80}>
        <div style={{ border: "1px solid var(--line)", background: "var(--crt2)" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.8rem",
            padding: "0.7rem 1.1rem", background: "var(--crt3)", borderBottom: "1px solid var(--line)",
          }}>
            <span className="px" style={{ color: "var(--gold)", fontSize: "0.5rem" }}>★ HIGH SCORE</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
            <span className="px" style={{ color: "var(--dim)", fontSize: "0.45rem" }}>1P</span>
          </div>
          {ACHIEVEMENTS.map((a, i) => (
            <div key={a.code} style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1.1rem 1.1rem",
              borderBottom: i < ACHIEVEMENTS.length - 1 ? "1px solid var(--line)" : "none",
              background: i % 2 === 1 ? "rgba(232,230,218,0.03)" : "transparent",
            }}>
              <span className="px" style={{ color: "var(--dim)", fontSize: "0.55rem", width: 34, flexShrink: 0 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ width: 26, flexShrink: 0, display: "flex", justifyContent: "center" }}>
                <PixelSprite art={a.art} size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="px" style={{ color: "var(--gold)", fontSize: "0.55rem", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>{a.code}</div>
                <div style={{ fontFamily: "var(--tmn)", fontSize: "1.1rem", color: "var(--ink)", lineHeight: 1.35 }}>{a.name}</div>
                <div className="px" style={{ color: "var(--green)", fontSize: "0.5rem", letterSpacing: "0.05em", marginTop: "0.35rem" }}>{a.result}</div>
                <div style={{ color: "var(--dim)", fontSize: "0.98rem", lineHeight: 1.5, marginTop: "0.2rem" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════
   CONTACT — INSERT COIN
═════════════════════════════════════════════ */
function Contact() {
  return (
    <section id="contact" style={{ padding: "var(--sec-y) var(--pad-x) 5rem", position: "relative", zIndex: 1, textAlign: "center" }}>
      <Reveal>
        <p className="px blink" style={{ color: "var(--gold)", fontSize: "0.6rem", letterSpacing: "0.1em", marginBottom: "1.2rem" }}>
          INSERT COIN TO CONTINUE
        </p>
        <h2 className="px" style={{
          fontSize: "clamp(1.2rem, 4vw, 1.9rem)", letterSpacing: "0.04em",
          color: "var(--ink)", marginBottom: "1rem", lineHeight: 1.5,
        }}>INTERESTED IN<br />COLLABORATION?</h2>
        <p style={{ color: "var(--dim)", marginBottom: "2.2rem", fontSize: "1.15rem", maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
          Reach out on GitHub or visit ZPortal — always open to building something great.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <ArcadeButton gold href="https://github.com/yumo-ymspace" target="_blank" rel="noreferrer">GITHUB →</ArcadeButton>
          <ArcadeButton ghost href="https://zportal.zhonghuasec.school" target="_blank" rel="noreferrer">ZPORTAL →</ArcadeButton>
          <ArcadeButton ghost href="mailto:yumo@ymspace.cloud">EMAIL ME</ArcadeButton>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <div style={{ marginTop: "3.5rem", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          <Marquee
            items={["Full-Stack Development", "Competitive Programming", "Rhythm Game Dev", "Python & TypeScript", "React & Node.js", "Clean Architecture", "Algorithmic Efficiency", "Student Ecosystems"]}
            accent
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════
   FOOTER
═════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{
      background: "var(--crt2)", borderTop: "1px solid var(--line)",
      padding: "3rem var(--pad-x)", position: "relative", zIndex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
        <div>
          <div className="px" style={{ color: "var(--ink)", fontSize: "1rem", letterSpacing: "0.05em" }}>
            YUMO<span style={{ color: "var(--gold)" }}>_</span>
          </div>
          <div style={{ color: "var(--dim)", fontSize: "1.05rem", marginTop: "0.5rem" }}>
            "Striving for clean architecture and algorithmic efficiency."
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <SocialPill href="https://github.com/yumo-ymspace" label="@yumo-ymspace" art="github" />
          <SocialPill href="https://zportal.zhonghuasec.school" label="ZPortal" art="monitor" />
          <SocialPill href="mailto:yumo@ymspace.cloud" label="yumo@ymspace.cloud" art="mail" />
        </div>
      </div>
      <div style={{
        marginTop: "2.5rem", paddingTop: "1.5rem",
        borderTop: "1px solid var(--line)",
        textAlign: "center", color: "var(--dim)", fontSize: "0.95rem",
      }}>
        <span className="px" style={{ fontSize: "0.45rem", letterSpacing: "0.1em", marginRight: "0.6rem" }}>GAME OVER</span>
        © 2026 Yumo(yumo-ymspace) All rights reserved.
      </div>
    </footer>
  );
}

function SocialPill({ href, label, art }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} target="_blank" rel="noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.55rem",
        background: "var(--crt3)",
        border: `1px solid ${hov ? "var(--gold)" : "var(--line)"}`,
        padding: "0.5rem 0.8rem",
        fontFamily: "var(--tmn)", fontSize: "1rem",
        color: hov ? "var(--gold)" : "var(--dim)",
        textDecoration: "none", transition: "border-color .15s, color .15s",
      }}
    >
      <PixelSprite art={art} size={18} /> {label}
    </a>
  );
}

/* ══════════════════════════════════════════
   MARQUEE
═════════════════════════════════════════════ */
function Marquee({ items, speed = 22, accent = false }) {
  const col = accent ? "var(--purple)" : "var(--dim)";
  const blocks = items.map((it, i) => (
    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "2.4rem", paddingRight: "2.4rem" }}>
      <span style={{ whiteSpace: "nowrap", fontFamily: "var(--tmn)", fontSize: "1.05rem", letterSpacing: "0.06em", color: col }}>{it}</span>
      <PixelSprite art={ART.diamond} size={10} />
    </span>
  ));
  const doubled = [0, 1].flatMap(half => blocks.map((b, i) => <span key={`${half}-${i}`} style={{ display: "contents" }}>{b}</span>));
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", padding: "1rem 0", width: "100%" }}>
      <span className="marquee-run" style={{ display: "inline-block", animation: `marquee ${speed}s linear infinite`, willChange: "transform" }}>
        {doubled}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   APP
═════════════════════════════════════════════ */
export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="crt-glass" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <IntroStatement />
        <Works />
        <ObsessionQuote />
        <Skills />
        <Achievements />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
