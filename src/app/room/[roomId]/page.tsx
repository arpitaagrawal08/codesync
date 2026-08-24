"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SocketCollaborationProvider } from "@/components/collaboration/SocketCollaborationProvider";
import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  LogOut,
  Wifi,
  WifiOff,
  Blocks,
  Link2,
  ChevronLeft,
} from "lucide-react";
import UserPresenceBar from "@/components/collaboration/UserPresenceBar";
import ChatBox from "@/components/collaboration/ChatBox";
import toast from "react-hot-toast";

// Dynamically import Monaco to avoid SSR issues
const CollaborationEditorPanel = dynamic(
  () => import("@/components/collaboration/EditorPanel"),
  { ssr: false, loading: () => <div className="flex-1 bg-[#0d0d14] animate-pulse" /> }
);

// ─── Inner room content — has access to store ─────────────────────────────────
function RoomContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const {
    joinRoom,
    leaveRoom,
    isConnected,
    isInRoom,
    isJoining,
  } = useSocketCollaborationStore();


  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [hasAutoJoined, setHasAutoJoined] = useState(false);

  // Auto-join when socket is connected and user is loaded
  useEffect(() => {
    if (!isLoaded || !user || !isConnected || hasAutoJoined || isInRoom) return;

    const userName =
      user.firstName ||
      user.fullName ||
      user.emailAddresses[0]?.emailAddress ||
      "Anonymous";

    console.log("Auto-joining room:", roomId, "as", userName);
    setHasAutoJoined(true);
    joinRoom(roomId, userName);
  }, [isLoaded, user, isConnected, hasAutoJoined, isInRoom, roomId, joinRoom]);

  const handleLeave = useCallback(() => {
    leaveRoom();
    toast("Left the room", { icon: "👋" });
    router.push("/");
  }, [leaveRoom, router]);

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    toast.success("Room ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Loading state while waiting to auto-join
  if (!isInRoom) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-5">
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
          <p className="text-sm text-red-400">
            Please sign in to join a room.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* ── Room Header ──────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl z-10">
        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-800" />

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] rounded-lg ring-1 ring-white/10">
            <Blocks className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-white hidden sm:inline">CodeSync</span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-800" />

        {/* Room ID */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          )}
          <span className="text-xs text-gray-500">Room</span>
          <span className="font-mono text-sm font-bold text-white tracking-widest">
            {roomId}
          </span>
          <button
            onClick={copyRoomId}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors rounded"
            title="Copy room ID"
          >
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy invite link"
          >
            {copiedLink ? (
              <><Check className="w-3 h-3 text-green-400" /> <span>Copied</span></>
            ) : (
              <><Link2 className="w-3 h-3" /> <span className="hidden sm:inline">Share</span></>
            )}
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Presence */}
        <UserPresenceBar />

        {/* Divider */}
        <div className="w-px h-6 bg-gray-800" />

        {/* Leave Room */}
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Editor takes full space */}
        <CollaborationEditorPanel />

        {/* ChatBox floats as a FAB + slide-in panel (from ChatBox component) */}
        <ChatBox />
      </main>
    </div>
  );
}

// ─── Page wrapper — provides the socket + store context ──────────────────────
export default function RoomPage() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId as string;

  return (
    <SocketCollaborationProvider>
      <RoomContent roomId={roomId} />
    </SocketCollaborationProvider>
  );
}
