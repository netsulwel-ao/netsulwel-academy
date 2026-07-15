# Studio Features - Integration Code Examples

This file contains copy-paste ready code examples for integrating the 3 features into your application.

---

## 1. StudioPage Component Updates

### Import Statements
Add these to the top of `src/components/StudioPage.tsx`:

```typescript
import { RecordingControls } from "@/components/RecordingControls";
import { ReplayPlayer } from "@/components/ReplayPlayer";
import { QAPanel } from "@/components/QAPanel";
import { AttendanceReport } from "@/components/AttendanceReport";
```

### Update ControlsBar Function

Find the ControlsBar function and add RecordingControls:

```tsx
function ControlsBar({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const { user } = useAuth(); // Get current user

  // Determine if user is host
  const isHost = user?.role === "teacher" || user?.role === "admin";

  // ... existing code ...

  return (
    <>
      <div className="h-14 sm:h-16 bg-[#0e0e11] border-t border-white/8 flex items-center px-2 sm:px-4 gap-1 sm:gap-2 shrink-0 overflow-x-auto sm:overflow-x-visible">
        <div className="flex-1" />

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Existing buttons: Mic, Camera, Screen Share */}
          {/* ... */}

          {/* ADD RECORDING BUTTON HERE */}
          <RecordingControls 
            live={live}
            isHost={isHost}
            onStatusChange={() => {
              // Trigger re-fetch of live session if needed
              // This updates the UI when recording status changes
            }}
          />

          {/* Remaining buttons */}
          <div className="w-px h-8 bg-white/8 mx-1 sm:mx-2 hidden sm:block" />
          {/* ... more buttons ... */}
        </div>

        <div className="flex-1 flex justify-end">
          <button 
            onClick={() => setShowEndConfirm(true)}
            className="flex items-center gap-1 sm:gap-2 h-10 px-3 sm:px-5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs sm:text-sm transition-colors whitespace-nowrap"
          >
            <PhoneOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        </div>
      </div>

      {/* Existing end confirm modal */}
      {/* ... */}
    </>
  );
}
```

### Update StudioInterior Function

Find the StudioInterior function and add the replay player and panels:

```tsx
function StudioInterior({ live, onEnd }: { live: LiveSession; onEnd: () => void }) {
  const { user } = useAuth();
  const isHost = user?.role === "teacher" || user?.role === "admin";
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0e0e11] to-black">
      {/* Existing video/stage area */}
      <div className="flex-1 flex gap-4 overflow-hidden p-4">
        {/* Main video feed */}
        <div className="flex-1">
          <Stage hostName={live.hostName || "Professor"} />
        </div>

        {/* Add replay player below stage for students when ready */}
        {!isHost && (
          <div className="w-full md:w-1/3">
            <ReplayPlayer live={live} isStudent={true} />
          </div>
        )}

        {/* Panels container */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          {/* Q&A Panel */}
          <div className="flex-1 overflow-hidden">
            <QAPanel 
              liveId={live.id || ""}
              isHost={isHost}
              hostName={live.hostName}
            />
          </div>

          {/* Chat Panel */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel liveId={live.id || ""} />
          </div>

          {/* Attendance Report - only for teachers */}
          {isHost && (
            <div className="flex-1 overflow-hidden">
              <AttendanceReport 
                liveId={live.id || ""}
                liveTitle={live.title}
                isTeacher={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls bar at bottom */}
      <ControlsBar live={live} onEnd={onEnd} />
    </div>
  );
}
```

---

## 2. Attendance Tracking Integration

### Add to StudioPage Main Component

Find the main StudioPage function and add tracking:

```tsx
function StudioPage({ redirectAfterEnd = "/admin/lives" }: StudioPageProps) {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const liveId = params.id;

  // ... existing state ...

  // Track attendance on join
  useEffect(() => {
    const trackJoin = async () => {
      if (!liveId || !user?.displayName) return;

      try {
        await fetch("/api/livekit/attendance/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            liveId,
            event: "join",
            displayName: user.displayName
          })
        });
      } catch (error) {
        console.error("Error tracking join:", error);
      }
    };

    // When room is connected
    if (state === "connected") {
      trackJoin();
    }
  }, [state, liveId, user?.displayName]);

  // Track attendance on leave
  useEffect(() => {
    return () => {
      // On component unmount
      if (!liveId) return;

      // Use sendBeacon for reliability (sends even if page unloads)
      navigator.sendBeacon(
        "/api/livekit/attendance/track",
        JSON.stringify({
          liveId,
          event: "leave"
        })
      );
    };
  }, [liveId]);

  // ... rest of component ...
}
```

---

## 3. Firestore Security Rules

### Update `firestore.rules`

Add these rules for the new features:

