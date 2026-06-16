import { useState, useEffect, useRef, useLayoutEffect } from "react";

/* ══════════════════════════════════════════
   GLOBAL CSS
══════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:      #0b0d14;
    --bg2:     #10121c;
    --bg3:     #14172a;
    --accent:  #7c5cfc;
    --accent2: #36c5f0;
    --text:    #eeeaf9;
    --muted:   #7a7e9a;
    --border:  rgba(124,92,252,0.18);
    --pad-x:   5rem;
    --section-y: 7rem;
  }
  @media (max-width: 767px) {
    :root {
      --pad-x: 1.25rem;
      --section-y: 4rem;
    }
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; overflow-x: hidden; }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:var(--bg2)}
  ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:3px}
`;

/* ══════════════════════════════════════════
   MOBILE HOOK
══════════════════════════════════════════ */
function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = e => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

/* ══════════════════════════════════════════
   RHYTHM CANVAS  — crisp circles + rings
══════════════════════════════════════════ */
function RhythmCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const COLS = 16;
    let W, H, notes = [], raf;
    const PURPLE = [124, 92, 252];
    const CYAN   = [54, 197, 240];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };

    const spawn = () => {
      const col = Math.floor(Math.random() * COLS);
      const isRing = Math.random() > 0.55;
      const col3 = Math.random() > 0.5 ? PURPLE : CYAN;
      notes.push({
        x: (col / (COLS - 1)) * W,
        y: -14,
        speed: 0.5 + Math.random() * 1.0,
        r: isRing ? 5 + Math.random() * 4 : 2.5 + Math.random() * 2.5,
        ring: isRing,
        col3,
        opacity: isRing ? 0.35 + Math.random() * 0.3 : 0.55 + Math.random() * 0.35,
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(124,92,252,0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < COLS; i++) {
        const x = Math.round((i / (COLS - 1)) * W) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }

      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y += n.speed;
        const [r, g, b] = n.col3;

        if (n.ring) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${n.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(${r},${g},${b},${n.opacity * 0.7})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowColor  = `rgba(${r},${g},${b},0.7)`;
          ctx.shadowBlur   = 7;
          ctx.fillStyle = `rgba(${r},${g},${b},${n.opacity})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        if (n.y > H + 20) notes.splice(i, 1);
      }

      if (Math.random() < 0.055) spawn();
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    for (let i = 0; i < 30; i++) {
      spawn();
      if (notes.length > 0) notes[notes.length - 1].y = Math.random() * H;
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none", opacity: 0.5,
        width: "100vw", height: "100vh",
      }}
    />
  );
}

/* ══════════════════════════════════════════
   TYPEWRITER CYCLE
══════════════════════════════════════════ */
const PHRASES = ["Full-Stack Dev", "Competitive Programmer", "Student"];

function TypewriterCycle() {
  const [idx,      setIdx]      = useState(0);
  const [text,     setText]     = useState("");
  const [deleting, setDeleting] = useState(false);
  const [waiting,  setWaiting]  = useState(false);

  useEffect(() => {
    const target = PHRASES[idx];
    if (waiting) {
      const t = setTimeout(() => { setWaiting(false); setDeleting(true); }, 1400);
      return () => clearTimeout(t);
    }
    if (!deleting && text === target) {
      setWaiting(true);
      return;
    }
    const speed = deleting ? 38 : 68;
    const t = setTimeout(() => {
      if (deleting) {
        setText(prev => prev.slice(0, -1));
        if (text.length === 1) {
          setDeleting(false);
          setIdx(i => (i + 1) % PHRASES.length);
        }
      } else {
        setText(target.slice(0, text.length + 1));
      }
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, waiting, idx]);

  return (
    <p style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.95rem", color: "var(--accent2)",
      letterSpacing: "0.05em", marginBottom: "1.5rem",
      minHeight: "1.5em",
    }}>
      {text}
      <span style={{ animation: "blink 1s step-end infinite", color: "var(--accent)", marginLeft: 1 }}>▮</span>
    </p>
  );
}

/* ══════════════════════════════════════════
   SCROLL-REVEAL
══════════════════════════════════════════ */
function Reveal({ children, delay = 0, from = "bottom", style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const transforms = {
    bottom: vis ? "translateY(0)"   : "translateY(40px)",
    left:   vis ? "translateX(0)"   : "translateX(-40px)",
    right:  vis ? "translateX(0)"   : "translateX(40px)",
    scale:  vis ? "scale(1)"        : "scale(0.92)",
  };

  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: transforms[from] || transforms.bottom,
      transition: `opacity 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms,
                   transform 0.8s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════
   NAV  — desktop links + mobile hamburger
══════════════════════════════════════════ */
function Nav() {
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const LINKS = ["home", "works", "skills", "achievements", "contact"];

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.4 }
    );
    LINKS.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const go = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.1rem var(--pad-x)",
        background: "rgba(11,13,20,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}>
        <button onClick={() => go("home")} style={logoStyle}>
          yumo<span style={{ color: "var(--accent)" }}>.</span>
        </button>

        {/* Desktop links */}
        {!isMobile && (
          <ul style={{ listStyle: "none", display: "flex", gap: "2.5rem" }}>
            {LINKS.map(l => (
              <li key={l}>
                <button onClick={() => go(l)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.73rem", letterSpacing: "0.1em", textTransform: "uppercase",
                  color: active === l ? "var(--text)" : "var(--muted)",
                  transition: "color 0.2s", padding: 0,
                }}>{l}</button>
              </li>
            ))}
          </ul>
        )}

        {/* Hamburger button */}
        {isMobile && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text)", padding: "0.4rem",
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center", gap: "5px",
            }}
          >
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "var(--text)", borderRadius: 2,
              transition: "transform 0.25s, opacity 0.25s",
              transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none",
            }} />
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "var(--text)", borderRadius: 2,
              transition: "opacity 0.2s",
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              display: "block", width: 22, height: 1.5,
              background: "var(--text)", borderRadius: 2,
              transition: "transform 0.25s, opacity 0.25s",
              transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none",
            }} />
          </button>
        )}
      </nav>

      {/* Mobile full-screen menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 299,
          background: "rgba(11,13,20,0.97)", backdropFilter: "blur(24px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "2.8rem",
          animation: "slideDown 0.2s ease",
        }}>
          {LINKS.map((l, i) => (
            <button key={l} onClick={() => go(l)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1.15rem", letterSpacing: "0.18em", textTransform: "uppercase",
              color: active === l ? "var(--accent)" : "var(--text)",
              transition: "color 0.2s",
              opacity: 1,
              animation: `fadeUp 0.35s cubic-bezier(.16,1,.3,1) ${i * 60}ms both`,
            }}>{l}</button>
          ))}
        </div>
      )}
    </>
  );
}
const logoStyle = {
  background: "none", border: "none", cursor: "pointer",
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 700, fontSize: "1.3rem", letterSpacing: "-0.5px",
  color: "var(--text)",
};

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
function Hero() {
  return (
    <section id="home" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "0 var(--pad-x)", paddingTop: "5rem",
      position: "relative", zIndex: 1,
    }}>
      <div style={{ maxWidth: 820, width: "100%" }}>
        <Reveal delay={0}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem", color: "var(--accent2)",
            letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem",
          }}>Hello 👋</p>
        </Reveal>
        <Reveal delay={100}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(3rem, 12vw, 7rem)",
            fontWeight: 700, lineHeight: 1, letterSpacing: "-3px",
            marginBottom: "1.2rem",
          }}>
            I am<br />
            <span style={{
              background: "linear-gradient(110deg, var(--accent) 30%, var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Yumo</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <TypewriterCycle />
        </Reveal>
        <Reveal delay={280}>
          <p style={{
            fontSize: "1.05rem", color: "var(--muted)", lineHeight: 1.8,
            maxWidth: 560, marginBottom: "2.5rem",
          }}>
            Building functional, user-centric web applications and solving complex
            algorithmic challenges — one commit at a time.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <a href="https://github.com/yumo-ymspace" target="_blank" style={btnPrimary}>
              GitHub Profile ↗
            </a>
            <button
              onClick={() => document.getElementById("works")?.scrollIntoView({ behavior: "smooth" })}
              style={btnGhost}
            >View My Work</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   INTRO STATEMENT
══════════════════════════════════════════ */
function IntroStatement() {
  return (
    <div style={{
      padding: "5rem var(--pad-x)",
      borderBottom: "1px solid var(--border)",
      position: "relative", zIndex: 1,
    }}>
      <Reveal from="bottom">
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(1.15rem, 3.5vw, 2rem)",
          fontWeight: 600, letterSpacing: "-0.3px",
          lineHeight: 1.55, maxWidth: 820,
          color: "var(--text)",
        }}>
          As a{" "}
          <GradientWord gradient="linear-gradient(110deg, #7c5cfc, #36c5f0)">
            dedicated
          </GradientWord>{" "}
          full-stack developer, I specialize in architecting{" "}
          <GradientWord gradient="linear-gradient(110deg, #36c5f0, #a78bfa)">
            complex
          </GradientWord>{" "}
          systems and translating them into{" "}
          <GradientWord gradient="linear-gradient(110deg, #a78bfa, #36c5f0)">
            clean
          </GradientWord>{" "}
          user interfaces.
        </p>
      </Reveal>
    </div>
  );
}

