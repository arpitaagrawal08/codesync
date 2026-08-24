"use client";

import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


const SocketLeaveRoomButton = () => {
  const { isInRoom, leaveRoom, roomId } = useSocketCollaborationStore();
  const router = useRouter();

  const handleLeaveRoom = () => {
    const leftRoom = roomId;
    leaveRoom();
    toast.success(`Left room: ${leftRoom}`);
    router.push('/');
  };

  if (!isInRoom) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={handleLeaveRoom}
      className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Leave Room</span>
    </motion.button>
  );
};

export default SocketLeaveRoomButton;