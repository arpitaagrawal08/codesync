"use client";

import dynamic from "next/dynamic";

// socket.io uses browser-only APIs — skip SSR entirely to prevent hydration errors
const SocketCollaborationProvider = dynamic(
  () =>
    import("@/components/collaboration/SocketCollaborationProvider").then(
      (m) => ({ default: m.SocketCollaborationProvider })
    ),
  { ssr: false }
);

const ChatBox = dynamic(
  () => import("@/components/collaboration/ChatBox"),
  { ssr: false }
);

export default function SocketProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketCollaborationProvider>
      {children}
      <ChatBox />
    </SocketCollaborationProvider>
  );
}
