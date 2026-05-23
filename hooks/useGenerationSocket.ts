"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useGenerationStore } from "@/stores/useGenerationStore";

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function useGenerationSocket(assignmentId: string | null) {
  const setProgress = useGenerationStore((state) => state.setProgress);
  const setIsGenerating = useGenerationStore((state) => state.setIsGenerating);

  useEffect(() => {
    if (!assignmentId) return;

    const client = getSocket();
    setIsGenerating(true);

    const onUpdate = (payload: {
      assignmentId: string;
      status: "queued" | "processing" | "completed" | "failed";
      progress: number;
      message: string;
    }) => {
      if (payload.assignmentId !== assignmentId) return;
      setProgress({
        assignmentId: payload.assignmentId,
        status: payload.status,
        progress: payload.progress,
        message: payload.message,
      });
      if (payload.status === "completed" || payload.status === "failed") {
        setIsGenerating(false);
      }
    };

    client.emit("assignment:subscribe", assignmentId);
    client.on("generation:update", onUpdate);

    return () => {
      client.off("generation:update", onUpdate);
    };
  }, [assignmentId, setIsGenerating, setProgress]);
}

export async function pollJobStatus(assignmentId: string) {
  const response = await fetch(`/api/jobs/${assignmentId}`);
  if (!response.ok) throw new Error("Failed to fetch job status");
  return response.json();
}
