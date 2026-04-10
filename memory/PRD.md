# Jio Finance Avatar Video Generation Platform

## Original Problem Statement
Build a web platform where users can log in and generate AI avatar videos using the HeyGen API and ElevenLabs API.

### Core Features
- **User Roles**: User (generate videos, manage folders, consume credits) and Admin (view all users/videos, manage credits)
- **Avatars**: Connect to HeyGen API but display ONLY 6 specific Jio-approved avatars with mapped display names
- **Script Creation**: AI Script Generator, Paste Script (with AI enhancement), AI Rewrite (adjust tone)
- **Voice & Video**: Duration selection, language selection. Voice Engine using HeyGen native voices or ElevenLabs voices (matched by name). Avatar Engine options (Standard, Avatar IV, Avatar V)
- **Platform UI**: Auth pages, Dashboard, Avatars selection, History page, Credits display, Chatbot assistant panel

## Tech Stack
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Motor (Async MongoDB)
- **Database**: MongoDB
- **3rd Party APIs**: 
  - HeyGen API (v1 asset upload, v2 video generate, v2 voices, v2 avatars)
  - ElevenLabs API (v1 voices, v1 tts)
  - OpenAI GPT-5.2 via Emergent LLM Key

## Jio Approved Avatars
| Avatar ID | Display Name |
|-----------|--------------|
| b65c8b326bd546aba0edf4f4be65f37e | Manish |
| 23a8ea2ea0294fe68b0f1f514081bf1d | Ekta |
| 10483c6d38564597a9491c0dbff9b0dd | Swati Verma |
| b6529e10fb6a45aabe730acff799aebf | Prashant |
| 38ab20bc42634d368d4072b102aaa3d9 | Anoushka Chauhan |
| 3024995942d148c887c9df208444c663 | Garvik |

## Architecture

```
/app/
├── backend/
│   ├── .env (MONGO_URL, HEYGEN_API_KEY, ELEVENLABS_API_KEY, EMERGENT_LLM_KEY, JWT_SECRET)
│   ├── requirements.txt
│   └── server.py
└── frontend/
    ├── .env (REACT_APP_BACKEND_URL)
    ├── package.json
    └── src/
        ├── App.js
        ├── components/
        │   ├── ChatbotPanel.js
        │   └── ui/ (shadcn components)
        ├── contexts/
        │   └── AuthContext.js
        └── pages/
            ├── AdminPage.js
            ├── AvatarsPage.js
            ├── CreatePage.js
            ├── CreditsPage.js
            ├── Dashboard.js
            ├── HistoryPage.js
            ├── LoginPage.js
            └── SignupPage.js
```

## Key API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Avatars
- `GET /api/avatars` - Get Jio-approved avatars only (strictly filtered)

### Scripts
- `POST /api/scripts/generate` - AI script generation
- `POST /api/scripts/enhance` - AI script enhancement
- `POST /api/scripts/rewrite` - AI script rewrite with tone

### Voice
- `GET /api/heygen/voices` - Get HeyGen voices
- `POST /api/heygen/tts-preview` - HeyGen TTS preview
- `POST /api/voice/script-preview` - ElevenLabs script preview (matches voice by name)
- `POST /api/elevenlabs/voices` - Get ElevenLabs voices
- `POST /api/elevenlabs/preview` - ElevenLabs direct preview

### Videos
- `POST /api/videos/generate` - Basic video generation
- `POST /api/videos/generate-advanced` - Advanced video generation (Avatar V, EL voice matching)
- `GET /api/videos` - Get user's videos
- `GET /api/videos/{video_id}` - Get specific video
- `GET /api/videos/status/{video_id}` - Check video generation status

### Folders
- `POST /api/folders` - Create folder
- `GET /api/folders` - Get user's folders
- `DELETE /api/folders/{folder_id}` - Delete folder

### Chat
- `POST /api/chat/message` - Chatbot assistant

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/videos` - Get all videos
- `PUT /api/admin/users/{user_id}/credits` - Update user credits
- `GET /api/admin/folders` - Get all folders

## Database Schema

### users
```json
{
  "id": "uuid",
  "email": "string",
  "password_hash": "string",
  "role": "user|admin",
  "credits": "int",
  "created_at": "datetime"
}
```

### videos
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "avatar_id": "string",
  "avatar_name": "string",
  "title": "string",
  "script": "string",
  "language": "string",
  "duration": "int",
  "video_url": "string|null",
  "thumbnail_url": "string|null",
  "status": "queued|generating|completed|failed",
  "heygen_video_id": "string|null",
  "folder_id": "uuid|null",
  "created_at": "datetime"
}
```

### folders
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "created_at": "datetime"
}
```

## Completed Features (as of April 10, 2026)

### Core Platform
- [x] User authentication (signup, login, JWT tokens)
- [x] Admin role with elevated permissions
- [x] Credits system (100 credits on signup)
- [x] Responsive UI with Tailwind CSS and shadcn/ui

### Avatar System
- [x] HeyGen API integration for avatars
- [x] Strict filtering to 6 Jio-approved avatars only
- [x] Custom display names for each avatar
- [x] Avatar selection flow

### Script Creation
- [x] AI Script Generator (GPT-5.2)
- [x] Paste Script with AI enhancement
- [x] AI Rewrite with tone selection (Emotional, Energetic, Slow, Fast, Professional)

### Voice Engine
- [x] HeyGen voices fetching and selection
- [x] Gender and text search filters for voices
- [x] ElevenLabs toggle switch ("This is an ElevenLabs voice")
- [x] ElevenLabs model and stability settings when toggle is ON
- [x] Voice preview with user's script (HeyGen TTS)
- [x] **NEW**: ElevenLabs script preview via `/api/voice/script-preview`
- [x] **NEW**: Dynamic ElevenLabs voice matching by name during video generation

### Video Generation
- [x] Basic video generation via HeyGen
- [x] Advanced video generation with:
  - Avatar Engine selection (Standard, Avatar IV, Avatar V)
  - Resolution selection (720p, 1080p)
  - Auto captions option
  - ElevenLabs voice matching by name (uploads audio asset to HeyGen)
- [x] Video status polling
- [x] History page with video list

### Admin Panel
- [x] View all users
- [x] View all videos
- [x] Update user credits

### Chatbot
- [x] AI assistant panel for script help

## Backlog / Future Tasks

### P1 (High Priority)
- [ ] Robust error handling for ElevenLabs API rate limits
- [ ] Video download functionality
- [ ] Video sharing/embedding

### P2 (Medium Priority)
- [ ] Folder management UI (move videos to folders)
- [ ] Batch video generation
- [ ] Video templates/presets

### P3 (Low Priority)
- [ ] Analytics dashboard
- [ ] Multi-language UI
- [ ] Dark mode theme