/* ══════════════════════════════════════════
   WORKS — horizontal scroll (desktop) / stacked cards (mobile)
══════════════════════════════════════════ */
const PROJECTS = [
  {
    emoji: "🎵", name: "RhythmMania",
    url: "https://rhythm-mania.com", label: "rhythm-mania.com",
    desc: "A low-latency web-based rhythm game with custom note mapping, canvas rendering, and a fully responsive UI designed for precision gameplay.",
    tags: ["TypeScript", "Canvas API", "CSS3"],
    image: "/assets/RM.png",
  },
  {
    emoji: "🏫", name: "Zhonghua Secondary\nUnofficial Site",
    url: "https://zhonghuasec.school", label: "zhonghuasec.school",
    desc: "A community-driven web space for Zhonghua Secondary — high performance, streamlined resource organisation, and optimised asset delivery.",
    tags: ["Frontend", "Web Performance", "HTML / CSS"],
    image: "/assets/ZH.png",
  },
  {
    emoji: "🔑", name: "ZPortal",
    url: "https://zportal.zhonghuasec.school", label: "zportal.zhonghuasec.school",
    desc: "A secure student dashboard for resource coordination and scheduling — PHP backend, MySQL database, clean and intuitive frontend.",
    tags: ["PHP", "MySQL", "Dashboard"],
    image: "/assets/ZP.png",
  },
];

