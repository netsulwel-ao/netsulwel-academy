# Live Studio System - 3 Major Features Implementation Guide

## Overview
This document describes the implementation of 3 major features for the live studio system:
1. **Recording System** (LiveKit Egress API)
2. **Q&A Mode** (Better than hand-raise)
3. **Attendance Report** (Tracking & Export)

---

## FEATURE 1: RECORDING SYSTEM

### Architecture
- Uses LiveKit Egress API to record room sessions
- Recordings stored in S3/R2 bucket
- Webhook handler processes finished recordings
- Generates signed URLs for playback

### Database Schema Updates

**LiveSession Type Updates:**
```typescript
recordingStatus?: "idle" | "recording" | "processing" | "ready" | "failed";
egressId?: string;          // LiveKit egress ID
recordingStartedAt?: string;
recordingStoppedAt?: string;
```

**Firestore Collections:**
- `lives/{liveId}` - Updated with recording fields
- `lives/{liveId}/access_logs` - Existing, used for attendance

### API Routes

#### 1. POST `/api/livekit/egress/start`
**Start recording a LiveKit room**

Request Body:
```json
{
  "roomName": "string",
  "liveId": "string"
}
```

Response:
```json
{
  "success": true,
  "recordingStatus": "recording",
  "egressId": "string",
  "message": "Gravação iniciada com sucesso."
}
```

Features:
- Verifies user is teacher/admin
- Checks if already recording
- Stores egress_id in Firestore
- Returns recording status

#### 2. POST `/api/livekit/egress/stop`
**Stop recording a LiveKit room**

Request Body:
```json
{
  "liveId": "string"
}
```

Response:
```json
{
  "success": true,
  "recordingStatus": "processing",
  "message": "Gravação parada. Processando ficheiro..."
}
```

Features:
- Verifies teacher/admin permissions
- Stops egress via LiveKit API
- Updates status to "processing"

#### 3. POST `/api/livekit/webhooks/egress`
**LiveKit Webhook Handler for egress.finished events**

Receives:
```json
{
  "event": "egress.finished",
  "egress": {
    "egressId": "string",
    "result": {
      "file": {
        "filepath": "recordings/{liveId}/{timestamp}.mp4"
      }
    }
  }
}
```

Processing:
1. Verifies webhook signature
2. Extracts liveId from filepath
3. Generates signed URL via AWS SDK
4. Updates LiveSession.recordingUrl
5. Sets recordingStatus to "ready"
6. Notifies students (creates notifications)

### UI Components

#### RecordingControls Component
```tsx
<RecordingControls 
  live={liveSession}
  isHost={true}
  onStatusChange={handleStatusChange}
/>
```

Features:
- Red pulsing button when recording
- Shows live recording duration timer (00:15:32)
- Only visible to professors
- Disabled during processing
- Shows status toasts

#### ReplayPlayer Component
```tsx
<ReplayPlayer 
  live={liveSession}
  isStudent={true}
/>
```

Features:
- Play/Pause controls
- Timeline scrubbing
- Download button
- Collapsible UI
- Shows formatted duration (HH:MM:SS)

### Environment Variables Required
```env
# Recording Storage
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
S3_REGION=
S3_ENDPOINT=  # For R2: your-account.r2.cloudflarestorage.com

# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=
```

### Integration Steps

1. **Add RecordingControls to ControlsBar:**
```tsx
<RecordingControls 
  live={live} 
  isHost={isHost}
  onStatusChange={(status) => {
    // Update live session state
  }}
/>
```

2. **Add ReplayPlayer to student view:**
```tsx
<ReplayPlayer live={live} isStudent={true} />
```

3. **Configure LiveKit Webhook:**
- In LiveKit console, set webhook URL to: `https://your-domain/api/livekit/webhooks/egress`
- Subscribe to: `egress.finished` events
- Set API key as authorization

4. **Test Recording Flow:**
```bash
# 1. Start live session
# 2. Start recording
# 3. Wait 30 seconds
# 4. Stop recording
# 5. Wait for webhook (check logs)
# 6. Verify recording appears in ReplayPlayer
```

### Troubleshooting

**Recording fails to start:**
- Check LIVEKIT_API_KEY, LIVEKIT_API_SECRET are set
- Verify S3/R2 credentials
- Check LiveKit room exists

**Webhook not received:**
- Verify webhook URL is publicly accessible
- Check signature verification not blocking
- Enable webhook in LiveKit console

**Signed URL not working:**
- Verify S3/R2 credentials
- Check bucket permissions
- Ensure R2_ENDPOINT is correct

---

## FEATURE 2: Q&A MODE

### Architecture
- Students ask questions, professors answer
- Real-time polling for new questions
- Upvote/downvote system for popular questions
- Moderation (dismiss, answer)

### Database Schema Updates

