"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Wifi, Copy, Check, Plus, LogIn, Link2, Shuffle } from "lucide-react";
import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LANGUAGE_CONFIG } from "@/app/(root)/_constants";

interface SocketJoinRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "create" | "join";

const SocketJoinRoomDialog = ({ isOpen, onClose }: SocketJoinRoomDialogProps) => {
  const { user } = useUser();
  const router = useRouter();
  const {
    joinRoom,
    isInRoom,
    roomId: currentRoomId,
    users,
    isJoining,
  } = useSocketCollaborationStore();

  const [activeTab, setActiveTab] = useState<Tab>("create");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [generatedRoomId, setGeneratedRoomId] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [copiedRoomId, setCopiedRoomId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const regenerateId = () => {
    setGeneratedRoomId(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const getShareLink = (roomId: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/room/${roomId}`;
    }
    return `/room/${roomId}`;
  };

  const copyRoomId = async (roomId: string, type: "id" | "link") => {
    const text = type === "id" ? roomId : getShareLink(roomId);
    await navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast.success(type === "id" ? "Room ID copied!" : "Invite link copied!");
  };

  const getUserName = () => {
    if (!user) return null;
    return user.firstName || user.emailAddresses[0]?.emailAddress || "Anonymous";
  };

  const handleCreateRoom = async () => {
    if (!user) { toast.error("Please sign in to create a room"); return; }
    const userName = getUserName()!;
    try {
      await joinRoom(generatedRoomId, userName, selectedLanguage);
      router.push(`/room/${generatedRoomId}`);
      onClose();
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) { toast.error("Please enter a room ID"); return; }
    if (!user) { toast.error("Please sign in to join a room"); return; }
    const userName = getUserName()!;
    try {
      await joinRoom(joinRoomId.trim(), userName);
      router.push(`/room/${joinRoomId.trim()}`);
      onClose();
    } catch {
      toast.error("Failed to join room");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        /* Backdrop — centres on sm+, slides up from bottom on xs */
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={[
              "bg-[#1e1e2e] border border-[#313244] shadow-2xl",
              "w-full sm:max-w-md",
              // bottom-sheet on xs, rounded modal on sm+
              "rounded-t-2xl sm:rounded-2xl",
              // scrollable on short viewports
              "max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden",
            ].join(" ")}
          >
            {/* ── Drag handle (mobile only) ── */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-700" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 sm:p-6 border-b border-[#313244] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-xl">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-semibold text-white">
                    {isInRoom ? "Room Status" : "Collaborate"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {isInRoom
                      ? `Connected · Room ${currentRoomId}`
                      : "Code together in real-time"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6 sm:py-5 space-y-4">
              {isInRoom ? (
                /* ── Connected State ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <Wifi className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Live collaboration active</span>
                  </div>

                  {/* Room ID row */}
                  <div className="bg-[#0a0a0f] rounded-xl p-3 sm:p-4 border border-[#313244] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Room ID</span>
                      <button
                        onClick={() => copyRoomId(currentRoomId!, "id")}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                      >
                        {copiedRoomId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedRoomId ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-[0.25em] sm:tracking-[0.3em]">
                      {currentRoomId}
                    </div>
                  </div>

                  {/* Invite link */}
                  <div className="bg-[#0a0a0f] rounded-xl p-3 sm:p-4 border border-[#313244] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" /> Invite Link
                      </span>
                      <button
                        onClick={() => copyRoomId(currentRoomId!, "link")}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                      >
                        {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedLink ? "Copied" : "Copy Link"}
                      </button>
                    </div>
                    <p className="text-xs text-blue-400 break-all font-mono">
                      {getShareLink(currentRoomId!)}
                    </p>
                  </div>

                  {/* Connected users */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Users online</span>
                      <span className="text-white font-medium">{users.length}</span>
                    </div>
                    {users.length > 0 && (
                      <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#313244]">
                        <div className="space-y-1.5">
                          {users.map((u) => (
                            <div key={u.id} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: u.color ?? "#3b82f6" }} />
                              <span className="text-gray-300 truncate">{u.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Join / Create State ── */
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 bg-[#0a0a0f] p-1 rounded-xl border border-[#313244]">
                    {(["create", "join"] as Tab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab
                            ? "bg-blue-500 text-white shadow-lg"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {tab === "create" ? (
                          <><Plus className="w-4 h-4" /> Create Room</>
                        ) : (
                          <><LogIn className="w-4 h-4" /> Join Room</>
                        )}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {activeTab === "create" ? (
                      /* ── Create Room Tab ── */
                      <motion.div
                        key="create"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-4"
                      >
                        {/* Room ID card */}
                        <div className="bg-[#0a0a0f] rounded-xl p-3 sm:p-4 border border-[#313244] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Your Room ID</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={regenerateId}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                                title="Generate new ID"
                              >
                                <Shuffle className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => copyRoomId(generatedRoomId, "id")}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                              >
                                {copiedRoomId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedRoomId ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <div className="font-mono text-xl sm:text-2xl font-bold text-white tracking-[0.25em] sm:tracking-[0.3em]">
                            {generatedRoomId}
                          </div>
                        </div>

                        {/* Invite link preview */}
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Link2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-blue-400 font-medium">Share this link to invite others</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400 font-mono truncate flex-1">
                              {getShareLink(generatedRoomId)}
                            </p>
                            <button
                              onClick={() => copyRoomId(generatedRoomId, "link")}
                              className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Language picker — 3 cols on xs, 5 cols on sm+ */}
                        <div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Language</span>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                            {Object.values(LANGUAGE_CONFIG).map((lang) => (
                              <button
                                key={lang.id}
                                onClick={() => setSelectedLanguage(lang.id)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                                  selectedLanguage === lang.id
                                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                    : "border-[#313244] bg-[#0a0a0f] text-gray-400 hover:border-gray-600 hover:text-gray-300"
                                }`}
                              >
                                <img src={lang.logoPath} alt={lang.label} className="w-5 h-5 object-contain" />
                                <span className="truncate w-full text-center leading-tight" style={{ fontSize: "10px" }}>
                                  {lang.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleCreateRoom}
                          disabled={isJoining || !user}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          {isJoining ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                          ) : (
                            <><Plus className="w-4 h-4" /> Create &amp; Join Room</>
                          )}
                        </button>
                      </motion.div>
                    ) : (
                      /* ── Join Room Tab ── */
                      <motion.div
                        key="join"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Room ID</label>
                          <input
                            type="text"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                            placeholder="Enter 6-character room ID"
                            className="w-full px-4 py-3 bg-[#0a0a0f] border border-[#313244] rounded-xl text-white font-mono text-base sm:text-lg tracking-widest placeholder:text-gray-600 placeholder:text-xs sm:placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                            maxLength={6}
                            autoComplete="off"
                            inputMode="text"
                          />
                        </div>

                        <div className="bg-[#0a0a0f] rounded-xl p-3 border border-[#313244]">
                          <p className="text-xs text-gray-400">
                            💡 Ask the room creator to share their Room ID or invite link.
                            You can also open an invite link directly to auto-join.
                          </p>
                        </div>

                        <button
                          onClick={handleJoinRoom}
                          disabled={isJoining || !joinRoomId.trim() || !user}
                          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                          {isJoining ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Joining...</>
                          ) : (
                            <><LogIn className="w-4 h-4" /> Join Room</>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[#313244]/50 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                {isInRoom ? "Close" : "Cancel"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SocketJoinRoomDialog;