function Works() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <section id="works" style={{ padding: "var(--section-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
        <Reveal>
          <p style={eyebrow}>Projects</p>
          <h2 style={sectionTitle}>My Works</h2>
          <p style={sectionSub}>A selection of my recent projects.</p>
        </Reveal>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {PROJECTS.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <ProjectCard project={p} mobile />
            </Reveal>
          ))}
        </div>
      </section>
    );
  }

  return <WorksDesktop />;
}

function WorksDesktop() {
  const outerRef  = useRef(null);
  const stickyRef = useRef(null);
  const trackRef  = useRef(null);
  const [sectionH, setSectionH] = useState("300vh");
  const [progress, setProgress] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!trackRef.current || !stickyRef.current) return;
      const trackW   = trackRef.current.scrollWidth;
      const wrapW    = stickyRef.current.clientWidth;
      const maxSlide = trackW - wrapW;
      setSectionH(`calc(100vh + ${maxSlide}px + 120px)`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!outerRef.current || !trackRef.current || !stickyRef.current) return;
      const rect     = outerRef.current.getBoundingClientRect();
      const trackW   = trackRef.current.scrollWidth;
      const wrapW    = stickyRef.current.clientWidth;
      const maxSlide = trackW - wrapW;
      const scrolled = -rect.top;
      const total    = outerRef.current.offsetHeight - window.innerHeight;
      const p        = Math.max(0, Math.min(1, scrolled / total));
      setProgress(p);
      trackRef.current.style.transform = `translateX(${-p * maxSlide}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div id="works" ref={outerRef} style={{ height: sectionH, position: "relative", zIndex: 1 }}>
      <div ref={stickyRef} style={{
        position: "sticky", top: 0,
        height: "100vh", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ padding: "0 var(--pad-x)", marginBottom: "2.5rem", flexShrink: 0 }}>
          <Reveal>
            <p style={eyebrow}>Projects</p>
            <h2 style={sectionTitle}>My Works</h2>
            <p style={sectionSub}>Scroll down to explore →</p>
          </Reveal>
        </div>

        <div style={{ padding: "0 var(--pad-x)", overflow: "visible", flexShrink: 0 }}>
          <div ref={trackRef} style={{
            display: "flex", gap: "1.5rem",
            willChange: "transform",
            transition: "transform 0.08s linear",
          }}>
            {PROJECTS.map((p, i) => <ProjectCard key={i} project={p} />)}
            <div style={{ minWidth: "3rem", flexShrink: 0 }} />
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 28, left: "var(--pad-x)", right: "var(--pad-x)",
          height: 2, background: "var(--border)", borderRadius: 2,
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: "linear-gradient(90deg, var(--accent), var(--accent2))",
            width: `${progress * 100}%`,
            transition: "width 0.08s linear",
          }} />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project: p, mobile }) {
  const [hovered, setHovered] = useState(false);

  if (mobile) {
    return (
      <a
        href={p.url} target="_blank"
        style={{
          display: "flex", flexDirection: "column",
          background: "var(--bg2)",
          border: "1px solid var(--border)",
          borderRadius: 14, textDecoration: "none", color: "inherit",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* gradient top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
        }} />

        {/* Image */}
        {p.image ? (
          <div style={{
            width: "100%", background: "rgba(124,92,252,0.04)",
            borderBottom: "1px solid var(--border)",
          }}>
            <img src={p.image} alt={p.name} style={{
              width: "100%", aspectRatio: "16 / 9",
              objectFit: "contain", display: "block",
            }} />
          </div>
        ) : (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.6rem", padding: "2rem",
            border: "none", borderBottom: "1px solid var(--border)",
            background: "rgba(124,92,252,0.04)",
            aspectRatio: "16 / 9",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="rgba(124,92,252,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem", color: "rgba(124,92,252,0.5)", lineHeight: 1.5,
            }}>Add project screenshot</span>
          </div>
        )}

        {/* Text content */}
        <div style={{ padding: "1.4rem", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "0.7rem" }}>{p.emoji}</div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.05rem", fontWeight: 600,
            marginBottom: "0.6rem", whiteSpace: "pre-line",
          }}>{p.name}</div>
          <p style={{ color: "var(--muted)", fontSize: "0.86rem", lineHeight: 1.7 }}>{p.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "1rem" }}>
            {p.tags.map(t => (
              <span key={t} style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.67rem", color: "var(--accent2)",
                border: "1px solid rgba(54,197,240,.25)",
                borderRadius: 4, padding: "0.18rem 0.5rem",
              }}>{t}</span>
            ))}
          </div>
          <div style={{
            marginTop: "1rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.71rem", color: "var(--accent)",
          }}>↗ {p.label}</div>
        </div>
      </a>
    );
  }

  /* ── Desktop card ── */
  return (
    <a
      href={p.url} target="_blank"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "row",
        flexShrink: 0, width: 850, minHeight: 320,
        background: hovered ? "var(--bg3)" : "var(--bg2)",
        border: `1px solid ${hovered ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 14,
        textDecoration: "none", color: "inherit",
        transition: "border-color .25s, background .25s, transform .25s, box-shadow .25s",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 60px rgba(124,92,252,.18)" : "none",
        position: "relative", overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, var(--accent), var(--accent2))",
        opacity: hovered ? 1 : 0, transition: "opacity .25s",
      }} />

      <div style={{ width: 280, flexShrink: 0, padding: "2rem", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{p.emoji}</div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.1rem", fontWeight: 600,
          marginBottom: "0.75rem", whiteSpace: "pre-line",
        }}>{p.name}</div>
        <p style={{ color: "var(--muted)", fontSize: "0.86rem", lineHeight: 1.7, flex: 1 }}>{p.desc}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "1.2rem" }}>
          {p.tags.map(t => (
            <span key={t} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.67rem", color: "var(--accent2)",
              border: "1px solid rgba(54,197,240,.25)",
              borderRadius: 4, padding: "0.18rem 0.5rem",
            }}>{t}</span>
          ))}
        </div>
        <div style={{
          marginTop: "1rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.71rem", color: "var(--accent)",
        }}>↗ {p.label}</div>
      </div>

      <div style={{
        flex: 1, minWidth: 0,
        borderLeft: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", position: "relative",
        background: "rgba(124,92,252,0.04)",
        padding: "0.8rem",
      }}>
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              objectFit: "contain",
              borderRadius: 6,
            }}
          />
        ) : (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "0.6rem", padding: "1rem",
            border: "1.5px dashed rgba(124,92,252,0.3)",
            borderRadius: 8, margin: "1rem",
            width: "calc(100% - 2rem)", height: "calc(100% - 2rem)",
            textAlign: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="rgba(124,92,252,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.62rem", color: "rgba(124,92,252,0.5)",
              lineHeight: 1.5,
            }}>Add project<br/>screenshot</span>
          </div>
        )}
      </div>
    </a>
  );
}

