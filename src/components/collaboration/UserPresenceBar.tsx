"use client";

import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import { motion, AnimatePresence } from "framer-motion";

const UserPresenceBar = () => {
  const { users, roomId } = useSocketCollaborationStore();

  if (!roomId || users.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500 mr-1">In room:</span>
      <AnimatePresence mode="popLayout">
        {users.map((user, i) => {
          const initials = user.name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.5, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: i * 0.05 }}
              title={user.name}
              className="relative group"
            >
              {/* Avatar circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-[#0a0a0f] cursor-default select-none transition-transform group-hover:scale-110"
                style={{ backgroundColor: user.color ?? "#3b82f6" }}
              >
                {initials}
              </div>

              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                {user.name}
              </div>

              {/* Online indicator */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 ring-1 ring-[#0a0a0f]"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default UserPresenceBar;