**LiveSession Type Updates:**
```typescript
qaMode?: boolean;
qaQuestions?: QAQuestion[];
```

**New Interfaces:**
```typescript
interface QAQuestion {
  id: string;
  question: string;
  askedBy: string;           // uid
  askedByName: string;
  askedAt: string;           // ISO datetime
  answers: QAAnswer[];
  status: "pending" | "answered" | "dismissed";
  upvotes: number;
}

interface QAAnswer {
  id: string;
  answer: string;
  answeredBy: string;        // uid (professor)
  answeredByName: string;
  answeredAt: string;        // ISO datetime
}
```

**Firestore Structure:**
```
lives/{liveId}/qa_questions/{questionId}
  - question: string
  - askedBy: uid
  - askedByName: string
  - askedAt: timestamp
  - answers: array
  - status: string
  - upvotes: number

lives/{liveId}/qa_questions/{questionId}/votes/{userId}
  - vote: "upvote" | "downvote"
  - votedAt: timestamp
```

### API Routes

#### 1. POST `/api/livekit/qa/ask`
**Student submits a question**

Request Body:
```json
{
  "liveId": "string",
  "question": "string"  // max 1000 chars
}
```

Response:
```json
{
  "success": true,
  "questionId": "string",
  "message": "Pergunta enviada com sucesso."
}
```

Features:
- Validates question length
- Verifies live session is active
- Stores in Firestore subcollection
- Notifies teacher of new question
- Returns question ID

#### 2. POST `/api/livekit/qa/answer`
**Professor answers a question or dismisses it**

Request Body:
```json
{
  "liveId": "string",
  "questionId": "string",
  "answer": "string",  // required if action="answer"
  "action": "answer" | "dismiss"
}
```

Response:
```json
{
  "success": true,
  "message": "Pergunta respondida com sucesso."
}
```

Features:
- Verifies professor permissions
- Adds answer to answers array
- Updates question status
- Notifies student of answer
- Supports dismissing unanswered questions

#### 3. GET `/api/livekit/qa/list`
**Get list of questions with pagination**

Query Params:
- `liveId` (required)
- `status` (pending|answered|dismissed|all, default: all)
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `sortBy` (newest|popular, default: newest)

Response:
```json
{
  "questions": [
    {
      "id": "string",
      "question": "string",
      "askedBy": "uid",
      "askedByName": "string",
      "askedAt": "ISO",
      "answers": [],
      "status": "pending",
      "upvotes": 5
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

Features:
- Paginates results
- Filters by status
- Sorts by newest or popularity
- Returns total count

#### 4. POST `/api/livekit/qa/upvote`
**Vote on a question**

Request Body:
```json
{
  "liveId": "string",
  "questionId": "string",
  "action": "upvote" | "downvote" | "remove"
}
```

Response:
```json
{
  "success": true,
  "upvotes": 6,
  "message": "Voto atualizado com sucesso."
}
```

Features:
- Tracks votes per user
- Prevents multiple votes
- Increments/decrements upvote count
- Allows vote removal

### UI Component

#### QAPanel Component
```tsx
<QAPanel 
  liveId={liveId}
  isHost={isHost}
  hostName={hostName}
/>
```

**Professor View:**
- List of pending questions
- Answer input field
- Dismiss button
- Shows upvote count

**Student View:**
- Ask question input
- List of questions (sorted by popularity)
- Upvote button
- Real-time updates via polling (3s intervals)

Features:
- Auto-scrolls to latest questions
- Shows question metadata (asker name, time)
- Displays answers with professor name
- Error handling with toast messages
- Loading states

### Integration Steps

1. **Add QAPanel to StudioPage:**
```tsx
<QAPanel 
  liveId={live.id}
  isHost={isHost}
  hostName={live.hostName}
/>
```

2. **Enable Q&A mode in live session:**
```typescript
// When creating/updating live session
await updateDoc(liveRef, {
  qaMode: true
});
```

3. **Firestore Rules Update:**
```
Allow read/write to qa_questions subcollection if:
- User is participant of the live session
- Writing own question (for students)
- Writing answers (for professor only)
```

4. **Test Q&A Flow:**
```
1. Student logs in, joins live
2. Student asks question
3. See "New Question" notification on professor
4. Professor answers question
5. Student receives notification
6. Question appears answered in student list
```

### Features

- **Real-time Updates**: Polls every 3 seconds
- **Moderation**: Dismiss inappropriate questions
- **Voting**: Track popular questions
- **Notifications**: Alert professor of new questions
- **Sorting**: Newest or most popular first
- **Filtering**: View pending/answered/all

---

## FEATURE 3: ATTENDANCE REPORT

### Architecture
- Tracks join/leave events in real-time
- Generates CSV and JSON exports
- Calculates watch duration per participant
- Supports large participant lists

### Database Schema Updates

**Firestore Collections:**
```
lives/{liveId}/access_logs/{logId}
  - userId: uid
  - displayName: string
  - event: "join" | "leave"
  - timestamp: Timestamp
  - eventAt: ISO string