/* ══════════════════════════════════════════
   GRADIENT WORDS
══════════════════════════════════════════ */
function useViewportProgress() {
  const ref = useRef(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const { top } = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.60;
      const end   = vh * 0.40;
      setT(Math.max(0, Math.min(1, (start - top) / (start - end))));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return [ref, t];
}

function GradientWord({ children, gradient }) {
  const [ref, t] = useViewportProgress();
  return (
    <span
      ref={ref}
      style={{
        display: "inline-block",
        position: "relative",
        verticalAlign: "baseline",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{
        display: "block",
        color: "#fff",
        opacity: 1 - t,
        transition: "opacity 0.5s ease",
        userSelect: "none",
        pointerEvents: "none",
        lineHeight: "inherit",
      }}>{children}</span>

      <span style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        background: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        opacity: t,
        transition: "opacity 0.5s ease",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>{children}</span>
    </span>
  );
}

function ObsessionQuote() {
  return (
    <div style={{
      padding: "4rem var(--pad-x)",
      borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
      position: "relative", zIndex: 1,
    }}>
      <Reveal from="left">
        <p style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(1.3rem, 4vw, 2.5rem)",
          fontWeight: 700, letterSpacing: "-0.5px", maxWidth: 760,
        }}>
          I have a strong obsession for{" "}
          <GradientWord gradient="linear-gradient(110deg, #36c5f0, #a78bfa)">
            algorithmic precision
          </GradientWord>{" "}
          and{" "}
          <GradientWord gradient="linear-gradient(110deg, #7c5cfc, #36c5f0)" delay={100}>
            clean system design
          </GradientWord>.
        </p>
      </Reveal>
    </div>
  );
}

