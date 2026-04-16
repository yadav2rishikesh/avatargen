export const colors = {
  bg: "#05050e",
  card: "rgba(255,255,255,0.038)",
  cardHover: "rgba(255,255,255,0.055)",
  border: "rgba(255,255,255,0.065)",
  borderMuted: "rgba(255,255,255,0.04)",
  gold: "#e0a039",
  goldLight: "#f5c842",
  goldDark: "#c07818",
  goldGlow: "rgba(224,160,57,0.25)",
  text: "#fff",
  textMuted: "rgba(255,255,255,0.35)",
  textDim: "rgba(255,255,255,0.2)",
  textHint: "rgba(255,255,255,0.12)",
  success: "#22c55e",
  error: "#fca5a5",
  errorBg: "rgba(239,68,68,0.1)",
};

export const styles = {
  page: {
    minHeight: "100vh",
    background: "#05050e",
    color: "#fff",
    fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 48px",
    background: "rgba(5,5,14,0.85)",
    backdropFilter: "blur(32px)",
    WebkitBackdropFilter: "blur(32px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  card: {
    background: "rgba(255,255,255,0.038)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.065)",
    borderRadius: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  cardPadded: {
    background: "rgba(255,255,255,0.038)",
    backdropFilter: "blur(32px) saturate(180%)",
    WebkitBackdropFilter: "blur(32px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.065)",
    borderRadius: 20,
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  goldBtn: {
    background: "linear-gradient(135deg,#c07818,#f5d070,#c07818)",
    backgroundSize: "200% 100%",
    color: "#1a0e00",
    border: "none",
    borderRadius: 50,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(224,160,57,0.3)",
    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineBtn: {
    background: "rgba(224,160,57,0.08)",
    border: "1px solid rgba(224,160,57,0.2)",
    borderRadius: 50,
    color: "rgba(224,160,57,0.85)",
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  ghostBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.22s",
  },
  textarea: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    outline: "none",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "all 0.22s",
  },
  select: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    outline: "none",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 50,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  divider: {
    height: 1,
    background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)",
    margin: "20px 0",
  },
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: 7,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-1px",
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.35)",
    fontWeight: 300,
    marginBottom: 28,
  },
};

export const blobs = {
  blob1: {
    position: "absolute",
    width: 700,
    height: 500,
    background: "radial-gradient(ellipse,rgba(224,160,57,0.1),transparent 65%)",
    top: -150,
    left: -150,
    filter: "blur(60px)",
    pointerEvents: "none",
    borderRadius: "50%",
  },
  blob2: {
    position: "absolute",
    width: 600,
    height: 600,
    background: "radial-gradient(ellipse,rgba(59,91,219,0.06),transparent 65%)",
    bottom: -200,
    right: -100,
    filter: "blur(80px)",
    pointerEvents: "none",
    borderRadius: "50%",
  },
};

export const globalCSS = `
  @keyframes cblink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes apulse{0%,100%{opacity:0.5;transform:scale(0.95)}50%{opacity:1;transform:scale(1.05)}}
  @keyframes afloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .jio-inp:focus{background:rgba(255,255,255,0.08)!important;border-color:rgba(224,160,57,0.4)!important;box-shadow:0 0 0 3px rgba(224,160,57,0.09)!important}
  .jio-btn:hover{background-position:100% 0!important;box-shadow:0 8px 32px rgba(224,160,57,0.4)!important;transform:translateY(-1px)!important}
  .jio-btn:active{transform:scale(0.98)!important}
  .jio-card:hover{border-color:rgba(224,160,57,0.15)!important;transform:translateY(-2px)!important}
  .jio-ghost:hover{background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.12)!important}
  .jio-outline:hover{background:rgba(224,160,57,0.14)!important;border-color:rgba(224,160,57,0.35)!important}
  * { box-sizing: border-box; }
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(224,160,57,0.2);border-radius:4px}
`;