analytics_events/{eventId}
  - liveId: string
  - userId: uid
  - displayName: string
  - eventType: "attendance"
  - action: "join" | "leave"
  - timestamp: Timestamp
```

### API Routes

#### 1. POST `/api/livekit/attendance/track`
**Track user join/leave events**

Request Body:
```json
{
  "liveId": "string",
  "event": "join" | "leave",
  "displayName": "string"  // optional
}
```

Response:
```json
{
  "success": true,
  "message": "Entrada registada.",
  "timestamp": "ISO"
}
```

Features:
- Called when user joins/leaves room
- Gets user display name if not provided
- Stores in access_logs subcollection
- Also stores in analytics_events
- Timestamp in both UTC and ISO formats

**Called From:** StudioPage component on mount/unmount

#### 2. POST `/api/livekit/attendance/report`
**Generate attendance report**

Request Body:
```json
{
  "liveId": "string",
  "format": "json" | "csv" | "pdf"  // default: json
}
```

**Response (JSON):**
```json
{
  "liveId": "string",
  "liveTitle": "string",
  "startedAt": "ISO",
  "endedAt": "ISO",
  "attendees": [
    {
      "name": "João Silva",
      "joinedAt": "ISO",
      "leftAt": "ISO",
      "durationMinutes": 45,
      "durationFormatted": "45m"
    }
  ],
  "total": 23,
  "generatedAt": "ISO"
}
```

**Response (CSV):**
```csv
Nome,Entrou em,Saiu em,Duração (min),Duração Formatada
"João Silva",01/02/2024 14:30:22,01/02/2024 15:15:45,45,45m
"Maria Santos",01/02/2024 14:32:10,01/02/2024 15:10:33,38,38m
```

Features:
- Verifies professor permissions
- Aggregates all access logs
- Calculates duration (minutes)
- Returns formatted data
- Supports multiple export formats
- Sorted by join time

### UI Component

#### AttendanceReport Component
```tsx
<AttendanceReport 
  liveId={liveId}
  liveTitle={liveTitle}
  isTeacher={true}
/>
```

Features:
- Collapsed header showing summary
- Expandable to full attendance table
- Download as CSV button
- Download as JSON button
- Shows totals:
  - Total participants
  - Average duration
- Only visible to teachers
- Real-time loading states

### Integration Steps

1. **Add tracking on join:**
```tsx
useEffect(() => {
  if (joined) {
    fetch("/api/livekit/attendance/track", {
      method: "POST",
      body: JSON.stringify({
        liveId,
        event: "join",
        displayName: user?.displayName
      })
    });
  }
}, [joined]);
```

2. **Add tracking on leave:**
```tsx
useEffect(() => {
  return () => {
    fetch("/api/livekit/attendance/track", {
      method: "POST",
      body: JSON.stringify({
        liveId,
        event: "leave"
      })
    });
  };
}, []);
```

3. **Add AttendanceReport to teacher dashboard:**
```tsx
<AttendanceReport 
  liveId={liveId}
  liveTitle={live.title}
  isTeacher={userRole === "teacher"}
/>
```

4. **Test Attendance:**
```
1. Start live session
2. Multiple students join
3. Wait some time
4. Some students leave
5. Generate report
6. Verify durations calculated correctly
7. Download CSV/JSON
```

### CSV Format Details

- UTF-8 encoding with BOM
- Headers: Nome, Entrou em, Saiu em, Duração (min), Duração Formatada
- Locale: pt-PT (Portuguese)
- Date format: DD/MM/YYYY HH:MM:SS
- Sort: By join time (earliest first)

### Calculations

**Duration** = (Leave Time - Join Time) / 60 seconds = minutes

**Average Duration** = Sum of all durations / Total participants

If participant still in session (no leave time), use current time or session end time.

---

## Integration Checklist

### Phase 1: Database
- [ ] Update LiveSession type in `src/types/live.ts`
- [ ] Add new interface types (QAQuestion, QAAnswer, AttendanceEvent)
- [ ] Update Firestore security rules

### Phase 2: API Routes - Recording
- [ ] Create `/api/livekit/egress/start`
- [ ] Create `/api/livekit/egress/stop`
- [ ] Create `/api/livekit/webhooks/egress`
- [ ] Test start/stop recording
- [ ] Test webhook processing

### Phase 3: API Routes - Q&A
- [ ] Create `/api/livekit/qa/ask`
- [ ] Create `/api/livekit/qa/answer`
- [ ] Create `/api/livekit/qa/list`
- [ ] Create `/api/livekit/qa/upvote`
- [ ] Test question lifecycle

### Phase 4: API Routes - Attendance
- [ ] Create `/api/livekit/attendance/track`
- [ ] Create `/api/livekit/attendance/report`
- [ ] Test tracking
- [ ] Test CSV export
- [ ] Test JSON export

### Phase 5: UI Components
- [ ] Create `RecordingControls` component
- [ ] Create `ReplayPlayer` component
- [ ] Create `QAPanel` component
- [ ] Create `AttendanceReport` component
- [ ] Integrate into StudioPage

### Phase 6: Environment Variables
- [ ] Add to `.env.local`:
  - LIVEKIT_API_KEY
  - LIVEKIT_API_SECRET
  - S3_ACCESS_KEY
  - S3_SECRET_KEY
  - S3_BUCKET
  - S3_REGION
  - S3_ENDPOINT
- [ ] Add to deployment config
- [ ] Document in `.env.production.example`

### Phase 7: Testing
- [ ] Test recording start/stop
- [ ] Test replay player
- [ ] Test Q&A ask/answer/vote
- [ ] Test attendance tracking
- [ ] Test report generation (CSV/JSON)
- [ ] Test permissions (teacher/student)

### Phase 8: Deployment
- [ ] Configure LiveKit webhooks
- [ ] Verify S3/R2 bucket permissions
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor logs for errors

---

## API Error Handling

All API routes follow consistent error patterns:

```json
// 400 Bad Request
{ "error": "Descrição do erro" }

