import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Users,
  Wallet,
  Globe,
  Award,
  BookOpen,
  Coins,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Plus
} from "lucide-react";
import { STIMULI, LANGUAGES_AND_DIALECTS } from "./data/stimuli";
import type { Stimulus } from "./data/stimuli";

const API_BASE = "http://localhost:8000";

export default function App() {
  // Navigation: "onboarding" | "solo" | "multiplayer" | "wallet" | "bridge" | "leaderboard" | "admin"
  const [currentScreen, setCurrentScreen] = useState<string>("onboarding");
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");

  // User Profile State
  const [username, setUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [signupPassword, setSignupPassword] = useState<string>("");
  const [language, setLanguage] = useState<string>("Igbo");
  const [dialect, setDialect] = useState<string>(""); // optional at signup
  const [points, setPoints] = useState<number>(120);
  const [soloProgress, setSoloProgress] = useState<number>(0);
  const [activeDialect, setActiveDialect] = useState<string>(""); // chosen dynamically during gameplay
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Solo mode state
  const [activeStimulusIndex, setActiveStimulusIndex] = useState<number>(() => Math.floor(Math.random() * STIMULI.length));
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Audio recording hardware hooks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Multiplayer Live Room State
  const [roomCode, setRoomCode] = useState<string>("");
  const [lobbyState, setLobbyState] = useState<"lobby" | "selecting" | "describing" | "voting" | "consensus">("lobby");
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [hostUsername, setHostUsername] = useState<string>("");
  const [wsStimulusId, setWsStimulusId] = useState<string>("");
  const [roomConsensusProgress, setRoomConsensusProgress] = useState<number>(0);
  const [wsSubmissions, setWsSubmissions] = useState<any[]>([]);
  const [wsVotes, setWsVotes] = useState<any>({});
  const [wsCorrections, setWsCorrections] = useState<any>({});
  const [lobbyError, setLobbyError] = useState<string>("");
  const [multiplayerNotify, setMultiplayerNotify] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  // Admin Dashboard State
  const [adminSubmissions, setAdminSubmissions] = useState<any[]>([]);
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [editingTexts, setEditingTexts] = useState<Record<number, string>>({});

  // Check backend health
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  // Update Active Dialect when language changes
  useEffect(() => {
    const dialects = (LANGUAGES_AND_DIALECTS as any)[language] || [];
    if (dialects.length > 0) {
      setActiveDialect(dialects[0]);
    } else {
      setActiveDialect("");
    }
  }, [language]);

  // Audio recorder canvas wave animation
  const drawWaveform = (analyser: AnalyserNode, dataArray: any) => {
    if (!canvasRef.current || !isRecording) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#16171A";
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / dataArray.length) * 1.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i] / 1.5;
      
      // Clean modern white bars instead of neon gradients
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, barHeight / 80)})`;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }

    animationFrameRef.current = requestAnimationFrame(() => drawWaveform(analyser, dataArray));
  };

  // Start Voice Recording
  const startRecording = async () => {
    setErrorMsg("");
    setValidationResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Small size for neat bar graphs
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      setIsRecording(true);
      setRecordingTime(0);
      mediaRecorder.start();

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Launch canvas visualizer loop
      setTimeout(() => {
        drawWaveform(analyser, dataArray);
      }, 100);

    } catch (err) {
      setErrorMsg("Microphone access denied. Please verify input permissions.");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Submit Solo Recording for Validation
  const submitSoloValidation = async () => {
    if (!audioBlob) return;
    setIsValidating(true);
    setErrorMsg("");

    try {
      const activeStim = STIMULI[activeStimulusIndex];
      
      // Fetch stimulus image to file conversion
      const response = await fetch(activeStim.imageUrl);
      const blob = await response.blob();
      const imageFile = new File([blob], "stimulus.jpg", { type: blob.type });

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("image", imageFile);
      formData.append("language", language);
      formData.append("dialect", activeDialect);
      formData.append("username", username);
      formData.append("image_id", activeStim.id);

      const res = await fetch(`${API_BASE}/api/validate`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Validation endpoint responded with error");
      }

      const data = await res.json();
      setValidationResult(data);
      
      // Update global coins and solo validation counts
      setPoints(data.new_points);
      setSoloProgress(data.new_progress);
      
    } catch (e: any) {
      setErrorMsg("Failed to connect to backend server. Make sure uvicorn is running on port 8000.");
    } finally {
      setIsValidating(false);
    }
  };

  // Cycle Stimulus Deck
  const nextStimulus = () => {
    setActiveStimulusIndex((prev) => (prev + 1) % STIMULI.length);
    setAudioBlob(null);
    setAudioUrl(null);
    setValidationResult(null);
  };

  const prevStimulus = () => {
    setActiveStimulusIndex((prev) => (prev - 1 + STIMULI.length) % STIMULI.length);
    setAudioBlob(null);
    setAudioUrl(null);
    setValidationResult(null);
  };

  // User auth actions
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!username.trim()) {
      setErrorMsg("Please enter a username.");
      return;
    }

    const payload = {
      username: username,
      password: authTab === "login" ? loginPassword : signupPassword,
      language: language,
      dialect: dialect // optional signup dialect
    };

    try {
      const endpoint = authTab === "login" ? "/api/login" : "/api/signup";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Authentication request failed");
      }

      const userData = await res.json();
      
      if (authTab === "signup") {
        setSuccessMsg("Account created! Please enter password below to Sign In.");
        setAuthTab("login");
        return;
      }

      // Login Successful
      setUsername(userData.username);
      setLanguage(userData.language);
      setPoints(userData.points);
      setSoloProgress(userData.solo_progress);
      if (userData.dialect) {
        setActiveDialect(userData.dialect);
      }
      setIsRegistered(true);
      setCurrentScreen("solo");

    } catch (e: any) {
      setErrorMsg(e.message || "Cannot establish connection to database backend.");
    }
  };

  // WEBSOCKET MULTIPLAYER GAMEPLAY

  const joinMultiplayerLobby = () => {
    setLobbyError("");
    setMultiplayerNotify("");
    if (!roomCode.trim()) {
      setLobbyError("Please enter a 4-digit Room Code");
      return;
    }

    // Connect to Backend WebSocket
    const ws = new WebSocket(
      `ws://localhost:8000/ws/lobby/${roomCode.trim()}?username=${username}&language=${language}&dialect=${activeDialect}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setLobbyState("lobby");
    };

    ws.onmessage = (event) => {
      const message = jsonParse(event.data);
      if (!message) return;

      if (message.type === "error") {
        setLobbyError(message.message);
        ws.close();
      } else if (message.type === "room_state") {
        setConnectedPlayers(message.players);
        setHostUsername(message.host);
        setLobbyState(message.status === "selecting" ? "lobby" : message.status);
        setWsStimulusId(message.stimulus_id);
        setRoomConsensusProgress(message.consensus_progress);
        setWsSubmissions(message.submissions);
        setWsVotes(message.votes);
        setWsCorrections(message.corrections);
      } else if (message.type === "stimulus_selected") {
        setWsStimulusId(message.stimulus_id);
        setLobbyState("describing");
        setWsSubmissions([]);
        setWsVotes({});
        setWsCorrections({});
      } else if (message.type === "peer_submission") {
        setWsSubmissions(message.submissions);
      } else if (message.type === "voting_phase") {
        setLobbyState("voting");
      } else if (message.type === "votes_updated") {
        setWsVotes(message.votes);
      } else if (message.type === "corrections_updated") {
        setWsCorrections(message.corrections);
      } else if (message.type === "consensus_coin_awarded") {
        setMultiplayerNotify(message.message);
        // Refresh player points from database
        refreshPoints();
      } else if (message.type === "consensus_committed") {
        setRoomConsensusProgress(message.consensus_progress);
        setLobbyState("lobby");
        setWsStimulusId("");
        setWsSubmissions([]);
        setWsVotes({});
        setWsCorrections({});
        refreshPoints();
      }
    };

    ws.onclose = () => {
      // Return to selection lobby
      wsRef.current = null;
    };
  };

  const refreshPoints = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
        setSoloProgress(data.solo_progress);
      }
    } catch (e) {}
  };

  const createMultiplayerLobby = () => {
    // Generate simple 4 digit room code
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomCode(newCode);
    
    // Connect WebSocket as Host
    setTimeout(() => {
      const ws = new WebSocket(
        `ws://localhost:8000/ws/lobby/${newCode}?username=${username}&language=${language}&dialect=${activeDialect}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setLobbyState("lobby");
      };

      ws.onmessage = (event) => {
        const message = jsonParse(event.data);
        if (!message) return;

        if (message.type === "room_state") {
          setConnectedPlayers(message.players);
          setHostUsername(message.host);
          setLobbyState(message.status === "selecting" ? "lobby" : message.status);
          setWsStimulusId(message.stimulus_id);
          setRoomConsensusProgress(message.consensus_progress);
          setWsSubmissions(message.submissions);
          setWsVotes(message.votes);
          setWsCorrections(message.corrections);
        } else if (message.type === "peer_submission") {
          setWsSubmissions(message.submissions);
        } else if (message.type === "votes_updated") {
          setWsVotes(message.votes);
        } else if (message.type === "corrections_updated") {
          setWsCorrections(message.corrections);
        } else if (message.type === "consensus_coin_awarded") {
          setMultiplayerNotify(message.message);
          refreshPoints();
        } else if (message.type === "consensus_committed") {
          setRoomConsensusProgress(message.consensus_progress);
          setLobbyState("lobby");
          setWsStimulusId("");
          setWsSubmissions([]);
          setWsVotes({});
          setWsCorrections({});
          refreshPoints();
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    }, 100);
  };

  const jsonParse = (data: string) => {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  };

  const leaveMultiplayerRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setLobbyState("lobby");
    setConnectedPlayers([]);
    setRoomCode("");
  };

  // Host starts match by selecting a visual stimulus card
  const selectMultiplayerStimulus = (stim: Stimulus) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "select_stimulus",
        stimulus_id: stim.id
      }));
    }
  };

  // Peer uploads spoken audio, transcribes, and broadcasts to room
  const submitMultiplayerRecording = async () => {
    if (!audioBlob) return;
    setIsValidating(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const res = await fetch(`${API_BASE}/api/upload-audio`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Audio upload failed");
      const data = await res.json();

      // Send to room via WebSockets
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "speech_submitted",
          text: data.transcription,
          audio_url: data.audio_url
        }));
      }
      
      setAudioBlob(null);
      setAudioUrl(null);
      setLobbyState("voting");

    } catch (e) {
      setErrorMsg("Failed to upload audio description for consensus.");
    } finally {
      setIsValidating(false);
    }
  };

  const transitionToVoting = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "transition_voting"
      }));
    }
  };

  const castVote = (targetUser: string, approve: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "submit_vote",
        target_user: targetUser,
        approve: approve
      }));
    }
  };

  const submitSpellingCorrection = (targetUser: string, text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "suggest_correction",
        target_user: targetUser,
        text: text
      }));
    }
  };

  const commitLobbyConsensus = (finalSubmissionsMap: Record<string, {approved: boolean, text: string}>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "commit_consensus",
        final_submissions: finalSubmissionsMap
      }));
    }
  };


  // ADMIN BOARD SUBMISSIONS MANAGEMENT

  const fetchAdminSubmissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/submissions`);
      if (res.ok) {
        const data = await res.json();
        setAdminSubmissions(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (currentScreen === "admin") {
      fetchAdminSubmissions();
    }
  }, [currentScreen]);

  const verifySubmission = async (id: number, status: "approved" | "rejected", consensusText?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: id,
          status: status,
          consensus_text: consensusText
        })
      });

      if (res.ok) {
        // Refresh local table
        fetchAdminSubmissions();
      }
    } catch (e) {}
  };

  // Image load error fallback handlers
  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const activeStimulus = STIMULI[activeStimulusIndex];
  const activeWsStimulus = STIMULI.find(s => s.id === wsStimulusId) || STIMULI[0];

  return (
    <div className="app-container">
      {/* Top Application Bar */}
      <header className="app-header">
        <div className="app-title-group" style={{ cursor: "pointer" }} onClick={() => {
          setIsRegistered(false);
          setCurrentScreen("onboarding");
          if (wsRef.current) wsRef.current.close();
        }} title="Reset setup & profile">
          <Globe className="app-logo-icon" size={18} color="var(--primary)" />
          <h1 className="app-logo">LEXARA</h1>
        </div>

        {isRegistered && (
          <div style={{ display: "flex", gap: "8px" }}>
            {/* User Level */}
            <div className="user-status-badge">
              <Award size={13} color="var(--text-secondary)" />
              <span>Lvl {points >= 150 ? 3 : points >= 130 ? 2 : 1}</span>
            </div>

            {/* Wallet Tracker */}
            <div className="user-status-badge points-badge" onClick={() => setCurrentScreen("wallet")}>
              <Coins size={13} color="var(--primary)" />
              <span>{points} Pts</span>
            </div>
            
            {/* Admin Dashboard Entry */}
            {username === "vincent.chidiebere@outlook.com" && (
              <button 
                onClick={() => setCurrentScreen(currentScreen === "admin" ? "solo" : "admin")}
                className="btn-skip"
                style={{ background: currentScreen === "admin" ? "var(--primary)" : "none", color: currentScreen === "admin" ? "black" : "white" }}
              >
                Admin
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="app-main">
        
        {/* SCREEN 1: ONBOARDING LOGIN/SIGNUP */}
        {!isRegistered && (
          <div className="slide-up" style={{ maxWidth: "420px", margin: "20px auto 0 auto" }}>
            
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px" }}>Spontaneous Dialect Validation</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
                Preserving underrepresented African languages through real-time game verification.
              </p>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", marginBottom: "16px" }}>
              <button 
                onClick={() => { setAuthTab("login"); setErrorMsg(""); }} 
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "none",
                  border: "none",
                  color: authTab === "login" ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: authTab === "login" ? "2px solid var(--primary)" : "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthTab("signup"); setErrorMsg(""); }} 
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "none",
                  border: "none",
                  color: authTab === "signup" ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: authTab === "signup" ? "2px solid var(--primary)" : "none",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Forms Panel */}
            <div className="glass-card" style={{ padding: "20px" }}>
              <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {errorMsg && (
                  <div className="alert alert-error" style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                    <AlertTriangle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="alert alert-success" style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                    <CheckCircle size={14} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Username / Contributor Nickname
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.trim())}
                    placeholder="e.g. Chinedu"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={authTab === "login" ? loginPassword : signupPassword}
                    onChange={(e) => authTab === "login" ? setLoginPassword(e.target.value) : setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    required
                  />
                </div>

                {authTab === "signup" && (
                  <>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Native Tribe (Primary Language)
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="form-input"
                      >
                        {Object.keys(LANGUAGES_AND_DIALECTS).map((lang) => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                        Primary Dialect (Optional - Can leave empty)
                      </label>
                      <select
                        value={dialect}
                        onChange={(e) => setDialect(e.target.value)}
                        className="form-input"
                      >
                        <option value="">Choose Dialect (Or skip)</option>
                        {((LANGUAGES_AND_DIALECTS as any)[language] || []).map((dial: string) => (
                          <option key={dial} value={dial}>{dial}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                        Leave empty if you speak multiple dialects. You can choose during gameplay.
                      </span>
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: "10px" }}>
                  {authTab === "login" ? "Sign In to Play" : "Register Profile"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SCREEN 2: SOLO PLAY MODE */}
        {isRegistered && currentScreen === "solo" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>Solo Mode</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Active Dialect:
                  </span>
                  <select 
                    value={activeDialect} 
                    onChange={(e) => setActiveDialect(e.target.value)}
                    className="form-input"
                    style={{ padding: "2px 8px", fontSize: "11px", width: "auto", display: "inline-block" }}
                  >
                    {((LANGUAGES_AND_DIALECTS as any)[language] || []).map((d: string) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span 
                    onClick={() => {
                      setIsRegistered(false);
                      setCurrentScreen("onboarding");
                    }} 
                    style={{ 
                      color: "var(--text-primary)", 
                      textDecoration: "underline", 
                      cursor: "pointer", 
                      fontSize: "11px",
                      fontWeight: "500",
                      marginLeft: "4px"
                    }}
                  >
                    Change Language
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button className="btn-skip" onClick={prevStimulus} style={{ padding: "4px 8px" }}>
                  Prev
                </button>
                <button className="btn-skip" onClick={nextStimulus} style={{ padding: "4px 8px" }}>
                  Next
                </button>
                <span className={`status-pill ${backendStatus}`} style={{
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "#16171A",
                  color: "var(--text-secondary)",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {backendStatus === "online" ? "AI Engine Online" : "AI Simulation"}
                </span>
              </div>
            </div>

            {/* Stimulus display card */}
            <div className="glass-card stimulus-display" style={{ overflow: "hidden", padding: "0" }}>
              <div className="image-container">
                {imageErrors[activeStimulus.id] ? (
                  <div className="image-placeholder-fallback">
                    <Globe size={32} color="var(--text-muted)" />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>Image Offline</span>
                  </div>
                ) : (
                  <img
                    src={activeStimulus.imageUrl}
                    alt={activeStimulus.title}
                    className="stimulus-image"
                    onError={() => handleImageError(activeStimulus.id)}
                  />
                )}
                <span className="category-tag">{activeStimulus.category}</span>
              </div>

              <div style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "16px" }}>{activeStimulus.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  {activeStimulus.description}
                </p>
                <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", borderLeft: "3px solid var(--primary)" }}>
                  <p style={{ fontSize: "11px", fontWeight: "600" }}>PROMPT FOR YOU:</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{activeStimulus.audioPrompt}</p>
                </div>
              </div>
            </div>

            {/* Solo Progress Tracker */}
            <div className="glass-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={16} color="var(--primary)" />
                <span style={{ fontSize: "13px", fontWeight: "600" }}>Solo Coin Progress: {soloProgress} / 10 verified descriptions</span>
              </div>
              <div style={{ width: "120px", background: "#2A2B2F", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${soloProgress * 10}%`, background: "var(--primary)", height: "100%", transition: "width 0.3s ease" }}></div>
              </div>
            </div>

            {/* Mic / Audio Panel */}
            <div className="glass-card mic-panel" style={{ padding: "20px", textAlign: "center" }}>
              {errorMsg && (
                <div className="alert alert-error" style={{ marginBottom: "16px", fontSize: "12px" }}>
                  {errorMsg}
                </div>
              )}

              {!audioUrl && !isRecording && (
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "16px" }}>
                    Speak naturally in your dialect. Descriptions must be spontaneous and describe details of the image.
                  </p>
                  <button className="btn btn-primary btn-record" onClick={startRecording}>
                    <Mic size={15} />
                    <span>Tap to Record Description</span>
                  </button>
                </div>
              )}

              {isRecording && (
                <div>
                  <div className="recording-pulse"></div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "12px 0" }}>
                    Recording audio description... ({recordingTime}s)
                  </p>
                  
                  {/* Frequency Waveform Canvas */}
                  <canvas ref={canvasRef} className="waveform-canvas" width="300" height="50"></canvas>

                  <button className="btn btn-error" onClick={stopRecording}>
                    <Square size={14} />
                    <span>Stop Recording</span>
                  </button>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                    <audio src={audioUrl} controls style={{ borderRadius: "8px" }} />
                    <button className="btn-skip" onClick={() => { setAudioUrl(null); setAudioBlob(null); }} style={{ padding: "10px" }} title="Discard recording">
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={submitSoloValidation} disabled={isValidating}>
                      {isValidating ? (
                        <span>Validating Spontaneous Dialect...</span>
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          <span>Submit to Validation AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {validationResult && (
                <div className="validation-result slide-up" style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "8px",
                  background: validationResult.accept ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
                  border: `1px solid ${validationResult.accept ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: validationResult.accept ? "var(--success)" : "var(--error)" }}>
                      {validationResult.accept ? "Verification Confirmed (+1 Progress)" : "Requires Revision"}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      AI Match Confidence: {validationResult.confidence}%
                    </span>
                  </div>

                  <div style={{ textAlign: "left", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p>
                      <strong>Transcribed Speech:</strong> <span style={{ color: "var(--text-primary)", fontStyle: "italic" }}>"{validationResult.transcription}"</span>
                    </p>
                    <p style={{ color: "var(--text-secondary)" }}>
                      <strong>Assessment Detail:</strong> {validationResult.feedback_message}
                    </p>
                    {validationResult.points_earned > 0 && (
                      <div className="alert alert-success" style={{ display: "flex", gap: "8px", fontSize: "13px", marginTop: "6px" }}>
                        <Coins size={14} color="var(--primary)" />
                        <span><strong>Congratulations!</strong> You completed 10 verified solo submissions and earned 1 Coin!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 3: MULTIPLAYER INTERACTIVE ARENA */}
        {isRegistered && currentScreen === "multiplayer" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>Multiplayer Arena</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Linguistic consensus validation restricted to: <strong>{language} tribe</strong>.
                </p>
              </div>
              
              {roomCode && (
                <button className="btn-skip" onClick={leaveMultiplayerRoom} style={{ color: "var(--error)" }}>
                  Leave Lobby
                </button>
              )}
            </div>

            {/* Setup / Join Room screen */}
            {!roomCode && (
              <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {lobbyError && (
                  <div className="alert alert-error" style={{ fontSize: "12px" }}>
                    {lobbyError}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px" }}>Create a Live Room</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Host a game. Mismatched speakers are blocked. All players must belong to the {language} tribe to join.
                  </p>
                  <button className="btn btn-primary" onClick={createMultiplayerLobby} style={{ alignSelf: "flex-start" }}>
                    <Plus size={15} />
                    <span>Host New Room</span>
                  </button>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h3 style={{ fontSize: "15px" }}>Join Room via Code</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Enter a 4-digit code provided by another player.
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="e.g. 5829"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.trim())}
                      className="form-input"
                      maxLength={4}
                      style={{ width: "120px" }}
                    />
                    <button className="btn btn-primary" onClick={joinMultiplayerLobby}>
                      <span>Join Room</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Live Lobby Screen */}
            {roomCode && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Lobby stats / Code bar */}
                <div className="glass-card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "700" }}>ROOM CODE</span>
                    <h3 style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "1px" }}>{roomCode}</h3>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", textAlign: "right" }}>COIN PROGRESS</span>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>Consensus: {roomConsensusProgress} / 3 matches</span>
                  </div>
                </div>

                {multiplayerNotify && (
                  <div className="alert alert-success" style={{ display: "flex", gap: "8px", fontSize: "13px" }}>
                    <Coins size={14} color="var(--primary)" />
                    <span>{multiplayerNotify}</span>
                  </div>
                )}

                {/* PHASE 1: HOST CHOOSE CARD */}
                {lobbyState === "lobby" && (
                  <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {username === hostUsername ? (
                      <div>
                        <h3 style={{ fontSize: "15px", marginBottom: "8px" }}>You are the Lobby Host! Select a card to present:</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                          {STIMULI.map((stim) => (
                            <div
                              key={stim.id}
                              onClick={() => selectMultiplayerStimulus(stim)}
                              style={{
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid var(--border-subtle)",
                                cursor: "pointer",
                                position: "relative",
                                aspectRatio: "1.6/1"
                              }}
                            >
                              <img src={stim.imageUrl} alt={stim.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{
                                position: "absolute",
                                bottom: "0",
                                left: "0",
                                right: "0",
                                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                                padding: "6px 8px",
                                fontSize: "11px",
                                fontWeight: "600"
                              }}>
                                {stim.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div className="recording-pulse"></div>
                        <h3 style={{ fontSize: "15px", marginTop: "8px" }}>Waiting for Host ({hostUsername}) to select card...</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                          Connected players: {connectedPlayers.map(p => `${p.username} (${p.dialect || "general"})`).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* PHASE 2: SPEAKERS DESCRIBING */}
                {lobbyState === "describing" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* Visual Card */}
                    <div className="glass-card stimulus-display" style={{ overflow: "hidden", padding: "0" }}>
                      <div className="image-container" style={{ maxHeight: "160px" }}>
                        <img src={activeWsStimulus.imageUrl} alt={activeWsStimulus.title} className="stimulus-image" />
                      </div>
                      <div style={{ padding: "12px" }}>
                        <h3 style={{ fontSize: "14px" }}>{activeWsStimulus.title}</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{activeWsStimulus.audioPrompt}</p>
                      </div>
                    </div>

                    {/* Microphone input */}
                    {username !== hostUsername && (
                      <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Active Dialect: {activeDialect}</h3>
                        
                        {!audioUrl && !isRecording && (
                          <button className="btn btn-primary" onClick={startRecording}>
                            <Mic size={14} />
                            <span>Record Description</span>
                          </button>
                        )}

                        {isRecording && (
                          <div>
                            <div className="recording-pulse"></div>
                            <p style={{ fontSize: "12px", margin: "8px 0" }}>Recording audio ({recordingTime}s)...</p>
                            <button className="btn btn-error" onClick={stopRecording}>
                              <Square size={13} />
                              <span>Stop Recording</span>
                            </button>
                          </div>
                        )}

                        {audioUrl && !isRecording && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <audio src={audioUrl} controls style={{ margin: "0 auto" }} />
                            <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                              <button className="btn-skip" onClick={() => { setAudioUrl(null); setAudioBlob(null); }}>Discard</button>
                              <button className="btn btn-primary" onClick={submitMultiplayerRecording} disabled={isValidating}>
                                {isValidating ? "Uploading..." : "Submit & Transcribe"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Submissions List */}
                    <div className="glass-card" style={{ padding: "16px" }}>
                      <h3 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>Live Submission Stream:</h3>
                      {wsSubmissions.length === 0 ? (
                        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>No descriptions submitted yet.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {wsSubmissions.map((sub, idx) => (
                            <div key={idx} style={{ padding: "8px 12px", background: "#16171A", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                                <strong>{sub.username} ({sub.dialect || "general"})</strong>
                                <span>Voice file uploaded</span>
                              </div>
                              <span style={{ fontSize: "13px", fontStyle: "italic" }}>"{sub.text}"</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {username === hostUsername && wsSubmissions.length > 0 && (
                        <button className="btn btn-primary" onClick={transitionToVoting} style={{ marginTop: "14px", width: "100%" }}>
                          Close Submissions & Open Consensus Voting
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* PHASE 3: VOTING & CONSENSUS EDITS */}
                {lobbyState === "voting" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    <div className="glass-card" style={{ padding: "16px" }}>
                      <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>Consensus Review & Orthography Corrections</h3>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {wsSubmissions.map((sub, idx) => {
                          const playerVotes = wsVotes[sub.username] || {};
                          const yesVotes = Object.values(playerVotes).filter(v => v === true).length;
                          const totalVotes = Object.keys(playerVotes).length;
                          
                          // Determine if this user already voted
                          const myVote = playerVotes[username];

                          return (
                            <div key={idx} style={{ padding: "12px", background: "#16171A", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700" }}>{sub.username} ({sub.dialect || "general"})</span>
                                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                  Agreement: {yesVotes} / {totalVotes || 0} votes
                                </span>
                              </div>

                              <p style={{ fontSize: "13px", fontStyle: "italic", marginBottom: "8px" }}>
                                Original: "{sub.text}"
                              </p>

                              {/* Suggest spelling / orthography correction input */}
                              {username !== sub.username && (
                                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                                  <input
                                    type="text"
                                    placeholder="Suggest orthography correction..."
                                    defaultValue={wsCorrections[sub.username] || ""}
                                    onBlur={(e) => submitSpellingCorrection(sub.username, e.target.value)}
                                    className="form-input"
                                    style={{ fontSize: "11px", padding: "4px 8px" }}
                                  />
                                </div>
                              )}

                              {wsCorrections[sub.username] && (
                                <p style={{ fontSize: "12px", color: "var(--primary)", marginBottom: "10px" }}>
                                  <strong>Consensus Suggestion:</strong> "{wsCorrections[sub.username]}"
                                </p>
                              )}

                              {/* Vote buttons */}
                              {username !== sub.username && (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => castVote(sub.username, true)}
                                    className="btn-skip"
                                    style={{
                                      background: myVote === true ? "var(--success)" : "none",
                                      color: myVote === true ? "black" : "var(--text-secondary)",
                                      padding: "3px 10px",
                                      fontSize: "11px"
                                    }}
                                  >
                                    Accurate
                                  </button>
                                  <button
                                    onClick={() => castVote(sub.username, false)}
                                    className="btn-skip"
                                    style={{
                                      background: myVote === false ? "var(--error)" : "none",
                                      color: myVote === false ? "white" : "var(--text-secondary)",
                                      padding: "3px 10px",
                                      fontSize: "11px"
                                    }}
                                  >
                                    Incorrect Dialect
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Host Commit consensus buttons */}
                      {username === hostUsername && (
                        <div style={{ marginTop: "16px" }}>
                          <h4 style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>Host Actions: Finalize Approved Outputs</h4>
                          <button
                            onClick={() => {
                              // Compile final descriptions map (approve all by default, override with corrections)
                              const finalSubmissionsMap: any = {};
                              wsSubmissions.forEach(sub => {
                                finalSubmissionsMap[sub.username] = {
                                  approved: true,
                                  text: wsCorrections[sub.username] || sub.text
                                };
                              });
                              commitLobbyConsensus(finalSubmissionsMap);
                            }}
                            className="btn btn-primary"
                            style={{ width: "100%" }}
                          >
                            Save Corrected Outputs & Next Card
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCREEN 4: PLATFORM OWNER ADMIN DASHBOARD */}
        {isRegistered && currentScreen === "admin" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>Dataset Quality Dashboard</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Platform Owner Auditing Interface: play audio files and verify ASR transcriptions.
                </p>
              </div>
              <button className="btn-skip" onClick={() => fetchAdminSubmissions()}>Refresh</button>
            </div>

            {/* Filter selectors */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setAdminFilter("all")} className={`btn-skip ${adminFilter === "all" ? "active" : ""}`} style={{ background: adminFilter === "all" ? "#3A3B40" : "none" }}>All Submissions</button>
              <button onClick={() => setAdminFilter("pending")} className={`btn-skip ${adminFilter === "pending" ? "active" : ""}`} style={{ background: adminFilter === "pending" ? "#3A3B40" : "none" }}>Pending Audit</button>
              <button onClick={() => setAdminFilter("approved")} className={`btn-skip ${adminFilter === "approved" ? "active" : ""}`} style={{ background: adminFilter === "approved" ? "#3A3B40" : "none" }}>Approved</button>
            </div>

            {/* Submissions auditing list */}
            <div className="glass-card" style={{ padding: "0", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#16171A", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>ID</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Contributor</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Tribe/Dialect</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Stimulus</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Raw Voice / Audio Playback</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>ASR Transcription Text</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Audit Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSubmissions
                    .filter(sub => adminFilter === "all" ? true : sub.status === adminFilter)
                    .map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "10px" }}>{sub.id}</td>
                        <td style={{ padding: "10px" }}>{sub.username}</td>
                        <td style={{ padding: "10px" }}>{sub.language} ({sub.dialect || "general"})</td>
                        <td style={{ padding: "10px" }}>{sub.image_id}</td>
                        <td style={{ padding: "10px" }}>
                          {/* RAW SPEECH AUDIO FILE PLAYBACK */}
                          <audio src={`${API_BASE}${sub.audio_path}`} controls style={{ height: "28px", width: "160px" }} />
                        </td>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="text"
                            value={editingTexts[sub.id] !== undefined ? editingTexts[sub.id] : (sub.consensus_text || sub.transcription)}
                            onChange={(e) => setEditingTexts({ ...editingTexts, [sub.id]: e.target.value })}
                            className="form-input"
                            style={{ fontSize: "11px", padding: "4px 8px" }}
                          />
                        </td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button
                              onClick={() => verifySubmission(sub.id, "approved", editingTexts[sub.id])}
                              className="btn-skip"
                              style={{ background: sub.status === "approved" ? "var(--success)" : "none", color: sub.status === "approved" ? "black" : "var(--success)", border: "1px solid var(--success)", padding: "2px 6px" }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => verifySubmission(sub.id, "rejected")}
                              className="btn-skip"
                              style={{ background: sub.status === "rejected" ? "var(--error)" : "none", color: sub.status === "rejected" ? "white" : "var(--error)", border: "1px solid var(--error)", padding: "2px 6px" }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SCREEN 5: WALLET REDEMPTION */}
        {isRegistered && currentScreen === "wallet" && (
          <div className="slide-up" style={{ maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "20px" }}>Wallet & Coin Redemption</h2>
            <div className="glass-card points-card" style={{ padding: "20px", textAlign: "center", background: "linear-gradient(135deg, #1A1A1D, #000)" }}>
              <Coins size={36} color="var(--primary)" style={{ margin: "0 auto 10px auto" }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Current Balance</span>
              <h3 style={{ fontSize: "32px", fontWeight: "800", color: "white", marginTop: "4px" }}>{points} Coins</h3>
              <p style={{ color: "var(--primary)", fontSize: "14px", fontWeight: "600", marginTop: "4px" }}>
                Valued at: ₦{points}.00 NGN (1 Coin = ₦1.00 Naira)
              </p>
            </div>

            <div className="glass-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Convert Coins to Mobile Airtime</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>Select Telecom Carrier</label>
                  <select className="form-input">
                    <option>MTN Nigeria</option>
                    <option>Airtel Nigeria</option>
                    <option>Glo Nigeria</option>
                    <option>9mobile Nigeria</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>Phone Number</label>
                  <input type="tel" placeholder="e.g. 08031234567" className="form-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>Coins to Redeem</label>
                  <input type="number" defaultValue={50} min={10} max={points} className="form-input" />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    alert(`Airtime request submitted! ₦${50} airtime will be processed shortly.`);
                    setPoints(prev => Math.max(0, prev - 50));
                  }}
                  disabled={points < 50}
                >
                  Confirm Instant Airtime Recharge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 6: LINGUISTIC DIALECT BRIDGE */}
        {isRegistered && currentScreen === "bridge" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "20px" }}>Dialect Bridge</h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "-6px" }}>
              Explore how words and orthography shift across Igbo, Yoruba, and Swahili dialects.
            </p>
            <div className="glass-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>Source Dialect</label>
                  <select className="form-input" defaultValue="Abiriba">
                    <option>Abiriba</option>
                    <option>Onitsha</option>
                    <option>Owerri</option>
                    <option>Nsukka</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>Target Dialect</label>
                  <select className="form-input" defaultValue="Owerri">
                    <option>Abiriba</option>
                    <option>Onitsha</option>
                    <option>Owerri</option>
                    <option>Nsukka</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "#16171A", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Selected Stimulus: {activeStimulus.title}</p>
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--primary)" }}>Source Text (Abiriba)</span>
                    <p style={{ fontSize: "14px", fontStyle: "italic", marginTop: "2px" }}>
                      "{activeStimulus.dialectsData?.["Abiriba"]?.audioMockText || "No metadata entry for this dialect."}"
                    </p>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px dashed var(--border-subtle)" }} />
                  <div>
                    <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--success)" }}>Target Translation (Owerri)</span>
                    <p style={{ fontSize: "14px", fontStyle: "italic", marginTop: "2px" }}>
                      "{activeStimulus.dialectsData?.["Owerri"]?.audioMockText || "No metadata entry for this dialect."}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 7: RANK LEADERBOARD */}
        {isRegistered && currentScreen === "leaderboard" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "20px" }}>Leaderboards</h2>
            <div className="glass-card" style={{ padding: "16px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>Dialect Contribution Ranks</h3>
              <div className="leaderboard-list">
                <div className="leaderboard-row">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className="leaderboard-rank rank-gold">1</span>
                    <span style={{ fontWeight: "700" }}>Owerri Igbo</span>
                  </div>
                  <span>421 Contribution Hours</span>
                </div>
                <div className="leaderboard-row">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className="leaderboard-rank rank-silver">2</span>
                    <span style={{ fontWeight: "700" }}>Onitsha Igbo</span>
                  </div>
                  <span>298 Contribution Hours</span>
                </div>
                <div className="leaderboard-row">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span className="leaderboard-rank rank-bronze">3</span>
                    <span style={{ fontWeight: "700" }}>Abiriba Igbo</span>
                  </div>
                  <span>196 Contribution Hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Navigation Footer */}
      {isRegistered && (
        <footer className="app-footer-nav">
          <button onClick={() => setCurrentScreen("solo")} className={`footer-nav-btn ${currentScreen === "solo" ? "active" : ""}`}>
            <Mic size={15} />
            <span>Solo</span>
          </button>
          <button onClick={() => setCurrentScreen("multiplayer")} className={`footer-nav-btn ${currentScreen === "multiplayer" ? "active" : ""}`}>
            <Users size={15} />
            <span>Arena</span>
          </button>
          <button onClick={() => setCurrentScreen("bridge")} className={`footer-nav-btn ${currentScreen === "bridge" ? "active" : ""}`}>
            <BookOpen size={15} />
            <span>Bridge</span>
          </button>
          <button onClick={() => setCurrentScreen("wallet")} className={`footer-nav-btn ${currentScreen === "wallet" ? "active" : ""}`}>
            <Wallet size={15} />
            <span>Wallet</span>
          </button>
          <button onClick={() => setCurrentScreen("leaderboard")} className={`footer-nav-btn ${currentScreen === "leaderboard" ? "active" : ""}`}>
            <Award size={15} />
            <span>Rank</span>
          </button>
        </footer>
      )}
    </div>
  );
}
