from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import asyncio as _asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import base64
import io
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment variables
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
HEYGEN_API_KEY = os.environ.get('HEYGEN_API_KEY')
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', 'sk_cfa652388dad22ed13e0d36de0a31b235e34a91a2dbd21c8')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', 're_J9GWkpbD_DUTtGDNJhxjnNCwjpoJJVCYc')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Keep EMERGENT_LLM_KEY for script generation (works on Emergent platform)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Jio Approved Avatar IDs and their display names
JIO_AVATARS = {
    "b65c8b326bd546aba0edf4f4be65f37e": "Manish",
    "23a8ea2ea0294fe68b0f1f514081bf1d": "Ekta",
    "10483c6d38564597a9491c0dbff9b0dd": "Swati Verma",
    "b6529e10fb6a45aabe730acff799aebf": "Prashant",
    "38ab20bc42634d368d4072b102aaa3d9": "Anoushka Chauhan",
    "3024995942d148c887c9df208444c663": "Garvik"
}

# ============= MODELS =============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: str = "user"
    credits: int = 100
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSignup(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    credits: int
    created_at: datetime

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class Folder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FolderCreate(BaseModel):
    name: str

class FolderResponse(BaseModel):
    id: str
    name: str
    created_at: datetime

class Video(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    avatar_id: str
    avatar_name: str
    title: str
    script: str
    language: str
    duration: int
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str = "queued"
    folder_id: Optional[str] = None
    heygen_video_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoCreate(BaseModel):
    avatar_id: str
    avatar_name: str
    title: str
    script: str
    language: str
    duration: int
    folder_id: Optional[str] = None

class VideoResponse(BaseModel):
    id: str
    avatar_id: str
    avatar_name: str
    title: str
    script: str
    language: str
    duration: int
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    status: str
    folder_id: Optional[str]
    created_at: datetime

class ScriptGenerateRequest(BaseModel):
    prompt: str

class ScriptEnhanceRequest(BaseModel):
    script: str

class ScriptRewriteRequest(BaseModel):
    script: str
    tone: str

class ScriptResponse(BaseModel):
    script: str

class VoicePreviewRequest(BaseModel):
    script: str
    language: str

class VoicePreviewResponse(BaseModel):
    audio_base64: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    message: str
    session_id: str

class UpdateCreditsRequest(BaseModel):
    credits: int

class HeyGenTTSRequest(BaseModel):
    voice_id: str
    script: str

class ScriptPreviewRequest(BaseModel):
    heygen_voice_name: str
    script: str
    model_id: str = "eleven_multilingual_v2"

class ElevenLabsVoicesRequest(BaseModel):
    elevenlabs_api_key: str

class ElevenLabsPreviewRequest(BaseModel):
    elevenlabs_api_key: str
    elevenlabs_voice_id: str
    script: str
    model_id: str = "eleven_multilingual_v2"
    stability: float = 0.5
    similarity_boost: float = 0.75

class VideoCreateAdvanced(BaseModel):
    avatar_id: str
    avatar_name: str
    title: str
    script: str
    language: str
    duration: int
    folder_id: Optional[str] = None
    voice_mode: str = "heygen"
    heygen_voice_id: Optional[str] = None
    heygen_voice_name: Optional[str] = None
    use_el_in_heygen: bool = False
    el_heygen_model: str = "eleven_multilingual_v2"
    el_heygen_stability: float = 0.5
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    el_stability: float = 0.5
    el_similarity_boost: float = 0.75
    avatar_engine: str = "standard"
    width: int = 1920
    height: int = 1080
    enable_captions: bool = False

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============= AUTH ROUTES =============

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(data: UserSignup):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role="user",
        credits=100
    )

    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)

    token = create_token(user.id, user.email, user.role)
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        credits=user.credits,
        created_at=user.created_at
    )

    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"], user["role"])
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])

    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        role=user["role"],
        credits=user["credits"],
        created_at=user["created_at"]
    )

    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    if isinstance(current_user['created_at'], str):
        current_user['created_at'] = datetime.fromisoformat(current_user['created_at'])
    return UserResponse(**current_user)