// 401 Unauthorized
{ "error": "Utilizador não autenticado" }

// 403 Forbidden
{ "error": "Não tem permissão para realizar esta ação" }

// 404 Not Found
{ "error": "Recurso não encontrado" }

// 409 Conflict
{ "error": "Já existe uma gravação ativa" }

// 500 Internal Server Error
{ "error": "Erro interno do servidor" }
```

---

## Performance Considerations

### Recording
- Stored in S3/R2 (not in Firestore)
- Signed URLs generated on-demand
- URLs expire after 7 days for security

### Q&A
- Questions stored in subcollection (better scaling)
- Polling interval: 3 seconds (configurable)
- Upvotes denormalized for fast sorting

### Attendance
- Access logs stored in subcollection
- Aggregated on report generation
- Suitable for 100+ participants

---

## Security Considerations

1. **Recording Access:**
   - Only teachers can start/stop
   - Signed URLs expire after 7 days
   - S3/R2 bucket is private

2. **Q&A Access:**
   - Any participant can ask/vote
   - Only teacher can answer/dismiss
   - Questions are moderated

3. **Attendance Access:**
   - Only teacher can view/export reports
   - Access logs not exposed to students
   - Analytics stored separately

---

## Future Enhancements

1. **Recording:**
   - Custom layouts (picture-in-picture)
   - Audio-only recording option
   - Automatic transcription

2. **Q&A:**
   - Star/bookmark questions
   - Search questions
   - Export Q&A to PDF

3. **Attendance:**
   - Attendance percentage calculation
   - Email reports
   - Integration with LMS

---

## Support & Troubleshooting

### Common Issues

**Q: Recording shows "processing" but never completes**
A: Check webhook URL is accessible and LiveKit webhooks are enabled

**Q: Students can't ask questions**
A: Verify live session status is "live" and qaMode is enabled

**Q: Attendance durations are incorrect**
A: Ensure access_logs events are being recorded (check track API)

**Q: Can't download CSV**
A: Verify S3/R2 credentials and bucket permissions

### Debug Mode

Enable debug logging:
```typescript
// In environment
DEBUG=livekit:* npm run dev
```

Check Firestore:
```
lives/{liveId}
├── recordingStatus: "ready"
├── recordingUrl: "https://..."
└── qa_questions
    └── {questionId}
        ├── question: "..."
        ├── status: "answered"
        └── answers: [...]
```

---

## Files Created

### API Routes
- `src/app/api/livekit/egress/start/route.ts`
- `src/app/api/livekit/egress/stop/route.ts`
- `src/app/api/livekit/webhooks/egress/route.ts`
- `src/app/api/livekit/qa/ask/route.ts`
- `src/app/api/livekit/qa/answer/route.ts`
- `src/app/api/livekit/qa/list/route.ts`
- `src/app/api/livekit/qa/upvote/route.ts`
- `src/app/api/livekit/attendance/track/route.ts`
- `src/app/api/livekit/attendance/report/route.ts`

### UI Components
- `src/components/RecordingControls.tsx`
- `src/components/ReplayPlayer.tsx`
- `src/components/QAPanel.tsx`
- `src/components/AttendanceReport.tsx`

### Type Updates
- `src/types/live.ts` (LiveSession, QAQuestion, QAAnswer, AttendanceEvent)

### Documentation
- This file (STUDIO_FEATURES_IMPLEMENTATION.md)

---

**Last Updated:** 2024
**Status:** Ready for Integration