/* ══════════════════════════════════════════
   SKILLS
══════════════════════════════════════════ */
const SKILL_GROUPS = [
  { label: "🏆 Fluent In",          primary: true,
    items: ["Python","JavaScript","HTML5","CSS3"] },
  { label: "⚙️ Frameworks & Tools", primary: false,
    items: ["TypeScript","React","Node.js","Django","Flask","Vite","PHP","MySQL"] },
  { label: "🧠 Domain Focus",        primary: false,
    items: ["Full-Stack Dev","Competitive Programming","Canvas / Game Dev","DB Design","UI/UX"] },
];

function Skills() {
  return (
    <section id="skills" style={{ padding: "var(--section-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <p style={eyebrow}>Skills</p>
        <h2 style={sectionTitle}>My Skills</h2>
        <p style={sectionSub}>Crafting user experiences with modern full-stack architecture and disciplined problem-solving.</p>
      </Reveal>
      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        {SKILL_GROUPS.map((g, gi) => (
          <div key={gi}>
            <Reveal delay={gi * 80}>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.72rem", letterSpacing: "0.14em",
                color: "var(--muted)", textTransform: "uppercase", marginBottom: "1.1rem",
              }}>{g.label}</p>
            </Reveal>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {g.items.map((item, ii) => (
                <Reveal key={item} delay={gi * 50 + ii * 40} style={{ display: "inline-block" }}>
                  <SkillChip label={item} primary={g.primary} />
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Reveal delay={200}>
        <div style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <Marquee items={["Python","JavaScript","TypeScript","React","Node.js","Django","Flask","PHP","MySQL","Vite","Canvas API","CSS3","HTML5","Git"]} />
        </div>
      </Reveal>
    </section>
  );
}

function SkillChip({ label, primary }) {
  const [hov, setHov] = useState(false);
  const col = primary ? "var(--accent)" : "var(--accent2)";
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "0.55rem",
        background: "var(--bg3)",
        border: `1px solid ${hov ? col : "var(--border)"}`,
        borderRadius: 8, padding: "0.55rem 1.1rem",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "0.88rem", fontWeight: 500,
        color: hov ? col : "var(--text)",
        transition: "border-color .2s, color .2s", cursor: "default",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
      {label}
    </div>
  );
}

/* ══════════════════════════════════════════
   ACHIEVEMENTS
══════════════════════════════════════════ */
const ACHIEVEMENTS = [
  { icon:"🏅", code:"NYTC",   name:"National Youth Tech Championship",           desc:"Applied technical skills in a national-level technology competition." },
  { icon:"🧩", code:"BEBRAS", name:"Bebras Computational Thinking Challenge",    desc:"International informatics challenge testing computational thinking skills." },
  { icon:"💻", code:"NJIO",   name:"National Junior Informatics Olympiad",       desc:"Competed in Singapore's national-level algorithmic programming olympiad." },
  { icon:"🌏", code:"IJIO",   name:"International Junior Informatics Olympiad",  desc:"Brought algorithmic expertise to the international competitive programming stage." },
];

function Achievements() {
  return (
    <section id="achievements" style={{ padding: "var(--section-y) var(--pad-x)", position: "relative", zIndex: 1 }}>
      <Reveal>
        <p style={eyebrow}>Milestones</p>
        <h2 style={sectionTitle}>Achievements</h2>
        <p style={sectionSub}>Sharpening problem-solving through competitive programming and computational thinking championships.</p>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem" }}>
        {ACHIEVEMENTS.map((a, i) => (
          <Reveal key={a.code} delay={i * 90} from="scale">
            <AchCard a={a} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function AchCard({ a }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "var(--bg3)",
        border: `1px solid ${hov ? "var(--accent2)" : "var(--border)"}`,
        borderRadius: 12, padding: "1.8rem 1.6rem",
        transition: "border-color .2s, transform .25s, box-shadow .25s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov ? "0 12px 40px rgba(54,197,240,.12)" : "none",
      }}
    >
      <div style={{ fontSize: "1.8rem", marginBottom: "0.9rem" }}>{a.icon}</div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.7rem", color: "var(--accent2)", letterSpacing: "0.12em", marginBottom: "0.4rem",
      }}>{a.code}</div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem",
      }}>{a.name}</div>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>{a.desc}</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   CONTACT / CTA
══════════════════════════════════════════ */
function Contact() {
  return (
    <section id="contact" style={{ padding: "var(--section-y) var(--pad-x) 5rem", position: "relative", zIndex: 1, textAlign: "center" }}>
      <Reveal>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
          fontWeight: 700, letterSpacing: "-1px", marginBottom: "1rem",
        }}>Interested in Collaboration?</h2>
        <p style={{ color: "var(--muted)", marginBottom: "2rem", fontSize: "0.98rem" }}>
          Reach out on GitHub or visit ZPortal — always open to building something great.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="https://github.com/yumo-ymspace" target="_blank" style={btnPrimary}>GitHub →</a>
          <a href="https://zportal.zhonghuasec.school" target="_blank" style={btnGhost}>ZPortal →</a>
          <a href="mailto:yumo@yumo-ym.space" style={{
            ...btnGhost,
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <polyline points="22,4 12,14 2,4"/>
            </svg>
            Email me
          </a>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <div style={{ marginTop: "3.5rem", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <Marquee
            items={["Full-Stack Development","Competitive Programming","Rhythm Game Dev","Python & TypeScript","React & Node.js","Clean Architecture","Algorithmic Efficiency","Student Ecosystems"]}
            accent speed={19}
          />
        </div>
      </Reveal>
    </section>
  );
}

/* ══════════════════════════════════════════
   FOOTER
══════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{
      background: "var(--bg2)", borderTop: "1px solid var(--border)",
      padding: "3rem var(--pad-x)", position: "relative", zIndex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
        <div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.5px",
          }}>yumo<span style={{ color: "var(--accent)" }}>.</span></div>
          <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "0.3rem" }}>
            "Striving for clean architecture and algorithmic efficiency."
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <SocialPill href="https://github.com/yumo-ymspace" label="@yumo-ymspace">
            <GhIcon />
          </SocialPill>
          <SocialPill href="https://zportal.zhonghuasec.school" label="ZPortal">
            <MonIcon />
          </SocialPill>
          <SocialPill href="mailto:yumo@yumo-ym.space" label="yumo@yumo-ym.space">
            <MailIcon />
          </SocialPill>
        </div>
      </div>
      <div style={{
        marginTop: "2.5rem", paddingTop: "1.5rem",
        borderTop: "1px solid var(--border)",
        textAlign: "center", color: "var(--muted)", fontSize: "0.75rem",
      }}>© 2026 Yumo(yumo-ymspace) All rights reserved.</div>
    </footer>
  );
}

function SocialPill({ href, label, children }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href} target="_blank"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: "0.55rem",
        background: "var(--bg3)",
        border: `1px solid ${hov ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 6, padding: "0.55rem 1.1rem",
        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem",
        color: hov ? "var(--accent)" : "var(--muted)",
        textDecoration: "none", transition: "border-color .2s, color .2s",
      }}
    >{children} {label}</a>
  );
}

const MailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,14 2,4"/></svg>;
const GhIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.744.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.5 11.5 0 0 1 12 6.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>;
const MonIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;

/* ══════════════════════════════════════════
   MARQUEE
══════════════════════════════════════════ */
function Marquee({ items, speed = 24, accent = false }) {
  const text = items.join("   ✦   ");
  const doubled = text + "   ✦   " + text;
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", padding: "1rem 0" }}>
      <span style={{
        display: "inline-block",
        animation: `marquee ${speed}s linear infinite`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.82rem", letterSpacing: "0.08em",
        color: accent ? "var(--accent)" : "var(--muted)",
      }}>{doubled}</span>
    </div>
  );
}

/* ══════════════════════════════════════════
   SHARED TOKENS
══════════════════════════════════════════ */
const eyebrow    = { fontFamily:"'JetBrains Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.18em", color:"var(--accent)", textTransform:"uppercase", marginBottom:"0.6rem" };
const sectionTitle = { fontFamily:"'Space Grotesk',sans-serif", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:700, letterSpacing:"-1px", lineHeight:1.1, marginBottom:"0.6rem" };
const sectionSub   = { color:"var(--muted)", maxWidth:"min(520px, 100%)", fontSize:"0.98rem", lineHeight:1.7, marginBottom:"3rem" };
const btnPrimary   = { display:"inline-block", background:"var(--accent)", color:"#fff", padding:"0.75rem 1.7rem", borderRadius:7, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:"0.9rem", textDecoration:"none", cursor:"pointer", border:"none" };
const btnGhost     = { display:"inline-block", border:"1px solid var(--border)", color:"var(--muted)", background:"transparent", padding:"0.75rem 1.7rem", borderRadius:7, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500, fontSize:"0.9rem", textDecoration:"none", cursor:"pointer" };

/* ══════════════════════════════════════════
   APP
══════════════════════════════════════════ */
export default function App() {
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <RhythmCanvas />
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