# ============= FORGOT PASSWORD — PRODUCTION FLOW =============
# Step 1: User requests reset → generates secure token → sends email with link
# Step 2: User clicks link → lands on /reset-password?token=xxx → enters new password
# Step 3: Backend validates token (expiry + one-time use) → updates password

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    try:
        import resend

        resend.api_key = RESEND_API_KEY

        email = data.email.lower().strip()
        user = await db.users.find_one({"email": email})

        # Always return success — never reveal if email exists (security best practice)
        if not user:
            return {"message": "If this email exists, a reset link has been sent."}

        # Generate cryptographically secure token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # Delete any existing tokens for this email (one at a time)
        await db.password_reset_tokens.delete_many({"email": email})

        # Store token in DB
        await db.password_reset_tokens.insert_one({
            "email": email,
            "token": token,
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        # Build reset link pointing to frontend
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

        # Send branded email
        resend.Emails.send({
            "from": "JioGen AI <noreply@eipimedia.com>",
            "to": email,
            "subject": "Reset Your Password — JioGen AI",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">

                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="display: inline-block; background: #1a56db; border-radius: 12px; padding: 12px 24px;">
                        <span style="color: white; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">JioGen AI</span>
                    </div>
                </div>

                <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 12px;">Reset your password</h2>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
                    We received a request to reset the password for your account (<strong>{email}</strong>).
                    Click the button below to set a new password.
                    <br/><br/>
                    This link will expire in <strong>15 minutes</strong> and can only be used once.
                </p>

                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="{reset_link}"
                       style="background: #1a56db; color: #ffffff; text-decoration: none;
                              padding: 14px 36px; border-radius: 8px; font-size: 16px;
                              font-weight: 600; display: inline-block; letter-spacing: 0.3px;">
                        Reset Password
                    </a>
                </div>

                <p style="color: #9ca3af; font-size: 13px; margin-bottom: 6px;">
                    Button not working? Copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; word-break: break-all; background: #f3f4f6;
                           padding: 12px; border-radius: 6px; color: #1a56db; margin-bottom: 28px;">
                    {reset_link}
                </p>

                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;" />
                <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will not change unless you click the link above.
                    <br/><br/>
                    &copy; {datetime.now().year} JioGen AI — EiPi Media Pvt. Ltd.
                </p>

            </div>
            """
        })

        return {"message": "If this email exists, a reset link has been sent."}

    except Exception as e:
        logging.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send reset email. Please try again.")


@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        # Validate password strength
        if len(data.new_password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

        # Look up token
        record = await db.password_reset_tokens.find_one({"token": data.token})
        if not record:
            raise HTTPException(status_code=400, detail="Invalid or expired reset link. Please request a new one.")

        # Check if already used
        if record.get("used"):
            raise HTTPException(status_code=400, detail="This reset link has already been used. Please request a new one.")

        # Check expiry
        expires_at = datetime.fromisoformat(record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            await db.password_reset_tokens.delete_one({"token": data.token})
            raise HTTPException(status_code=400, detail="This reset link has expired. Please request a new one.")

        # Update password
        hashed = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        await db.users.update_one(
            {"email": record["email"]},
            {"$set": {"password_hash": hashed}}
        )

        # Delete token — one-time use
        await db.password_reset_tokens.delete_one({"token": data.token})

        logging.info(f"Password reset successful for: {record['email']}")
        return {"message": "Password reset successfully. You can now log in with your new password."}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password. Please try again.")

# ============= AVATAR ROUTES =============

@api_router.get("/avatars")
async def get_avatars(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as hclient:
            response = await hclient.get(
                "https://api.heygen.com/v2/avatars",
                headers={"X-Api-Key": HEYGEN_API_KEY},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()

            all_avatars = data.get("data", {}).get("avatars", [])

            seen_ids = set()
            filtered_avatars = []
            for avatar in all_avatars:
                avatar_id = avatar.get("avatar_id")
                if avatar_id in JIO_AVATARS and avatar_id not in seen_ids:
                    seen_ids.add(avatar_id)
                    avatar["display_name"] = JIO_AVATARS[avatar_id]
                    filtered_avatars.append(avatar)

            return {"avatars": filtered_avatars}
    except Exception as e:
        logging.error(f"Error fetching avatars: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch avatars: {str(e)}")

# ============= SCRIPT ROUTES =============

@api_router.post("/scripts/generate", response_model=ScriptResponse)
async def generate_script(data: ScriptGenerateRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-gen-{current_user['id']}-{uuid.uuid4()}",
            system_message="आप एक हिंदी स्क्रिप्ट राइटर हैं। केवल शुद्ध देवनागरी हिंदी में लिखें। कभी भी hashtag, asterisk, bracket या English words उपयोग न करें। वाक्यों के बीच ... का उपयोग करें। छोटे और भावनात्मक वाक्य लिखें। केवल plain script return करें — कुछ और नहीं।"
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Generate a script for: {data.prompt}")
        response = await chat.send_message(user_message)

        return ScriptResponse(script=response)
    except Exception as e:
        logging.error(f"Error generating script: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate script: {str(e)}")

@api_router.post("/scripts/enhance", response_model=ScriptResponse)
async def enhance_script(data: ScriptEnhanceRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-enhance-{current_user['id']}-{uuid.uuid4()}",
            system_message="You are a professional script editor. Enhance the provided script by improving vocabulary, clarity, and flow while maintaining the original message and tone."
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Enhance this script:\n\n{data.script}")
        response = await chat.send_message(user_message)

        return ScriptResponse(script=response)
    except Exception as e:
        logging.error(f"Error enhancing script: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to enhance script: {str(e)}")

@api_router.post("/scripts/rewrite", response_model=ScriptResponse)
async def rewrite_script(data: ScriptRewriteRequest, current_user: dict = Depends(get_current_user)):
    try:
        tone_instructions = {
            "Emotional": "Rewrite with emotional depth, warmth, and connection.",
            "Energetic": "Rewrite with high energy, enthusiasm, and excitement.",
            "Slow delivery": "Rewrite for slow, deliberate delivery with pauses and emphasis.",
            "Fast delivery": "Rewrite for quick, punchy delivery with short sentences.",
            "Professional": "Rewrite in a formal, professional, and authoritative tone."
        }

        instruction = tone_instructions.get(data.tone, "Rewrite in a professional tone.")

        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-rewrite-{current_user['id']}-{uuid.uuid4()}",
            system_message="आप एक हिंदी स्क्रिप्ट राइटर हैं। केवल शुद्ध देवनागरी हिंदी में लिखें। कभी भी hashtag, asterisk, bracket या English words उपयोग न करें। वाक्यों के बीच ... का उपयोग करें। छोटे और भावनात्मक वाक्य लिखें। केवल plain script return करें।"
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=f"Rewrite this script in {instruction} tone:\n\n{data.script}")
        response = await chat.send_message(user_message)

        return ScriptResponse(script=response)
    except Exception as e:
        logging.error(f"Error rewriting script: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to rewrite script: {str(e)}")

# ============= VOICE PREVIEW ROUTES =============

@api_router.post("/voice/preview", response_model=VoicePreviewResponse)
async def preview_voice(data: VoicePreviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        preview_text = data.script[:2000]
        audio_base64 = await tts.generate_speech_base64(
            text=preview_text,
            model="tts-1",
            voice="nova"
        )
        return VoicePreviewResponse(audio_base64=audio_base64)
    except Exception as e:
        logging.error(f"Error generating voice preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate voice preview: {str(e)}")

# ============= VIDEO ROUTES =============

@api_router.post("/videos/generate", response_model=VideoResponse)
async def generate_video(data: VideoCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["credits"] < 1:
            raise HTTPException(status_code=400, detail="Insufficient credits")

        video = Video(
            user_id=current_user["id"],
            avatar_id=data.avatar_id,
            avatar_name=data.avatar_name,
            title=data.title,
            script=data.script,
            language=data.language,
            duration=data.duration,
            folder_id=data.folder_id,
            status="generating"
        )

        doc = video.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.videos.insert_one(doc)

        async with httpx.AsyncClient() as hclient:
            heygen_response = await hclient.post(
                "https://api.heygen.com/v2/video/generate",
                headers={
                    "X-Api-Key": HEYGEN_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "video_inputs": [{
                        "character": {
                            "type": "avatar",
                            "avatar_id": data.avatar_id,
                            "avatar_style": "normal"
                        },
                        "voice": {
                            "type": "text",
                            "input_text": data.script,
                            "voice_id": "1bd001e7e50f421d891986aad5158bc8"
                        }
                    }],
                    "dimension": {"width": 1280, "height": 720},
                    "test": True
                },
                timeout=30.0
            )
            heygen_response.raise_for_status()
            heygen_data = heygen_response.json()
            video_id = heygen_data.get("data", {}).get("video_id")

            await db.videos.update_one(
                {"id": video.id},
                {"$set": {"heygen_video_id": video_id}}
            )

        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"credits": -1}}
        )

        if isinstance(video.created_at, str):
            video.created_at = datetime.fromisoformat(video.created_at)

        return VideoResponse(**video.model_dump())
    except httpx.HTTPStatusError as e:
        logging.error(f"HeyGen API error: {e.response.text}")
        await db.videos.update_one({"id": video.id}, {"$set": {"status": "failed"}})
        raise HTTPException(status_code=500, detail=f"Video generation failed: {e.response.text}")
    except Exception as e:
        logging.error(f"Error generating video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate video: {str(e)}")

@api_router.get("/videos/status/{video_id}")
async def get_video_status(video_id: str, current_user: dict = Depends(get_current_user)):
    try:
        video = await db.videos.find_one({"id": video_id}, {"_id": 0})
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        if video["user_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access denied")

        # Always refresh URL for completed videos — signed URLs expire
        if video["status"] == "completed" and video.get("heygen_video_id"):
            try:
                async with httpx.AsyncClient(timeout=20.0) as hc:
                    resp = await hc.get(
                        f"https://api.heygen.com/v1/video_status.get?video_id={video['heygen_video_id']}",
                        headers={"X-Api-Key": HEYGEN_API_KEY}
                    )
                    fresh_url = resp.json().get("data", {}).get("video_url")
                    if fresh_url:
                        video["video_url"] = fresh_url
                        await db.videos.update_one(
                            {"id": video_id},
                            {"$set": {"video_url": fresh_url}}
                        )
            except Exception as e:
                logging.error(f"URL refresh error: {e}")
            if isinstance(video['created_at'], str):
                video['created_at'] = datetime.fromisoformat(video['created_at'])
            return VideoResponse(**video)

        if video["status"] == "generating" and video.get("heygen_video_id"):
            logging.info(f"Checking HeyGen status for: {video['heygen_video_id']}")
            async with httpx.AsyncClient() as hclient:
                response = await hclient.get(
                    f"https://api.heygen.com/v1/video_status.get?video_id={video['heygen_video_id']}",
                    headers={"X-Api-Key": HEYGEN_API_KEY},
                    timeout=30.0
                )
                response.raise_for_status()
                status_data = response.json()

                heygen_status = status_data.get("data", {}).get("status")
                video_url = status_data.get("data", {}).get("video_url")
                thumbnail_url = status_data.get("data", {}).get("thumbnail_url")

                if heygen_status == "completed" and video_url:
                    await db.videos.update_one(
                        {"id": video_id},
                        {"$set": {
                            "status": "completed",
                            "video_url": video_url,
                            "thumbnail_url": thumbnail_url
                        }}
                    )
                    video["status"] = "completed"
                    video["video_url"] = video_url
                    video["thumbnail_url"] = thumbnail_url
                elif heygen_status == "failed":
                    await db.videos.update_one(
                        {"id": video_id},
                        {"$set": {"status": "failed"}}
                    )
                    video["status"] = "failed"

        if isinstance(video['created_at'], str):
            video['created_at'] = datetime.fromisoformat(video['created_at'])

        return VideoResponse(**video)
    except httpx.HTTPStatusError as e:
        logging.error(f"HeyGen status check error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Failed to check video status")
    except Exception as e:
        logging.error(f"Error checking video status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check video status: {str(e)}")

@api_router.get("/videos", response_model=List[VideoResponse])
async def get_videos(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    videos = await db.videos.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)

    # Refresh expired signed URLs for completed videos
    for video in videos:
        if isinstance(video["created_at"], str):
            video["created_at"] = datetime.fromisoformat(video["created_at"])
        if video.get("status") == "completed" and video.get("heygen_video_id"):
            try:
                async with httpx.AsyncClient(timeout=15.0) as hc:
                    resp = await hc.get(
                        f"https://api.heygen.com/v1/video_status.get?video_id={video['heygen_video_id']}",
                        headers={"X-Api-Key": HEYGEN_API_KEY}
                    )
                    fresh_url = resp.json().get("data", {}).get("video_url")
                    if fresh_url and fresh_url != video.get("video_url"):
                        video["video_url"] = fresh_url
                        await db.videos.update_one(
                            {"id": video["id"]},
                            {"$set": {"video_url": fresh_url}}
                        )
            except Exception:
                pass

    return [VideoResponse(**video) for video in videos]

@api_router.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(video_id: str, current_user: dict = Depends(get_current_user)):
    video = await db.videos.find_one({"id": video_id}, {"_id": 0})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    if isinstance(video['created_at'], str):
        video['created_at'] = datetime.fromisoformat(video['created_at'])

    return VideoResponse(**video)

# ============= FOLDER ROUTES =============

@api_router.post("/folders", response_model=FolderResponse)
async def create_folder(data: FolderCreate, current_user: dict = Depends(get_current_user)):
    folder = Folder(user_id=current_user["id"], name=data.name)
    doc = folder.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.folders.insert_one(doc)
    if isinstance(folder.created_at, str):
        folder.created_at = datetime.fromisoformat(folder.created_at)
    return FolderResponse(**folder.model_dump())

@api_router.get("/folders", response_model=List[FolderResponse])
async def get_folders(current_user: dict = Depends(get_current_user)):
    folders = await db.folders.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for folder in folders:
        if isinstance(folder['created_at'], str):
            folder['created_at'] = datetime.fromisoformat(folder['created_at'])
    return [FolderResponse(**folder) for folder in folders]

@api_router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, current_user: dict = Depends(get_current_user)):
    folder = await db.folders.find_one({"id": folder_id}, {"_id": 0})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    if folder["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.videos.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None}})
    await db.folders.delete_one({"id": folder_id})
    return {"message": "Folder deleted"}

# ============= CHATBOT ROUTES =============

@api_router.post("/chat/message", response_model=ChatResponse)
async def chat_message(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        user_msg = ChatMessage(
            session_id=data.session_id,
            user_id=current_user["id"],
            role="user",
            content=data.message
        )
        user_doc = user_msg.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.chat_messages.insert_one(user_doc)

        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=data.session_id,
            system_message="You are a helpful AI assistant for JioGen AI Avatar Video Platform. Help users create video scripts by understanding their needs, suggesting improvements, and generating content. Be conversational and helpful."
        ).with_model("openai", "gpt-5.2")

        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)

        assistant_msg = ChatMessage(
            session_id=data.session_id,
            user_id=current_user["id"],
            role="assistant",
            content=response
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['created_at'] = assistant_doc['created_at'].isoformat()
        await db.chat_messages.insert_one(assistant_doc)

        return ChatResponse(message=response, session_id=data.session_id)
    except Exception as e:
        logging.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# ============= ADMIN ROUTES =============

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        if isinstance(user['created_at'], str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return [UserResponse(**user) for user in users]

@api_router.get("/admin/videos", response_model=List[VideoResponse])
async def get_all_videos(current_user: dict = Depends(require_admin)):
    videos = await db.videos.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for video in videos:
        if isinstance(video['created_at'], str):
            video['created_at'] = datetime.fromisoformat(video['created_at'])
    return [VideoResponse(**video) for video in videos]

@api_router.put("/admin/users/{user_id}/credits")
async def update_user_credits(user_id: str, data: UpdateCreditsRequest, current_user: dict = Depends(require_admin)):
    result = await db.users.update_one({"id": user_id}, {"$set": {"credits": data.credits}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Credits updated"}

@api_router.get("/admin/folders", response_model=List[FolderResponse])
async def get_all_folders(current_user: dict = Depends(require_admin)):
    folders = await db.folders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for folder in folders:
        if isinstance(folder['created_at'], str):
            folder['created_at'] = datetime.fromisoformat(folder['created_at'])
    return [FolderResponse(**folder) for folder in folders]

# ============= SCRIPT CLEANING HELPER =============

def clean_script_for_tts(text: str) -> str:
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', text)
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'^\s*[-\u2022]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{2,}', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

# ============= HELPER: ELEVENLABS → HEYGEN ASSET =============

async def _elevenlabs_to_heygen_asset(
    el_api_key: str,
    el_voice_id: str,
    script: str,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75
) -> str:
    api_key = el_api_key if el_api_key else ELEVENLABS_API_KEY
    async with httpx.AsyncClient(timeout=120.0) as hclient:
        el_resp = await hclient.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{el_voice_id}",
            headers={
                "xi-api-key": api_key,
                "Accept": "audio/mpeg",
                "Content-Type": "application/json"
            },
            json={
                "text": clean_script_for_tts(script),
                "model_id": model_id,
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
        )
        if el_resp.status_code == 401:
            raise HTTPException(status_code=400, detail="Invalid ElevenLabs API key")
        el_resp.raise_for_status()
        logging.info(f"EL TTS status: {el_resp.status_code}, bytes: {len(el_resp.content)}")

        hg_resp = await hclient.post(
            "https://upload.heygen.com/v1/asset",
            headers={
                "X-Api-Key": HEYGEN_API_KEY,
                "Content-Type": "audio/mpeg"
            },
            content=el_resp.content
        )
        logging.info(f"HeyGen asset upload status: {hg_resp.status_code}")
        hg_resp.raise_for_status()
        asset_id = hg_resp.json().get("data", {}).get("id")
        if not asset_id:
            raise ValueError(f"HeyGen asset upload failed: {hg_resp.json()}")
        return asset_id

# ============= HEYGEN + ELEVENLABS ROUTES =============

@api_router.get("/heygen/voices")
async def get_heygen_voices(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as hclient:
            resp = await hclient.get(
                "https://api.heygen.com/v2/voices",
                headers={"X-Api-Key": HEYGEN_API_KEY}
            )
            resp.raise_for_status()
            voices = resp.json().get("data", {}).get("voices", [])
            return {"voices": voices, "count": len(voices)}
    except Exception as e:
        logging.error(f"HeyGen voices error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/heygen/tts-preview")
async def heygen_tts_preview(data: HeyGenTTSRequest, current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient(timeout=30.0) as hclient:
            resp = await hclient.post(
                "https://api.heygen.com/v1/audio/text_to_speech",
                headers={"X-Api-Key": HEYGEN_API_KEY, "Content-Type": "application/json"},
                json={"text": data.script[:500], "voice_id": data.voice_id}
            )
            resp.raise_for_status()
            result = resp.json()
            audio_url = (result.get("data", {}).get("audio_url") or result.get("audio_url") or result.get("data", {}).get("url"))
            audio_b64 = (result.get("data", {}).get("audio") or result.get("audio"))
            return {"audio_url": audio_url, "audio_base64": audio_b64}
    except Exception as e:
        logging.error(f"HeyGen TTS preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/voice/script-preview")
async def voice_script_preview(data: ScriptPreviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        matched_el_voice_id = None
        async with httpx.AsyncClient(timeout=30.0) as hclient:
            el_resp = await hclient.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": ELEVENLABS_API_KEY}
            )
            el_resp.raise_for_status()
            el_voices = el_resp.json().get("voices", [])

            search_name = (data.heygen_voice_name or "").lower().strip()
            for v in el_voices:
                el_name = v.get("name", "").lower().strip()
                if el_name == search_name or search_name in el_name or el_name in search_name:
                    matched_el_voice_id = v.get("voice_id")
                    logging.info(f"Script preview matched EL voice: {v.get('name')} -> {matched_el_voice_id}")
                    break

        if not matched_el_voice_id:
            raise HTTPException(status_code=400, detail=f"No ElevenLabs voice found matching '{data.heygen_voice_name}'")

        preview_text = clean_script_for_tts(data.script)[:2000] if data.script.strip() else "Hello, this is a voice preview."
        async with httpx.AsyncClient(timeout=60.0) as hclient:
            tts_resp = await hclient.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{matched_el_voice_id}",
                headers={"xi-api-key": ELEVENLABS_API_KEY, "Accept": "audio/mpeg", "Content-Type": "application/json"},
                json={
                    "text": preview_text,
                    "model_id": data.model_id,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True}
                }
            )
            if tts_resp.status_code == 401:
                raise HTTPException(status_code=500, detail="ElevenLabs API key invalid")
            tts_resp.raise_for_status()
            return {"audio_base64": base64.b64encode(tts_resp.content).decode("utf-8"), "matched_voice_name": data.heygen_voice_name}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Script preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/elevenlabs/voices")
async def get_elevenlabs_voices(data: ElevenLabsVoicesRequest, current_user: dict = Depends(get_current_user)):
    try:
        api_key = data.elevenlabs_api_key if data.elevenlabs_api_key else ELEVENLABS_API_KEY
        async with httpx.AsyncClient(timeout=30.0) as hclient:
            resp = await hclient.get("https://api.elevenlabs.io/v1/voices", headers={"xi-api-key": api_key})
            if resp.status_code == 401:
                raise HTTPException(status_code=400, detail="Invalid ElevenLabs API key")
            resp.raise_for_status()
            raw = resp.json().get("voices", [])
            voices = [
                {
                    "voice_id": v.get("voice_id"),
                    "name": v.get("name"),
                    "category": v.get("category", ""),
                    "preview_url": v.get("preview_url"),
                    "labels": v.get("labels", {})
                }
                for v in raw
            ]
            return {"voices": voices, "count": len(voices)}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"ElevenLabs voices error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/elevenlabs/preview")
async def elevenlabs_preview(data: ElevenLabsPreviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        api_key = data.elevenlabs_api_key if data.elevenlabs_api_key else ELEVENLABS_API_KEY
        text = clean_script_for_tts(data.script)[:2000] if data.script.strip() else "Hello, this is a voice preview."
        async with httpx.AsyncClient(timeout=30.0) as hclient:
            resp = await hclient.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{data.elevenlabs_voice_id}",
                headers={"xi-api-key": api_key, "Accept": "audio/mpeg", "Content-Type": "application/json"},
                json={
                    "text": text,
                    "model_id": data.model_id,
                    "voice_settings": {
                        "stability": data.stability,
                        "similarity_boost": data.similarity_boost,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                }
            )
            if resp.status_code == 401:
                raise HTTPException(status_code=400, detail="Invalid ElevenLabs API key")
            resp.raise_for_status()
            return {"audio_base64": base64.b64encode(resp.content).decode("utf-8")}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"ElevenLabs preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/videos/generate-advanced", response_model=VideoResponse)
async def generate_video_advanced(data: VideoCreateAdvanced, current_user: dict = Depends(get_current_user)):
    video = None
    try:
        logging.info(f"generate-advanced called with avatar_id: {data.avatar_id}")
        logging.info(f"voice_mode: {data.voice_mode}, use_el_in_heygen: {data.use_el_in_heygen}")

        if current_user["credits"] < 1:
            raise HTTPException(status_code=400, detail="Insufficient credits")

        if data.voice_mode == "elevenlabs":
            if not data.elevenlabs_api_key:
                raise HTTPException(status_code=400, detail="ElevenLabs API key required")
            if not data.elevenlabs_voice_id:
                raise HTTPException(status_code=400, detail="ElevenLabs voice ID required")

        video = Video(
            user_id=current_user["id"],
            avatar_id=data.avatar_id,
            avatar_name=data.avatar_name,
            title=data.title,
            script=data.script,
            language=data.language,
            duration=data.duration,
            folder_id=data.folder_id,
            status="generating"
        )
        doc = video.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.videos.insert_one(doc)

        # Build voice block
        if data.voice_mode == "elevenlabs":
            asset_id = await _elevenlabs_to_heygen_asset(
                el_api_key=data.elevenlabs_api_key,
                el_voice_id=data.elevenlabs_voice_id,
                script=data.script,
                model_id=data.elevenlabs_model_id,
                stability=data.el_stability,
                similarity_boost=data.el_similarity_boost
            )
            voice_block = {"type": "audio", "audio_asset_id": asset_id}

        elif data.voice_mode == "heygen" and data.use_el_in_heygen:
            matched_el_voice_id = None
            try:
                async with httpx.AsyncClient(timeout=30.0) as el_client:
                    el_resp = await el_client.get(
                        "https://api.elevenlabs.io/v1/voices",
                        headers={"xi-api-key": ELEVENLABS_API_KEY}
                    )
                    el_resp.raise_for_status()
                    el_voices = el_resp.json().get("voices", [])

                search_name = (data.heygen_voice_name or "").lower().strip()
                for v in el_voices:
                    el_name = v.get("name", "").lower().strip()
                    if el_name == search_name or search_name in el_name or el_name in search_name:
                        matched_el_voice_id = v.get("voice_id")
                        logging.info(f"Matched EL voice: {v.get('name')} -> {matched_el_voice_id}")
                        break
            except Exception as e:
                logging.error(f"EL voice match error: {e}")

            if matched_el_voice_id:
                asset_id = await _elevenlabs_to_heygen_asset(
                    el_api_key=ELEVENLABS_API_KEY,
                    el_voice_id=matched_el_voice_id,
                    script=data.script,
                    model_id=data.el_heygen_model,
                    stability=data.el_heygen_stability,
                    similarity_boost=0.75
                )
                voice_block = {"type": "audio", "audio_asset_id": asset_id}
                logging.info(f"Using EL audio asset: {asset_id}")
            else:
                logging.warning(f"No EL voice match for: {data.heygen_voice_name}, falling back to HeyGen voice")
                voice_block = {
                    "type": "text",
                    "input_text": data.script,
                    "voice_id": data.heygen_voice_id or "1bd001e7e50f421d891986aad5158bc8",
                    "speed": 1.0
                }
        elif data.heygen_voice_id:
            voice_block = {"type": "text", "input_text": data.script, "voice_id": data.heygen_voice_id, "speed": 1.0}
        else:
            voice_block = {"type": "text", "input_text": data.script, "voice_id": "1bd001e7e50f421d891986aad5158bc8", "speed": 1.0}

        character_block = {"type": "avatar", "avatar_id": data.avatar_id, "avatar_style": "normal"}
        if data.avatar_engine == "avatar_v":
            character_block["use_avatar_v_model"] = True
        elif data.avatar_engine == "avatar_iv":
            character_block["use_avatar_iv_model"] = True

        payload = {
            "video_inputs": [{
                "character": character_block,
                "voice": voice_block,
                "background": {"type": "color", "value": "#ffffff"}
            }],
            "dimension": {"width": data.width, "height": data.height},
            "caption": data.enable_captions,
            "test": False
        }

        async with httpx.AsyncClient(timeout=60.0) as hclient:
            hg = await hclient.post(
                "https://api.heygen.com/v2/video/generate",
                headers={"X-Api-Key": HEYGEN_API_KEY, "Content-Type": "application/json"},
                json=payload
            )
            logging.info(f"HeyGen video generate status: {hg.status_code}")
            hg.raise_for_status()
            heygen_video_id = hg.json().get("data", {}).get("video_id")

        await db.videos.update_one({"id": video.id}, {"$set": {"heygen_video_id": heygen_video_id}})
        await db.users.update_one({"id": current_user["id"]}, {"$inc": {"credits": -1}})

        if isinstance(video.created_at, str):
            video.created_at = datetime.fromisoformat(video.created_at)

        return VideoResponse(**video.model_dump())

    except HTTPException:
        if video:
            await db.videos.update_one({"id": video.id}, {"$set": {"status": "failed"}})
        raise
    except httpx.HTTPStatusError as e:
        logging.error(f"HeyGen error: {e.response.text}")
        if video:
            await db.videos.update_one({"id": video.id}, {"$set": {"status": "failed"}})
        raise HTTPException(status_code=500, detail=f"Video generation failed: {e.response.text}")
    except Exception as e:
        logging.error(f"Advanced generate error: {e}")
        if video:
            await db.videos.update_one({"id": video.id}, {"$set": {"status": "failed"}})
        raise HTTPException(status_code=500, detail=str(e))

# ============= AUTO STATUS POLLING =============

async def _poll_heygen_videos():
    await _asyncio.sleep(15)
    while True:
        try:
            videos = await db.videos.find(
                {"status": "generating", "heygen_video_id": {"$exists": True, "$ne": None}},
                {"_id": 0, "id": 1, "heygen_video_id": 1}
            ).to_list(20)
            for video in videos:
                hg_id = video.get("heygen_video_id")
                if not hg_id:
                    continue
                try:
                    async with httpx.AsyncClient(timeout=20.0) as hc:
                        resp = await hc.get(
                            f"https://api.heygen.com/v1/video_status.get?video_id={hg_id}",
                            headers={"X-Api-Key": HEYGEN_API_KEY}
                        )
                        data = resp.json().get("data", {})
                        status = data.get("status")
                        video_url = data.get("video_url")
                        thumbnail_url = data.get("thumbnail_url")
                        if status == "completed" and video_url:
                            await db.videos.update_one(
                                {"heygen_video_id": hg_id},
                                {"$set": {"status": "completed", "video_url": video_url, "thumbnail_url": thumbnail_url}}
                            )
                            logging.info(f"Auto-poll: {hg_id} completed")
                        elif status == "failed":
                            await db.videos.update_one(
                                {"heygen_video_id": hg_id},
                                {"$set": {"status": "failed"}}
                            )
                            logging.info(f"Auto-poll: {hg_id} failed")
                except Exception as e:
                    logging.error(f"Poll error for {hg_id}: {e}")
        except Exception as e:
            logging.error(f"Auto-poll loop error: {e}")
        await _asyncio.sleep(30)

# ============= APP SETUP =============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def start_polling():
    _asyncio.create_task(_poll_heygen_videos())