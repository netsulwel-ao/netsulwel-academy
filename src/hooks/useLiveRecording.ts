"use client";

import { useState, useCallback, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc, updateDoc, addDoc, collection, serverTimestamp, getDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { useRecorder, formatDuration } from "./useRecorder";

export type RecordingStatus = "idle" | "recording" | "paused" | "uploading" | "ready" | "error";

interface UseLiveRecordingOptions {
  liveId: string;
  liveTitle: string;
  stream?: MediaStream | null;
  createdBy: string;
  institutionId?: string;
  courseId?: string;
  moduleIndex?: number;
  videoIndex?: number;
  onRecordingReady?: (result: RecordingResult) => void;
}

interface RecordingResult {
  url: string;
  duration: number;
  blob: Blob;
  recordingId: string;
}

export function useLiveRecording({
  liveId,
  liveTitle,
  stream,
  createdBy,
  institutionId,
  courseId,
  moduleIndex,
  videoIndex,
  onRecordingReady,
}: UseLiveRecordingOptions) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const resultRef = useRef<RecordingResult | null>(null);

  const handleRecordingStop = useCallback(async (blob: Blob, duration: number) => {
    try {
      setUploadProgress(0);

      await updateDoc(doc(db, "lives", liveId), {
        recordingStatus: "uploading",
      });

      const timestamp = Date.now();
      const filename = `${liveTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.webm`;
      const file = new File([blob], filename, { type: "video/webm" });

      // Use presigned URL upload (supports files up to 5GB on R2)
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ filename, contentType: "video/webm", folder: "videos" }),
      });

      if (!presignRes.ok) throw new Error("Falha ao obter URL de upload.");
      const { presignedUrl, publicUrl } = await presignRes.json();

      // Upload with XHR for progress tracking
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", "video/webm");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(publicUrl);
          } else {
            reject(new Error(`Upload failed: HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Erro de rede no upload."));
        xhr.send(file);
      });

      const recordingRef = await addDoc(collection(db, "recordings"), {
        liveId,
        title: liveTitle,
        url,
        duration,
        durationFormatted: formatDuration(duration),
        fileSize: blob.size,
        uploadedBy: createdBy,
        institutionId: institutionId || null,
        status: "ready",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "lives", liveId), {
        recordingUrl: url,
        recordingStatus: "ready",
      });

      // If this live is part of a course, update the lesson URL directly
      if (courseId && moduleIndex !== undefined && videoIndex !== undefined) {
        try {
          const courseRef = doc(db, "courses", courseId);
          const courseSnap = await getDoc(courseRef);
          if (courseSnap.exists()) {
            const courseData = courseSnap.data();
            const modules = [...(courseData.modules || [])];
            if (modules[moduleIndex]?.videos?.[videoIndex]) {
              modules[moduleIndex].videos[videoIndex] = {
                ...modules[moduleIndex].videos[videoIndex],
                url,
                duration: formatDuration(duration),
              };
              await updateDoc(courseRef, { modules, updatedAt: serverTimestamp() });
              toast.success("Gravação adicionada à aula do curso!");
            }
          }
        } catch (err) {
          console.error("Failed to update course lesson:", err);
        }
      }

      const result: RecordingResult = {
        url,
        duration,
        blob,
        recordingId: recordingRef.id,
      };
      resultRef.current = result;
      setRecordingResult(result);
      onRecordingReady?.(result);
    } catch (err) {
      console.error("Recording upload error:", err);
      await updateDoc(doc(db, "lives", liveId), {
        recordingStatus: "error",
      }).catch(() => {});
    }
  }, [liveId, liveTitle, createdBy, institutionId, courseId, moduleIndex, videoIndex, onRecordingReady]);

  const recorder = useRecorder({
    stream,
    onStop: handleRecordingStop,
  });

  const startRecording = useCallback(() => {
    setRecordingResult(null);
    resultRef.current = null;
    recorder.start();
  }, [recorder]);

  const stopRecording = useCallback(() => {
    recorder.stop();
  }, [recorder]);

  const status: RecordingStatus = (() => {
    if (recorder.state === "recording") return "recording";
    if (recorder.state === "paused") return "paused";
    if (uploadProgress > 0 && uploadProgress < 100) return "uploading";
    if (recordingResult) return "ready";
    if (recorder.error) return "error";
    return "idle";
  })();

  return {
    state: recorder.state,
    status,
    duration: recorder.duration,
    formattedDuration: formatDuration(recorder.duration),
    uploadProgress,
    recordingResult,
    error: recorder.error,
    startRecording,
    pauseRecording: recorder.pause,
    resumeRecording: recorder.resume,
    stopRecording,
  };
}
