import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Volume2,
  Users,
  Wallet,
  Globe,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Coins,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { STIMULI, LANGUAGES_AND_DIALECTS } from "./data/stimuli";
import type { Stimulus } from "./data/stimuli";

export default function App() {
  // Navigation: "onboarding" | "solo" | "multiplayer" | "wallet" | "bridge" | "leaderboard"
  const [currentScreen, setCurrentScreen] = useState<string>("onboarding");

  // User profile state
  const [username, setUsername] = useState<string>("");
  const [language, setLanguage] = useState<string>("Igbo");
  const [dialect, setDialect] = useState<string>("Abiriba");
  const [points, setPoints] = useState<number>(120); // Starting points
  const [level, setLevel] = useState<number>(1);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

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

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Audio recording hardware hooks
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Multiplayer mode simulation state
  const [lobbyState, setLobbyState] = useState<"lobby" | "selecting" | "describing" | "voting" | "consensus">("lobby");
  const [multiplayerStimulus, setMultiplayerStimulus] = useState<Stimulus>(STIMULI[1]); // Grinding Pepper
  const [multiplayerTimer, setMultiplayerTimer] = useState<number>(0);
  const [peerSubmissions, setPeerSubmissions] = useState<any[]>([]);
  const [peerVotes, setPeerVotes] = useState<any>({});
  const [hasVotedAll, setHasVotedAll] = useState<boolean>(false);

  // Wallet State
  const [airtimeCarrier, setAirtimeCarrier] = useState<string>("MTN");
  const [airtimePhone, setAirtimePhone] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<number>(50); // Points to redeem
  const [transactions, setTransactions] = useState<any[]>([
    { id: "tx-1", type: "solo", detail: "Solo Description (Mug)", points: 10, date: "Today, 11:20 AM" },
    { id: "tx-2", type: "multi", detail: "Multiplayer Consensus Bonus", points: 25, date: "Yesterday, 4:15 PM" },
    { id: "tx-3", type: "redeem", detail: "Airtime Top-up (MTN)", points: -50, date: "2 days ago" }
  ]);
  const [showRedeemSuccess, setShowRedeemSuccess] = useState<boolean>(false);

  // Dialect Bridge Playground State
  const [bridgeSource, setBridgeSource] = useState<string>("Abiriba");
  const [bridgeTarget, setBridgeTarget] = useState<string>("Nnewi");
  const [bridgePhraseIndex, setBridgePhraseIndex] = useState<number>(0);

  // Pre-configured phrases for the Dialect Bridge
  const BRIDGE_PHRASES = [
    {
      concept: "A mug is sitting on top of the table",
      standard: "Kọpụ eji añụ mmiri dị n'elu tebulu.",
      translations: {
        "Abiriba": { text: "Ihe awiko ndyo ibo nakwea kop, eji ya umiri, ona cho baro obara.", audioText: "Ihe awiko ndyo ibo nakwea kop..." },
        "Nnewi": { text: "Ihe eji añụ mmiri tọrọ n'elu tebulu.", audioText: "Ihe eji añụ mmiri tọrọ..." },
        "Onitsha": { text: "Kọpụ eji anụ mmiri sị n'elu tebulu.", audioText: "Kọpụ eji anụ mmiri sị..." },
        "Owerri": { text: "Kọpụ eji añụ mmiri dị n'elu tebulu.", audioText: "Kọpụ eji añụ mmiri dị..." }
      }
    },
    {
      concept: "The woman is pounding peppers inside a mortar",
      standard: "Nwaanyi na-asu ose n'ime ikwe.",
      translations: {
        "Abiriba": { text: "Nwanyị na-agbaji ose n'okwe.", audioText: "Nwanyị na-agbaji ose n'okwe" },
        "Nnewi": { text: "Nwaanyi na-asu ose n'ikwe.", audioText: "Nwaanyi na-asu ose n'ikwe" },
        "Onitsha": { text: "Nwanyị na-asụ ose n'ikwe.", audioText: "Nwanyị na-asụ ose n'ikwe" },
        "Owerri": { text: "Nwaanyi na-asu ose n'ime ikwe.", audioText: "Nwaanyi na-asu ose n'ime ikwe" }
      }
    }
  ];

  // Check backend server health on load
  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setBackendStatus("online");
        else setBackendStatus("offline");
      })
      .catch(() => setBackendStatus("offline"));
  }, []);

  // Level computation logic based on points
  useEffect(() => {
    const computedLevel = Math.floor(points / 100) + 1;
    if (computedLevel !== level && computedLevel > 0) {
      setLevel(computedLevel);
    }
  }, [points]);

  // Audio Recording visualizer drawing
  const startCanvasDrawing = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "#16171A";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        const opacity = Math.min(barHeight / 100, 1);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8 + 0.2})`;
        ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth - 2, barHeight);
        x += barWidth;
      }
    };
    draw();
  };

  // Start Audio Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setValidationResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: "audio/webm" };
      let mediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for Safari/iOS
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
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

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start waveform drawing
      setTimeout(() => startCanvasDrawing(stream), 100);
    } catch (err) {
      console.error("Microphone access failed:", err);
      // Fallback: simulated recording if hardware not available
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Submit Description to Python Backend or Simulation
  const submitDescription = async () => {
    if (!audioBlob) {
      // Fallback: If microphone hardware was simulated, do a local simulation
      simulateValidation();
      return;
    }

    setIsValidating(true);

    const activeStimulus = STIMULI[activeStimulusIndex];
    const formData = new FormData();
    formData.append("audio", audioBlob, "description.wav");
    
    // We will append a placeholder image or fetch the active image to append as blob
    try {
      const responseImg = await fetch(activeStimulus.imageUrl);
      const imgBlob = await responseImg.blob();
      formData.append("image", imgBlob, "image.jpg");
    } catch {
      // Fallback empty blob
      formData.append("image", new Blob(), "image.jpg");
    }

    formData.append("language", language);
    formData.append("username", username || "Lexara User");
    formData.append("image_id", activeStimulus.id);

    try {
      const response = await fetch("http://localhost:8000/api/validate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server error validation");
      }

      const result = await response.json();
      setValidationResult(result);
      setPoints((prev) => prev + result.points_earned);
      
      if (result.points_earned > 0) {
        setTransactions((prev) => [
          {
            id: `tx-${Date.now()}`,
            type: "solo",
            detail: `Solo Validation (${activeStimulus.title})`,
            points: result.points_earned,
            date: "Just now"
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.warn("Backend unavailable, running high-fidelity local simulator:", err);
      simulateValidation();
    } finally {
      setIsValidating(false);
    }
  };

  // Simulation fallback in case backend is offline
  const simulateValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      const activeStimulus = STIMULI[activeStimulusIndex];
      const successChance = Math.random() > 0.15; // 85% success rate for simulation
      const confidence = successChance ? Math.floor(Math.random() * 21) + 80 : Math.floor(Math.random() * 30) + 20;
      
      const accept = confidence >= 50;
      const points_earned = confidence >= 80 ? 10 : (confidence >= 50 ? 5 : 0);

      const result = {
        confidence,
        accept,
        feedback_message: accept 
          ? `Great! Your ${dialect} description perfectly matched the visual content.` 
          : `We noticed spelling/dialect shifts. Please record in pure ${dialect}.`,
        points_earned,
        language_detected: language
      };

      setValidationResult(result);
      setPoints((prev) => prev + points_earned);
      
      if (points_earned > 0) {
        setTransactions((prev) => [
          {
            id: `tx-${Date.now()}`,
            type: "solo",
            detail: `Solo Validation (${activeStimulus.title} in ${dialect})`,
            points: points_earned,
            date: "Just now"
          },
          ...prev
        ]);
      }
      setIsValidating(false);
    }, 2000);
  };

  // Skip / Next Stimulus in Solo mode
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

  // Handle registration onboarding
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsRegistered(true);
    setCurrentScreen("solo");
  };

  // Simulated Multiplayer Game Loop
  const startMultiplayerLobby = () => {
    setLobbyState("lobby");
    setPeerSubmissions([]);
    setPeerVotes({});
    setHasVotedAll(false);
    
    // Auto sequence of multiplayer game
    setTimeout(() => {
      setLobbyState("selecting");
    }, 1000);
  };

  // Select stimulus in multiplayer lobby simulation
  const selectMultiplayerStimulus = (stim: Stimulus) => {
    setMultiplayerStimulus(stim);
    setLobbyState("describing");
    setMultiplayerTimer(30);

    // Peer submissions timeline simulation
    const timerInterval = setInterval(() => {
      setMultiplayerTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          startVotingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Simulate other players submitting descriptions
  const startVotingPhase = () => {
    setLobbyState("voting");
    
    // Peer submissions list
    const peers = [
      { id: "peer-1", name: "Chinedu", dialect: "Onitsha", text: multiplayerStimulus.dialectsData["Onitsha"]?.standard || "Standard version description", audioLen: 4.2 },
      { id: "peer-2", name: "Adaeze", dialect: "Owerri", text: multiplayerStimulus.dialectsData["Owerri"]?.standard || "Central version description", audioLen: 5.5 },
      { id: "peer-3", name: "Kalu", dialect: "Abiriba", text: multiplayerStimulus.dialectsData["Abiriba"]?.standard || "Abiriba version description", audioLen: 6.8 }
    ];

    setPeerSubmissions(peers.filter(p => p.dialect !== dialect)); // Filter out if matching user dialect for voting variety
  };

  // Vote on peer submission
  const handleVote = (peerId: string, approve: boolean) => {
    setPeerVotes((prev: any) => {
      const updated = { ...prev, [peerId]: approve };
      if (Object.keys(updated).length === peerSubmissions.length) {
        setHasVotedAll(true);
      }
      return updated;
    });
  };

  // Consensus summary phase
  const finishVoting = () => {
    setLobbyState("consensus");
    setPoints((prev) => prev + 15); // Add multiplayer bonus points
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "multi",
        detail: `Multiplayer Consensus (${multiplayerStimulus.title})`,
        points: 15,
        date: "Just now"
      },
      ...prev
    ]);
  };

  // Handle Airtime redemption logic
  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (points < redeemAmount) return;

    setPoints((prev) => prev - redeemAmount);
    setTransactions((prev) => [
      {
        id: `tx-${Date.now()}`,
        type: "redeem",
        detail: `Redeemed ${redeemAmount} pts to ${airtimeCarrier} Airtime`,
        points: -redeemAmount,
        date: "Just now"
      },
      ...prev
    ]);
    setShowRedeemSuccess(true);
    setTimeout(() => {
      setShowRedeemSuccess(false);
    }, 4000);
  };

  return (
    <div className="app-container">
      {/* Top Application Bar */}
      <header className="app-header">
        <div className="app-title-group" style={{ cursor: "pointer" }} onClick={() => {
          setIsRegistered(false);
          setCurrentScreen("onboarding");
        }} title="Reset setup & profile">
          <Globe className="app-logo-icon" size={18} color="var(--primary)" />
          <h1 className="app-logo">LEXARA</h1>
        </div>

        {isRegistered && (
          <div style={{ display: "flex", gap: "8px" }}>
            {/* User Level */}
            <div className="user-status-badge">
              <Award size={13} color="var(--text-secondary)" />
              <span>Lvl {level}</span>
            </div>
            {/* User Wallet Balance */}
            <div className="user-status-badge points" onClick={() => setCurrentScreen("wallet")} style={{ cursor: "pointer" }}>
              <Coins size={13} color="var(--text-secondary)" />
              <span>{points} Pts</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Screen Content Router */}
      <main className="app-content">
        
        {/* SCREEN 1: ONBOARDING */}
        {currentScreen === "onboarding" && !isRegistered && (
          <div className="onboarding-screen slide-up">
            <div className="onboarding-logo">
              <span className="logo-main gradient-text">Lexara</span>
              <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "14px" }}>
                AI gamification for African dialects. Describe events and items to preserve your dialect, while earning convertible coins for cash or mobile airtime.
              </p>
            </div>

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Speaker Nickname</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Native Language</label>
                <select
                  className="select-input"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    const dialects = (LANGUAGES_AND_DIALECTS as any)[e.target.value] || [];
                    setDialect(dialects[0] || "");
                  }}
                >
                  {Object.keys(LANGUAGES_AND_DIALECTS).map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Your Dialect / Accent Group</label>
                <div className="dialect-grid">
                  {((LANGUAGES_AND_DIALECTS as any)[language] || []).map((dial: string) => (
                    <div
                      key={dial}
                      className={`dialect-card ${dialect === dial ? "selected" : ""}`}
                      onClick={() => setDialect(dial)}
                    >
                      {dial}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "12px" }}>
                Begin Structured Play <ArrowRight size={16} />
              </button>
            </form>

            <div className="glass-card" style={{ marginTop: "10px", padding: "14px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.01)" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <ShieldCheck size={16} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h4 style={{ fontSize: "13px", color: "var(--primary)" }}>Privacy & Dataset Integrity</h4>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Your recordings compile into open-source dataset structures to build dialect-aware AI models. No personal identifiers are shared.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: SOLO GAMEPLAY */}
        {currentScreen === "solo" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>Solo Mode</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Speaking: <strong>{dialect} {language}</strong>{" "}
                  <span 
                    onClick={() => {
                      setIsRegistered(false);
                      setCurrentScreen("onboarding");
                    }} 
                    style={{ 
                      color: "var(--text-primary)", 
                      textDecoration: "underline", 
                      cursor: "pointer", 
                      marginLeft: "6px",
                      fontSize: "11px",
                      fontWeight: "500"
                    }}
                    title="Change language or dialect"
                  >
                    Change
                  </span>
                </p>
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
                {imageErrors[STIMULI[activeStimulusIndex].id] ? (
                  <div className="image-placeholder-fallback">
                    <Globe size={32} color="var(--text-muted)" />
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>Image Offline</span>
                  </div>
                ) : (
                  <img
                    src={STIMULI[activeStimulusIndex].imageUrl}
                    alt={STIMULI[activeStimulusIndex].title}
                    className="stimulus-image"
                    onError={() => handleImageError(STIMULI[activeStimulusIndex].id)}
                  />
                )}
                <span className="category-tag">{STIMULI[activeStimulusIndex].category}</span>
              </div>

              <div style={{ padding: "16px" }}>
                <h3 style={{ fontSize: "16px" }}>{STIMULI[activeStimulusIndex].title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  {STIMULI[activeStimulusIndex].description}
                </p>
                <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", borderLeft: "3px solid var(--primary)" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600" }}>PROMPT FOR YOU:</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{STIMULI[activeStimulusIndex].audioPrompt}</p>
                </div>
              </div>
            </div>

            {/* Recording interaction board */}
            {!validationResult ? (
              <div className="glass-card recorder-console">
                {isRecording ? (
                  <>
                    <canvas ref={canvasRef} className="waveform-canvas" width={400} height={60} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <span className="recording-status" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--danger)", display: "inline-block" }}></span>
                        Recording Spontaneous Speech...
                      </span>
                      <span className="recording-time">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                      </span>
                    </div>

                    <button className="btn btn-danger recording-pulse" onClick={stopRecording}>
                      <Square size={16} /> Stop Recording
                    </button>
                  </>
                ) : (
                  <>
                    {audioUrl ? (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px" }}>
                          <Volume2 size={16} color="var(--text-secondary)" />
                          <audio src={audioUrl} controls style={{ width: "100%", height: "32px" }} />
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button className="btn btn-secondary" onClick={() => { setAudioUrl(null); setAudioBlob(null); }} style={{ flex: 1 }}>
                            <RotateCcw size={14} /> Redo
                          </button>
                          <button className="btn btn-primary" onClick={submitDescription} style={{ flex: 2 }} disabled={isValidating}>
                            {isValidating ? "AI Semantic Validation..." : "Submit to Pipeline"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
                          Speak naturally in your dialect. Descriptions must be spontaneous and describe details of the image.
                        </p>
                        <button className="btn btn-primary" onClick={startRecording}>
                          <Mic size={16} /> Tap to Record Description
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* Validation result display */
              <div className="glass-card slide-up" style={{
                border: `1px solid ${validationResult.accept ? "var(--success)" : "var(--danger)"}`,
                boxShadow: "none"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", color: validationResult.accept ? "var(--success)" : "var(--danger)" }}>
                      {validationResult.accept ? (
                        <>
                          <CheckCircle size={16} /> Description Accepted
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} /> Needs Improvement
                        </>
                      )}
                    </h3>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Confidence Metric: <strong>{validationResult.confidence}%</strong> | Dialect Match: <strong>{validationResult.language_detected}</strong>
                    </p>
                  </div>
                  {validationResult.points_earned > 0 && (
                    <div style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--primary)",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600"
                    }}>
                      +{validationResult.points_earned} Pts
                    </div>
                  )}
                </div>

                <div style={{ margin: "14px 0", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", fontSize: "13px" }}>
                  <p style={{ fontStyle: "italic", color: "var(--text-primary)" }}>
                    "{STIMULI[activeStimulusIndex].dialectsData[dialect]?.audioMockText || "Audible local description matches stimulus content."}"
                  </p>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  {validationResult.feedback_message}
                </p>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button className="btn btn-secondary" onClick={() => setValidationResult(null)} style={{ flex: 1 }}>
                    Try Again
                  </button>
                  <button className="btn btn-primary" onClick={nextStimulus} style={{ flex: 2 }}>
                    Next Card <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Solo Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "10px" }}>
              <div className="glass-card" style={{ padding: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>Contributed</span>
                <span style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-title)" }}>4 Cards</span>
              </div>
              <div className="glass-card" style={{ padding: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>Accuracy</span>
                <span style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-title)", color: "var(--primary)" }}>92%</span>
              </div>
              <div className="glass-card" style={{ padding: "12px", textAlign: "center" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>Daily Streak</span>
                <span style={{ fontSize: "16px", fontWeight: "700", fontFamily: "var(--font-title)", color: "var(--accent)" }}>3 Days</span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: MULTIPLAYER ARENA */}
        {currentScreen === "multiplayer" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px" }}>Multiplayer Arena</h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Cross-dialect verification play
                </p>
              </div>
              <div className="user-status-badge">
                <Users size={12} color="var(--text-secondary)" />
                <span>4 Active</span>
              </div>
            </div>

            {/* PHASE 1: LOBBY ENTRY */}
            {lobbyState === "lobby" && (
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", textAlign: "center" }}>
                <Users size={32} color="var(--text-secondary)" style={{ margin: "0 auto" }} />
                <div>
                  <h3 style={{ fontSize: "18px" }}>Forming Peer Validation Group</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>
                    Connecting dialect speakers from Owerri, Nnewi, Abiriba, and Onitsha...
                  </p>
                </div>

                <div className="peers-grid" style={{ margin: "10px 0" }}>
                  <div className="peer-row">
                    <div className="peer-name-group">
                      <div className="peer-avatar">C</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Chinedu</div>
                        <span className="peer-dialect">Onitsha</span>
                      </div>
                    </div>
                    <span className="peer-status ready">Connected</span>
                  </div>
                  <div className="peer-row">
                    <div className="peer-name-group">
                      <div className="peer-avatar" style={{ background: "var(--accent)" }}>O</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Obinna</div>
                        <span className="peer-dialect">Owerri</span>
                      </div>
                    </div>
                    <span className="peer-status ready">Connected</span>
                  </div>
                  <div className="peer-row">
                    <div className="peer-name-group">
                      <div className="peer-avatar" style={{ background: "purple", color: "white" }}>A</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Ada</div>
                        <span className="peer-dialect">Nnewi</span>
                      </div>
                    </div>
                    <span className="peer-status speaking">Searching...</span>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={startMultiplayerLobby}>
                  Join Interactive Session
                </button>
              </div>
            )}

            {/* PHASE 2: SELECTING STIMULUS */}
            {lobbyState === "selecting" && (
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Lobby Active</span>
                  <h3 style={{ fontSize: "18px", marginTop: "4px" }}>You are the Selector!</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Select a stimulus to present to the peer group.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginTop: "10px" }}>
                  {STIMULI.map((stim) => (
                    <div
                      key={stim.id}
                      onClick={() => selectMultiplayerStimulus(stim)}
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        position: "relative",
                        aspectRatio: "1/1"
                      }}
                    >
                      {imageErrors[stim.id] ? (
                        <div className="image-placeholder-fallback" style={{ height: "100%" }}>
                          <Globe size={20} color="var(--text-muted)" />
                          <span style={{ fontSize: "9.5px", color: "var(--text-secondary)", marginTop: "2px" }}>{stim.title}</span>
                        </div>
                      ) : (
                        <img
                          src={stim.imageUrl}
                          alt={stim.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={() => handleImageError(stim.id)}
                        />
                      )}
                      <div style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        right: "0",
                        background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                        padding: "8px",
                        fontSize: "11px",
                        fontWeight: "600"
                      }}>
                        {stim.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHASE 3: DESCRIBING */}
            {lobbyState === "describing" && (
              <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "center" }}>
                <h3 style={{ fontSize: "18px" }}>Peers Describing Stimulus</h3>
                <div className="image-container" style={{ maxHeight: "150px" }}>
                  {imageErrors[multiplayerStimulus.id] ? (
                    <div className="image-placeholder-fallback">
                      <Globe size={24} color="var(--text-muted)" />
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "4px" }}>{multiplayerStimulus.title}</span>
                    </div>
                  ) : (
                    <img
                      src={multiplayerStimulus.imageUrl}
                      alt={multiplayerStimulus.title}
                      className="stimulus-image"
                      onError={() => handleImageError(multiplayerStimulus.id)}
                    />
                  )}
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Peers are recording voice descriptions in their respective dialects.
                </p>

                <div className="peers-grid" style={{ margin: "10px 0" }}>
                  <div className="peer-row">
                    <div className="peer-name-group">
                      <div className="peer-avatar">C</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Chinedu</div>
                        <span className="peer-dialect">Onitsha</span>
                      </div>
                    </div>
                    <span className="peer-status speaking">Recording...</span>
                  </div>
                  <div className="peer-row">
                    <div className="peer-name-group">
                      <div className="peer-avatar" style={{ background: "var(--accent)" }}>O</div>
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "13px" }}>Obinna</div>
                        <span className="peer-dialect">Owerri</span>
                      </div>
                    </div>
                    <span className="peer-status speaking">Recording...</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Remaining submission window:</span>
                  <strong style={{ fontSize: "16px", color: "var(--accent)" }}>{multiplayerTimer}s</strong>
                </div>
              </div>
            )}

            {/* PHASE 4: VOTING */}
            {lobbyState === "voting" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="glass-card" style={{ textAlign: "center", padding: "14px" }}>
                  <h3 style={{ fontSize: "16px" }}>Linguistic Peer Review</h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Vote on correctness and dialect accuracy. Disagreements refine AI reference standards.
                  </p>
                </div>

                <div className="voting-section">
                  {peerSubmissions.map((sub) => (
                    <div key={sub.id} className="vote-card">
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="peer-avatar" style={{ width: "24px", height: "24px", fontSize: "10px" }}>{sub.name[0]}</div>
                          <span style={{ fontWeight: "600", fontSize: "13px" }}>{sub.name} ({sub.dialect})</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "var(--primary)", fontSize: "11px", background: "rgba(16,185,129,0.1)", padding: "2px 8px", borderRadius: "12px" }}>
                          <Mic size={10} />
                          <span>{sub.audioLen}s clip</span>
                        </div>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px", fontSize: "13px", borderLeft: "3px solid var(--accent)" }}>
                        <p style={{ fontStyle: "italic" }}>"{sub.text}"</p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Does this match {sub.dialect} dialect?</span>
                        <div className="vote-buttons" style={{ width: "120px" }}>
                          <button
                            className={`vote-btn yes ${peerVotes[sub.id] === true ? "active-glow" : ""}`}
                            onClick={() => handleVote(sub.id, true)}
                            style={{
                              backgroundColor: peerVotes[sub.id] === true ? "var(--primary)" : "rgba(16, 185, 129, 0.1)",
                              color: peerVotes[sub.id] === true ? "#0E1017" : "var(--primary)"
                            }}
                          >
                            Yes
                          </button>
                          <button
                            className={`vote-btn no ${peerVotes[sub.id] === false ? "active-glow" : ""}`}
                            onClick={() => handleVote(sub.id, false)}
                            style={{
                              backgroundColor: peerVotes[sub.id] === false ? "var(--danger)" : "rgba(239, 68, 68, 0.1)",
                              color: peerVotes[sub.id] === false ? "white" : "var(--danger)"
                            }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className={`btn ${hasVotedAll ? "btn-primary" : "btn-disabled"}`}
                  disabled={!hasVotedAll}
                  onClick={finishVoting}
                >
                  Submit Votes & Calculate Consensus
                </button>
              </div>
            )}

            {/* PHASE 5: CONSENSUS */}
            {lobbyState === "consensus" && (
              <div className="glass-card slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px", border: "1px solid var(--border-subtle)", boxShadow: "none" }}>
                <div style={{ textAlign: "center" }}>
                  <Sparkles size={24} color="var(--warning)" style={{ margin: "0 auto 8px" }} />
                  <h3 style={{ fontSize: "18px" }}>Consensus Achieved!</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    The submissions clear the peer threshold. The reference dataset is updated!
                  </p>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.01)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "14px" }}>
                  <h4 style={{ fontSize: "13px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={14} color="var(--text-secondary)" /> Dataset Integration Log
                  </h4>
                  <ul style={{ fontSize: "11px", color: "var(--text-secondary)", listStyleType: "none", padding: "0", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li>• Igbo / Onitsha: Standardized audio reference locked (100% agreement)</li>
                    <li>• Igbo / Owerri: Spontaneous variation labeled & saved (100% agreement)</li>
                    <li>• Added <strong>+15 Points</strong> to wallet balance</li>
                  </ul>
                </div>

                <button className="btn btn-primary" onClick={() => setLobbyState("lobby")}>
                  Play Next Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* SCREEN 4: WALLET & CASH OUT */}
        {currentScreen === "wallet" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "20px" }}>Redeem Rewards</h2>

            {/* Wallet Balance Card */}
            <div className="glass-card wallet-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="wallet-subtext">EARNED REWARD POINT BALANCE</span>
                  <div className="wallet-balance">{points} Pts</div>
                  <span className="wallet-subtext" style={{ color: "var(--text-secondary)" }}>
                    Value equivalent: <strong>₦{(points * 10).toLocaleString()} NGN</strong>
                  </span>
                </div>
                <Coins size={28} color="var(--text-secondary)" />
              </div>
            </div>

            {/* Redeem Options Form */}
            <div className="glass-card">
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>Instant Mobile Airtime Cashout</h3>
              
              {showRedeemSuccess ? (
                <div style={{ textAlign: "center", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto"
                  }}>
                    <CheckCircle size={20} color="var(--success)" />
                  </div>
                  <h4 style={{ color: "var(--primary)" }}>Top-up Request Successful!</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Airtime has been queued to your carrier for phone {airtimePhone}. Received within 5 minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRedeem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div className="form-group">
                    <label className="form-label">Telecom Carrier</label>
                    <select
                      className="select-input"
                      value={airtimeCarrier}
                      onChange={(e) => setAirtimeCarrier(e.target.value)}
                    >
                      <option value="MTN">MTN Nigeria</option>
                      <option value="Airtel">Airtel Nigeria</option>
                      <option value="Glo">Globacom (Glo)</option>
                      <option value="9mobile">9mobile</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="text-input"
                      placeholder="e.g. 08031234567"
                      value={airtimePhone}
                      onChange={(e) => setAirtimePhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Redeem Point Amount</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      {[50, 100, 200].map((amt) => (
                        <div
                          key={amt}
                          onClick={() => setRedeemAmount(amt)}
                          style={{
                            flex: 1,
                            background: redeemAmount === amt ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${redeemAmount === amt ? "var(--accent)" : "var(--border-subtle)"}`,
                            padding: "10px",
                            borderRadius: "10px",
                            textAlign: "center",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: redeemAmount === amt ? "var(--accent)" : "var(--text-primary)"
                          }}
                        >
                          {amt} Pts (₦{amt * 10})
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`btn ${points >= redeemAmount ? "btn-accent" : "btn-disabled"}`}
                    disabled={points < redeemAmount || !airtimePhone}
                    style={{ marginTop: "6px" }}
                  >
                    <Wallet size={16} /> Redeem Airtime Now
                  </button>
                </form>
              )}
            </div>

            {/* Transaction Logs */}
            <div className="glass-card">
              <h3 style={{ fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                Transaction History
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {transactions.map((tx) => (
                  <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{tx.detail}</div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.date}</span>
                    </div>
                    <span style={{
                      fontWeight: "700",
                      fontSize: "14px",
                      color: tx.points > 0 ? "var(--primary)" : "var(--danger)"
                    }}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 5: TRANSLATION BRIDGE */}
        {currentScreen === "bridge" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px" }}>Cross-Dialect Bridge</h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Linguistic translation preview model powered by collected data.
              </p>
            </div>

            <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="form-group">
                <label className="form-label">Source Dialect</label>
                <select className="select-input" value={bridgeSource} onChange={(e) => setBridgeSource(e.target.value)}>
                  {LANGUAGES_AND_DIALECTS["Igbo"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Dialect</label>
                <select className="select-input" value={bridgeTarget} onChange={(e) => setBridgeTarget(e.target.value)}>
                  {LANGUAGES_AND_DIALECTS["Igbo"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Sample Recorded Prompt</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {BRIDGE_PHRASES.map((_, i) => (
                    <div
                      key={i}
                      onClick={() => setBridgePhraseIndex(i)}
                      style={{
                        flex: 1,
                        background: bridgePhraseIndex === i ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${bridgePhraseIndex === i ? "var(--primary)" : "var(--border-subtle)"}`,
                        padding: "10px",
                        borderRadius: "10px",
                        textAlign: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: bridgePhraseIndex === i ? "var(--primary)" : "var(--text-primary)"
                      }}
                    >
                      Phrase {i + 1}
                    </div>
                  ))}
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "8px", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Concept: <strong>"{BRIDGE_PHRASES[bridgePhraseIndex].concept}"</strong>
                </div>
              </div>

              {/* Translation Display */}
              <div className="bridge-box">
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)" }}>{bridgeSource} Pronunciation</span>
                <p style={{ fontWeight: "700", color: "var(--accent)" }}>
                  "{(BRIDGE_PHRASES[bridgePhraseIndex].translations as any)[bridgeSource]?.text || BRIDGE_PHRASES[bridgePhraseIndex].standard}"
                </p>
              </div>

              <div className="bridge-arrow">
                <RotateCcw style={{ transform: "rotate(90deg)" }} size={20} />
              </div>

              <div className="bridge-box">
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "var(--text-muted)" }}>{bridgeTarget} Equivalent</span>
                <p style={{ fontWeight: "700", color: "var(--primary)" }}>
                  "{(BRIDGE_PHRASES[bridgePhraseIndex].translations as any)[bridgeTarget]?.text || BRIDGE_PHRASES[bridgePhraseIndex].standard}"
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                <Info size={14} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <h4 style={{ fontSize: "12px" }}>Dialect Bridge Insight</h4>
                  <p style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    How Lexara bridges the gap: High-fidelity parallel speech corpora collected during validation sessions allows the ML models to construct exact dialect shift dictionaries mapping localized words (e.g. *awiko* vs *kọpụ*).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 6: LEADERBOARD */}
        {currentScreen === "leaderboard" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px" }}>Dialect Leaderboards</h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                The race to preserve African languages. Which community is leading?
              </p>
            </div>

            {/* Dialects performance card */}
            <div className="glass-card">
              <h3 style={{ fontSize: "15px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <TrendingUp size={14} color="var(--text-secondary)" /> Top Contributing Dialects
              </h3>

              <div className="leaderboard-list">
                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="leaderboard-rank rank-gold">#1</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Owerri Dialect</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Igbo Language</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--primary)" }}>412.5 hrs</strong>
                </div>

                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="leaderboard-rank rank-silver">#2</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Abiriba Dialect</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Igbo Language</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--primary)" }}>201.2 hrs</strong>
                </div>

                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="leaderboard-rank rank-bronze">#3</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Nnewi Dialect</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Igbo Language</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--primary)" }}>189.8 hrs</strong>
                </div>

                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="leaderboard-rank">#4</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Ijebu Dialect</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Yoruba Language</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--primary)" }}>154.6 hrs</strong>
                </div>
              </div>
            </div>

            {/* Individual Contributors */}
            <div className="glass-card">
              <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Top Global Speakers</h3>
              <div className="leaderboard-list">
                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="peer-avatar" style={{ width: "24px", height: "24px", fontSize: "10px" }}>K</div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Kalu K.</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Abiriba dialect</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--accent)" }}>4,120 pts</strong>
                </div>

                <div className="leaderboard-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="peer-avatar" style={{ width: "24px", height: "24px", fontSize: "10px", background: "purple", color: "white" }}>A</div>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px" }}>Amina B.</div>
                      <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Katsina dialect</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: "13px", color: "var(--accent)" }}>3,890 pts</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar Navigation */}
      {isRegistered && (
        <nav className="bottom-nav">
          <button className={`nav-item ${currentScreen === "solo" ? "active" : ""}`} onClick={() => setCurrentScreen("solo")}>
            <Mic size={18} />
            <span>Solo</span>
          </button>
          <button className={`nav-item ${currentScreen === "multiplayer" ? "active" : ""}`} onClick={() => setCurrentScreen("multiplayer")}>
            <Users size={18} />
            <span>Arena</span>
          </button>
          <button className={`nav-item ${currentScreen === "bridge" ? "active" : ""}`} onClick={() => setCurrentScreen("bridge")}>
            <BookOpen size={18} />
            <span>Bridge</span>
          </button>
          <button className={`nav-item ${currentScreen === "wallet" ? "active" : ""}`} onClick={() => setCurrentScreen("wallet")}>
            <Wallet size={18} />
            <span>Wallet</span>
          </button>
          <button className={`nav-item ${currentScreen === "leaderboard" ? "active" : ""}`} onClick={() => setCurrentScreen("leaderboard")}>
            <Award size={18} />
            <span>Rank</span>
          </button>
        </nav>
      )}
    </div>
  );
}
