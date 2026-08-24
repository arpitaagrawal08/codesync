"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  LogOut,
  Wifi,
  WifiOff,
  Blocks,
  Link2,
  ChevronLeft,
  Play,
  Loader2,
  Terminal,
  X,
  ChevronDown,
  ClipboardCopy,
} from "lucide-react";
import UserPresenceBar from "@/components/collaboration/UserPresenceBar";
import ChatBox from "@/components/collaboration/ChatBox";
import toast from "react-hot-toast";
import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";

// Dynamically import Monaco to avoid SSR issues
const CollaborationEditorPanel = dynamic(
  () => import("@/components/collaboration/EditorPanel"),
  { ssr: false, loading: () => <div className="flex-1 bg-[#0d0d14] animate-pulse" /> }
);

// ─── Inner room content ───────────────────────────────────────────────────────
function RoomContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { joinRoom, leaveRoom, isConnected, isInRoom, isJoining } =
    useSocketCollaborationStore();

  const { runCode, isRunning, output, error, language, setLanguage, getCode } =
    useCodeEditorStore();
  const { sendLanguageChange } = useSocketCollaborationStore();

  const [copiedId, setCopiedId]       = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const [copiedCode, setCopiedCode]   = useState(false);
  const [hasAutoJoined, setHasAutoJoined] = useState(false);
  const [showOutput, setShowOutput]   = useState(false);
  const [langOpen, setLangOpen]       = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-join when socket is connected and user is loaded
  useEffect(() => {
    if (!isLoaded || !user || !isConnected || hasAutoJoined || isInRoom) return;
    const userName =
      user.firstName || user.fullName ||
      user.emailAddresses[0]?.emailAddress || "Anonymous";
    setHasAutoJoined(true);
    joinRoom(roomId, userName);
  }, [isLoaded, user, isConnected, hasAutoJoined, isInRoom, roomId, joinRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    toast("Left the room", { icon: "👋" });
    router.push("/");
  }, [leaveRoom, router]);

  const handleRun = useCallback(async () => {
    await runCode();
    setShowOutput(true);
  }, [runCode]);

  const handleLanguageChange = useCallback((langId: string) => {
    setLanguage(langId);
    sendLanguageChange(langId);
    setLangOpen(false);
  }, [setLanguage, sendLanguageChange]);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    toast.success("Room ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopiedLink(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = async () => {
    const code = getCode();
    if (!code) { toast.error("Editor is empty"); return; }
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Code copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Loading / connecting screen ───────────────────────────────────────────
  if (!isInRoom) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-5 px-4">
        <div className="p-4 bg-blue-500/10 rounded-2xl">
          <Blocks className="w-10 h-10 text-blue-400 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-white">
            {isJoining ? "Joining room…" : "Connecting to server…"}
          </h2>
          <p className="text-sm text-gray-500">
            Room <span className="font-mono text-blue-400">{roomId}</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
        {isLoaded && !user && (
          <p className="text-sm text-red-400">Please sign in to join a room.</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">

      {/* ══════════════════════════════════════════════════════════
          HEADER — single row on md+, two compact rows on mobile
      ══════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl z-10">

        {/* ── Row 1: identity + room info + presence ── */}
        <div className="flex items-center gap-2 px-3 py-2 md:hidden">
          {/* Back */}
          <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-800" />

          {/* Logo icon only */}
          <div className="p-1 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] rounded-md ring-1 ring-white/10">
            <Blocks className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="w-px h-4 bg-gray-800" />

          {/* Connection + Room ID */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isConnected
              ? <Wifi className="w-3 h-3 text-green-400 flex-shrink-0" />
              : <WifiOff className="w-3 h-3 text-red-400 animate-pulse flex-shrink-0" />}
            <span className="text-xs text-gray-500 flex-shrink-0">Room</span>
            <span className="font-mono text-xs font-bold text-white tracking-widest truncate">{roomId}</span>
            <button onClick={copyRoomId} className="p-0.5 text-gray-500 hover:text-gray-300 flex-shrink-0">
              {copiedId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={copyLink} className="p-0.5 text-gray-500 hover:text-gray-300 flex-shrink-0">
              {copiedLink ? <Check className="w-3 h-3 text-green-400" /> : <Link2 className="w-3 h-3" />}
            </button>
          </div>

          {/* User presence */}
          <UserPresenceBar />
        </div>

        {/* ── Row 2 (mobile): action buttons ── */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-white/[0.04] md:hidden">
          {/* Language selector */}
          <div className="relative flex-1" ref={langDropdownRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-[#1e1e2e]/80 rounded-lg border border-gray-800/50 hover:border-gray-700 transition-all text-xs text-gray-300"
            >
              <img src={LANGUAGE_CONFIG[language]?.logoPath} alt={language} className="w-3.5 h-3.5 object-contain flex-shrink-0" />
              <span className="truncate flex-1 text-left">{LANGUAGE_CONFIG[language]?.label}</span>
              <ChevronDown className={`w-3 h-3 text-gray-500 flex-shrink-0 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 top-full mt-1 w-44 bg-[#1e1e2e]/95 backdrop-blur-xl rounded-xl border border-[#313244] shadow-2xl py-1.5 z-50"
                >
                  <p className="text-[10px] text-gray-500 px-3 pb-1.5 mb-1 border-b border-gray-800/50">Language (all members)</p>
                  <div className="max-h-52 overflow-y-auto">
                    {Object.values(LANGUAGE_CONFIG).map((lang) => (
                      <button key={lang.id} onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${language === lang.id ? "text-blue-400 bg-blue-500/10" : "text-gray-300 hover:bg-[#262637]"}`}>
                        <img src={lang.logoPath} alt={lang.label} className="w-4 h-4 object-contain flex-shrink-0" />
                        <span>{lang.label}</span>
                        {language === lang.id && <span className="ml-auto text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Copy Code */}
          <button onClick={copyCode} title="Copy code"
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
            {copiedCode ? <Check className="w-3.5 h-3.5 text-green-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
          </button>

          {/* Run */}
          <button onClick={handleRun} disabled={isRunning}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 disabled:opacity-50 rounded-lg transition-all flex-shrink-0">
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? "Running…" : `Run`}</span>
          </button>

          {/* Leave */}
          <button onClick={handleLeave}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Single row (md+) ── */}
        <div className="hidden md:flex items-center gap-3 px-4 py-3">
          {/* Back */}
          <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-sm flex-shrink-0">
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="w-px h-6 bg-gray-800" />

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="p-1.5 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] rounded-lg ring-1 ring-white/10">
              <Blocks className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-white">CodeSync</span>
          </div>
          <div className="w-px h-6 bg-gray-800" />

          {/* Room ID */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-green-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />}
            <span className="text-xs text-gray-500">Room</span>
            <span className="font-mono text-sm font-bold text-white tracking-widest">{roomId}</span>
            <button onClick={copyRoomId} className="p-1 text-gray-500 hover:text-gray-300 transition-colors rounded" title="Copy room ID">
              {copiedId ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={copyLink} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors" title="Copy invite link">
              {copiedLink ? <><Check className="w-3 h-3 text-green-400" /><span>Copied</span></> : <><Link2 className="w-3 h-3" /><span>Share</span></>}
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Language selector */}
          <div className="relative flex-shrink-0" ref={langDropdownRef}>
            <button onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e2e]/80 rounded-lg border border-gray-800/50 hover:border-gray-700 transition-all text-sm text-gray-300 hover:text-white">
              <img src={LANGUAGE_CONFIG[language]?.logoPath} alt={language} className="w-4 h-4 object-contain" />
              <span>{LANGUAGE_CONFIG[language]?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-[#1e1e2e]/95 backdrop-blur-xl rounded-xl border border-[#313244] shadow-2xl py-2 z-50">
                  <p className="text-xs text-gray-500 px-3 pb-2 mb-1 border-b border-gray-800/50">Language (all members)</p>
                  <div className="max-h-64 overflow-y-auto">
                    {Object.values(LANGUAGE_CONFIG).map((lang) => (
                      <button key={lang.id} onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${language === lang.id ? "text-blue-400 bg-blue-500/10" : "text-gray-300 hover:bg-[#262637] hover:text-white"}`}>
                        <img src={lang.logoPath} alt={lang.label} className="w-5 h-5 object-contain flex-shrink-0" />
                        <span>{lang.label}</span>
                        {language === lang.id && <span className="ml-auto text-[10px] text-blue-400">✓</span>}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-gray-800" />

          {/* User Presence */}
          <UserPresenceBar />

          <div className="w-px h-6 bg-gray-800" />

          {/* Copy Code */}
          <button onClick={copyCode} title="Copy code"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/40 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0">
            {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <ClipboardCopy className="w-4 h-4" />}
            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
          </button>

          {/* Leave */}
          <button onClick={handleLeave}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0">
            <LogOut className="w-4 h-4" />
            <span>Leave</span>
          </button>

          {/* Run */}
          <button onClick={handleRun} disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-blue-500/20 flex-shrink-0">
            {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Running…</span></> : <><Play className="w-4 h-4" /><span>Run ({language})</span></>}
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Editor */}
        <div className="flex-1 overflow-hidden flex">
          <CollaborationEditorPanel />
        </div>

        {/* Output panel */}
        <AnimatePresence>
          {showOutput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 200, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex-shrink-0 border-t border-white/[0.06] bg-[#0d0d14] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Output</span>
                  {error && <span className="text-xs text-red-400 font-medium">· Error</span>}
                </div>
                <button onClick={() => setShowOutput(false)} className="p-1 text-gray-600 hover:text-gray-400 transition-colors rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-4 h-[calc(100%-36px)] overflow-y-auto">
                {error
                  ? <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap">{error}</pre>
                  : <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{output || "(no output)"}</pre>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ChatBox FAB */}
        <ChatBox />
      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────
// NOTE: SocketCollaborationProvider is already mounted in root layout.tsx.
export default function RoomPage() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId as string;
  return <RoomContent roomId={roomId} />;
}