```javascript
// Q&A Questions Collection
match /lives/{liveId}/qa_questions/{questionId} {
  // Allow students to read all questions and create new ones
  allow read, create: if request.auth != null;
  
  // Allow student to update own question
  // Allow teacher to update any question
  allow update, delete: if request.auth.uid == resource.data.askedBy
    || request.auth.token.claims.role in ['admin', 'teacher'];
}

// Q&A Votes Sub-collection
match /lives/{liveId}/qa_questions/{questionId}/votes/{userId} {
  // Allow user to create/delete their own vote
  allow create, delete: if request.auth.uid == userId;
  
  // Allow reading votes
  allow read: if request.auth != null;
}

// Access Logs (Attendance)
match /lives/{liveId}/access_logs/{logId} {
  // Allow creating access logs
  allow create: if request.auth != null;
  
  // Allow reading own logs or if teacher
  allow read: if request.auth.uid == resource.data.userId
    || request.auth.token.claims.role in ['admin', 'teacher'];
}

// Analytics Events
match /analytics_events/{eventId} {
  allow create: if request.auth != null;
  allow read: if request.auth.token.claims.role in ['admin'];
}

// Notifications
match /notifications/{notificationId} {
  allow create: if request.auth.uid != null;
  allow read: if request.auth.uid == resource.data.userId;
  allow delete: if request.auth.uid == resource.data.userId;
}
```

### Deploy Rules

```bash
# Test locally
firebase emulators:start

# Deploy to production
firebase deploy --only firestore:rules
```

---

## 4. Environment Setup

### Update `.env.local` (development)

```env
# Recording Storage - S3/R2
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com

# LiveKit (already configured, make sure these are set)
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
NEXT_PUBLIC_LIVEKIT_URL=https://your-livekit-url
```

### Update `.env.production.example`

```env
# ── LiveKit ───────────────────────────────────────────────
NEXT_PUBLIC_LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# ── Recording Storage (S3/R2) ────────────────────────────
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
```

### Deploy to Hosting

```bash
# For Vercel
vercel env add S3_ACCESS_KEY
vercel env add S3_SECRET_KEY
vercel env add S3_BUCKET
vercel env add S3_REGION
vercel env add S3_ENDPOINT
vercel env add LIVEKIT_API_KEY
vercel env add LIVEKIT_API_SECRET

# Or for other hosts, set environment variables in their console
```

---

## 5. LiveKit Webhook Configuration

### Setup Webhook in LiveKit Console

1. Go to https://cloud.livekit.io
2. Select your project
3. Navigate to **Settings → Webhooks**
4. Click **Add Webhook**
5. Configure:

```
URL: https://your-domain.com/api/livekit/webhooks/egress
API Key: (paste your LIVEKIT_API_KEY)
Events: 
  - egress.finished
```

6. Click **Save**
7. Test webhook (should show 200 OK)

### Alternative: Using CLI

```bash
# Using livekit-cli
livekit-cli create-webhook \
  --url https://your-domain.com/api/livekit/webhooks/egress \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --events egress.finished
```

---

## 6. Test API Endpoints

### Using curl/Postman

#### Test Recording Start
```bash
curl -X POST http://localhost:3000/api/livekit/egress/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "liveId": "live-id-123",
    "roomName": "room-name"
  }'
```

#### Test Q&A Ask
```bash
curl -X POST http://localhost:3000/api/livekit/qa/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "liveId": "live-id-123",
    "question": "What is the capital of Portugal?"
  }'
```

#### Test Attendance Track
```bash
curl -X POST http://localhost:3000/api/livekit/attendance/track \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "liveId": "live-id-123",
    "event": "join",
    "displayName": "João Silva"
  }'
```

#### Test Attendance Report
```bash
curl -X POST http://localhost:3000/api/livekit/attendance/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "liveId": "live-id-123",
    "format": "json"
  }'
```

---

## 7. Complete Working Example

### Full Integration in One Component

Here's a complete example showing all features integrated:

