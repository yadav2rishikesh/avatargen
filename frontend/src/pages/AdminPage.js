import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, Shield } from "lucide-react";
import { format } from "date-fns";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, videosRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/admin/videos`, { headers }),
        axios.get(`${API_URL}/admin/stats`, { headers }),
      ]);
      setUsers(usersRes.data);
      setVideos(videosRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPool = async () => {
    setResetting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/admin/users/reset-usage`,
        { user_id: "company" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || "Company pool reset successfully");
      setShowResetDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to reset pool");
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#05050e" }}>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, border: "2px solid rgba(224,160,57,0.2)", borderTop: "2px solid #e0a039", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const poolUsed = stats?.company_pool_used || 0;
  const poolLimit = stats?.company_pool_limit || 30;
  const poolRemaining = stats?.company_pool_remaining || 30;
  const poolPct = Math.round((poolUsed / poolLimit) * 100);
  const barColor = poolPct >= 90 ? "#fca5a5" : poolPct >= 70 ? "#fcd34d" : "#e0a039";

  const card = {
    background: "rgba(255,255,255,0.038)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    position: "relative",
    overflow: "hidden",
  };

  const statusStyle = (status) => {
    if (status === "completed") return { background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" };
    if (status === "failed") return { background: "rgba(252,165,165,0.1)", color: "#fca5a5", border: "1px solid rgba(252,165,165,0.2)" };
    if (status === "generating") return { background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" };
    return { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" };
  };

  return (
    <div style={{ minHeight: "calc(100vh - 65px)", background: "#05050e", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 65% 45% at 50% 0%,rgba(224,160,57,0.055),transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)", backgroundSize: "72px 72px", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .adm-row:hover{background:rgba(255,255,255,0.025)!important;}
        .adm-tab{flex:1;padding:8px 20px;border:none;background:transparent;color:rgba(255,255,255,0.3);font-size:13px;font-weight:500;cursor:pointer;border-radius:10px;transition:all 0.2s;font-family:inherit;}
        .adm-tab.active{background:rgba(255,255,255,0.1);color:#fff;font-weight:700;}
        .adm-tab:hover:not(.active){color:rgba(255,255,255,0.6);}
        .adm-reset-btn:hover{background:rgba(224,160,57,0.15)!important;}
        .adm-confirm-btn:hover{opacity:0.9!important;transform:translateY(-1px)!important;}
        .adm-cancel-btn:hover{background:rgba(255,255,255,0.08)!important;}
      `}</style>

      <div style={{ padding: "36px 48px", maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 4, height: 36, background: "linear-gradient(180deg,#e0a039,#c07818)", borderRadius: 2 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(224,160,57,0.1)", border: "1px solid rgba(224,160,57,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={16} color="#e0a039" />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", margin: 0 }}>Admin Dashboard</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", fontWeight: 300 }}>Monitor company video usage — {stats?.month || ""}</p>
            </div>
          </div>
        </div>

        {/* Pool Card */}
        <div style={{ ...card, background: "linear-gradient(135deg,rgba(224,160,57,0.12) 0%,rgba(180,110,10,0.06) 100%)", border: "1.5px solid rgba(224,160,57,0.3)", marginBottom: 24, padding: "36px 40px" }}>
          <div style={{ position: "absolute", width: 300, height: 300, background: "radial-gradient(circle,rgba(224,160,57,0.1),transparent 70%)", top: -100, right: -60, pointerEvents: "none", borderRadius: "50%" }} />
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(224,160,57,0.65)", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8 }}>Company Monthly Pool</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 72, fontWeight: 800, color: "#e0a039", lineHeight: 1, letterSpacing: "-3px" }}>{poolUsed}</span>
                <span style={{ fontSize: 24, color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>/ {poolLimit} videos</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>{poolRemaining} videos remaining — shared across all users</p>
            </div>
            <button className="adm-reset-btn" onClick={() => setShowResetDialog(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "rgba(224,160,57,0.08)", border: "1px solid rgba(224,160,57,0.25)", borderRadius: 12, color: "#e0a039", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>
              <RefreshCw size={14} /> Clear Stuck Videos
            </button>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 8 }}>
              <span>{poolPct}% used</span><span>{poolRemaining} left</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 50, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(poolPct, 100)}%`, height: "100%", background: `linear-gradient(90deg,${barColor},${barColor}cc)`, borderRadius: 50, transition: "width 0.6s ease", boxShadow: `0 0 12px ${barColor}66` }} />
            </div>
          </div>
          {poolPct >= 90 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", borderRadius: 12, padding: "10px 14px" }}>
              <AlertCircle size={15} color="#fca5a5" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#fca5a5" }}>Company pool almost full! Consider resetting or increasing the limit.</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
          {[
            { color: "224,160,57", label: "Total Users", value: users.length, sub: null },
            { color: "96,165,250", label: "Total Videos", value: videos.length, sub: `${stats?.completed_videos || 0} completed · ${stats?.failed_videos || 0} failed` },
            { color: "251,191,36", label: "This Month", value: stats?.monthly_videos || 0, sub: "videos generated" },
          ].map((s, i) => (
            <div key={i} style={{ ...card, padding: "24px 28px" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,rgba(${s.color},0.3),transparent)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 16 }}>{s.label}</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-2px", lineHeight: 1 }}>{s.value}</div>
              {s.sub && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, marginBottom: 0 }}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div style={{ ...card }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(224,160,57,0.3),transparent)", pointerEvents: "none" }} />
          <div style={{ padding: "20px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {["users", "videos"].map(tab => (
                <button key={tab} className={`adm-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "users" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Email", "Role", "Videos This Month", "Total Videos", "Joined"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "14px 24px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="adm-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#fff" }}>{user.email}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, ...(user.role === "admin" ? { background: "rgba(224,160,57,0.1)", color: "#e0a039", border: "1px solid rgba(224,160,57,0.25)" } : { background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.25)" }) }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 700, color: "#e0a039" }}>{user.monthly_videos_used || 0}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{user.total_videos || 0}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{format(new Date(user.created_at), "MMM d, yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "videos" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Title", "Avatar", "Status", "Duration", "Created"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "14px 24px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id} className="adm-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#fff", fontWeight: 500 }}>{video.title}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{video.avatar_name}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, ...statusStyle(video.status) }}>{video.status}</span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{video.duration}s</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{format(new Date(video.created_at), "MMM d, yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reset Dialog */}
      {showResetDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ ...card, padding: 32, maxWidth: 440, width: "90%", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(224,160,57,0.4),transparent)", pointerEvents: "none" }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20, marginTop: 0 }}>Clear Stuck Videos</h3>
            <div style={{ background: "rgba(224,160,57,0.06)", border: "1px solid rgba(224,160,57,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12 }}>
              <AlertCircle size={16} color="#e0a039" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#e0a039", margin: "0 0 4px" }}>Clear stuck videos?</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>This finds videos stuck on "generating" for 2+ hours and frees those pool slots.</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Current pool usage</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e0a039" }}>{poolUsed} / {poolLimit} videos</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="adm-cancel-btn" onClick={() => setShowResetDialog(false)} style={{ flex: 1, padding: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>Cancel</button>
              <button className="adm-confirm-btn" onClick={handleResetPool} disabled={resetting} style={{ flex: 1, padding: 11, background: "linear-gradient(135deg,#c07818,#f5d070)", border: "none", borderRadius: 12, color: "#1a0e00", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                <RefreshCw size={14} style={{ animation: resetting ? "spin 1s linear infinite" : "none" }} />
                {resetting ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