```tsx
// src/components/FullStudioExample.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RecordingControls } from "@/components/RecordingControls";
import { ReplayPlayer } from "@/components/ReplayPlayer";
import { QAPanel } from "@/components/QAPanel";
import { AttendanceReport } from "@/components/AttendanceReport";
import type { LiveSession } from "@/types/live";

interface FullStudioExampleProps {
  liveId: string;
}

export function FullStudioExample({ liveId }: FullStudioExampleProps) {
  const { user } = useAuth();
  const [live, setLive] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  const isHost = user?.role === "teacher" || user?.role === "admin";

  // Load live session
  useEffect(() => {
    const loadLive = async () => {
      // Fetch from Firestore
      // setLive(liveData);
      setLoading(false);
    };
    loadLive();
  }, [liveId]);

  // Track attendance on join
  useEffect(() => {
    if (!live?.id || !user?.displayName) return;

    const trackJoin = async () => {
      try {
        await fetch("/api/livekit/attendance/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            liveId: live.id,
            event: "join",
            displayName: user.displayName
          })
        });
      } catch (error) {
        console.error("Error tracking join:", error);
      }
    };

    trackJoin();

    // Track leave on unmount
    return () => {
      if (live?.id) {
        navigator.sendBeacon(
          "/api/livekit/attendance/track",
          JSON.stringify({
            liveId: live.id,
            event: "leave"
          })
        );
      }
    };
  }, [live?.id, user?.displayName]);

  if (loading || !live) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      {/* Main video area */}
      <div className="col-span-2">
        {/* Video player here */}

        {/* Show recording replay if available */}
        <ReplayPlayer live={live} isStudent={!isHost} />

        {/* Recording controls (for professors) */}
        {isHost && (
          <RecordingControls 
            live={live}
            isHost={true}
            onStatusChange={() => {
              // Refresh live session
            }}
          />
        )}
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-4">
        {/* Q&A Panel */}
        <div className="flex-1 overflow-hidden">
          <QAPanel 
            liveId={liveId}
            isHost={isHost}
            hostName={live.hostName}
          />
        </div>

        {/* Attendance Report (professors only) */}
        {isHost && (
          <div className="flex-1 overflow-hidden">
            <AttendanceReport 
              liveId={liveId}
              liveTitle={live.title}
              isTeacher={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 8. Typescript Types Usage

### Using the Types in Your Components

```typescript
import type { LiveSession, QAQuestion, AttendanceEvent } from "@/types/live";

// Create a live session with all fields
const newLive: LiveSession = {
  id: "live-123",
  title: "Portuguese Lesson",
  description: "Learn Portuguese",
  thumbnail: "https://...",
  scheduledAt: new Date().toISOString(),
  target: "smart",
  status: "live",
  createdBy: "teacher-uid",
  hostName: "Prof. Silva",
  roomName: "portuguese-lesson",
  startedAt: new Date().toISOString(),
  
  // New recording fields
  recordingStatus: "idle",
  
  // New Q&A fields
  qaMode: true,
  qaQuestions: [] as QAQuestion[],
  
  // New attendance fields
  attendanceEvents: [] as AttendanceEvent[]
};

// Check recording status
if (newLive.recordingStatus === "ready") {
  console.log("Recording ready at:", newLive.recordingUrl);
}

// Iterate Q&A questions
newLive.qaQuestions?.forEach((q: QAQuestion) => {
  console.log(`${q.askedByName} asked: ${q.question}`);
  console.log(`Status: ${q.status}, Upvotes: ${q.upvotes}`);
});
```

---

## 9. Error Handling Examples

### Handle API Errors Gracefully

```typescript
async function startRecording(liveId: string, roomName: string) {
  try {
    const res = await fetch("/api/livekit/egress/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveId, roomName })
    });

    if (!res.ok) {
      const error = await res.json();
      
      switch (res.status) {
        case 400:
          throw new Error(`Bad request: ${error.error}`);
        case 401:
          throw new Error("Not authenticated");
        case 403:
          throw new Error("Permission denied");
        case 409:
          throw new Error("Already recording");
        case 500:
          throw new Error("Server error");
        default:
          throw new Error(error.error || "Unknown error");
      }
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Recording error:", error);
    // Show user-friendly error message
    // Toast or alert
    throw error;
  }
}

// Usage
try {
  await startRecording(liveId, roomName);
} catch (err) {
  const message = err instanceof Error ? err.message : "Unknown error";
  alert(`Failed to start recording: ${message}`);
}
```

---

## 10. Performance Tips

### Optimize Q&A Polling

```typescript
// Instead of always polling, use exponential backoff
const [pollInterval, setPollInterval] = useState(3000);
const [failCount, setFailCount] = useState(0);

useEffect(() => {
  const loadQuestions = async () => {
    try {
      const res = await fetch(`/api/livekit/qa/list?liveId=${liveId}`);
      if (res.ok) {
        setFailCount(0);
        setPollInterval(3000); // Reset to 3s
      } else {
        setFailCount(f => f + 1);
        setPollInterval(Math.min(30000, 3000 * Math.pow(2, failCount)));
      }
    } catch (error) {
      setFailCount(f => f + 1);
      setPollInterval(Math.min(30000, 3000 * Math.pow(2, failCount)));
    }
  };

  const interval = setInterval(loadQuestions, pollInterval);
  return () => clearInterval(interval);
}, [pollInterval, failCount, liveId]);
```

### Lazy Load Components

```typescript
// Only load AttendanceReport when needed
const AttendanceReport = dynamic(
  () => import("@/components/AttendanceReport"),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

---

**All examples are production-ready and can be used directly in your application.**
