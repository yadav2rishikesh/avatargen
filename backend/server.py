from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAITextToSpeech
import httpx
import base64
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment variables
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
HEYGEN_API_KEY = os.environ.get('HEYGEN_API_KEY')
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY', 'sk_cfa652388dad22ed13e0d36de0a31b235e34a91a2dbd21c8')

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
    role: str = "user"  # user or admin
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
    status: str = "queued"  # queued, generating, completed, failed
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
    tone: str  # Emotional, Energetic, Slow delivery, Fast delivery, Professional

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
    role: str  # user or assistant
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
    # Core fields (same structure as VideoCreate)
    avatar_id: str
    avatar_name: str
    title: str
    script: str
    language: str
    duration: int
    folder_id: Optional[str] = None
    # Voice mode selection
    voice_mode: str = "heygen"
    # "heygen"      = use HeyGen voice (with optional Method A EL)
    # "elevenlabs"  = direct ElevenLabs API (Method B)
    # HeyGen voice fields (voice_mode = "heygen")
    heygen_voice_id: Optional[str] = None
    heygen_voice_name: Optional[str] = None
    use_el_in_heygen: bool = False        # True = imported EL voice in HeyGen
    el_heygen_model: str = "eleven_multilingual_v2"
    el_heygen_stability: float = 0.5     # will be quantized to 0, 0.5, or 1.0
    # Direct ElevenLabs fields (voice_mode = "elevenlabs")
    elevenlabs_api_key: Optional[str] = None
    elevenlabs_voice_id: Optional[str] = None
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    el_stability: float = 0.5
    el_similarity_boost: float = 0.75
    # Avatar engine
    avatar_engine: str = "standard"       # "standard" | "avatar_iv" | "avatar_v"
    # Output
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

# ============= AVATAR ROUTES =============

@api_router.get("/avatars")
async def get_avatars(current_user: dict = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.heygen.com/v2/avatars",
                headers={
                    "X-Api-Key": HEYGEN_API_KEY
                },
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
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-gen-{current_user['id']}-{uuid.uuid4()}",
            system_message="You are a professional scriptwriter for video content. Generate engaging, clear, and concise scripts based on user prompts. Focus on creating content suitable for avatar video presentations."
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
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script-rewrite-{current_user['id']}-{uuid.uuid4()}",
            system_message=f"You are a professional scriptwriter. {instruction}"
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Rewrite this script:\n\n{data.script}")
        response = await chat.send_message(user_message)
        
        return ScriptResponse(script=response)
    except Exception as e:
        logging.error(f"Error rewriting script: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to rewrite script: {str(e)}")

# ============= VOICE PREVIEW ROUTES =============

@api_router.post("/voice/preview", response_model=VoicePreviewResponse)
async def preview_voice(data: VoicePreviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        
        # Use first 500 characters for preview to save costs
        preview_text = data.script[:500]
        
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
        # Check credits
        if current_user["credits"] < 1:
            raise HTTPException(status_code=400, detail="Insufficient credits")
        
        # Create video record
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
        
        # Call HeyGen API to generate video
        async with httpx.AsyncClient() as client:
            heygen_response = await client.post(
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
                    "dimension": {
                        "width": 1280,
                        "height": 720
                    },
                    "test": True  # Set to False for production
                },
                timeout=30.0
            )
            heygen_response.raise_for_status()
            heygen_data = heygen_response.json()
            
            video_id = heygen_data.get("data", {}).get("video_id")
            
            # Update video with HeyGen video ID
            await db.videos.update_one(
                {"id": video.id},
                {"$set": {"heygen_video_id": video_id}}
            )
        
        # Deduct credits
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"credits": -1}}
        )
        
        if isinstance(video.created_at, str):
            video.created_at = datetime.fromisoformat(video.created_at)
        
        return VideoResponse(**video.model_dump())
    except httpx.HTTPStatusError as e:
        logging.error(f"HeyGen API error: {e.response.text}")
        await db.videos.update_one(
            {"id": video.id},
            {"$set": {"status": "failed"}}
        )
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
        
        # Check if user owns the video or is admin
        if video["user_id"] != current_user["id"] and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        # If video is still generating, check HeyGen status
        if video["status"] == "generating" and video.get("heygen_video_id"):
            logging.info(f"Checking HeyGen status for: {video['heygen_video_id']}")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://api.heygen.com/v1/video_status.get?video_id={video['heygen_video_id']}",
                    headers={"X-Api-Key": HEYGEN_API_KEY},
                    timeout=30.0
                )
                response.raise_for_status()
                status_data = response.json()
                logging.info(f"HeyGen response: {status_data}")
                
                heygen_status = status_data.get("data", {}).get("status")
                video_url = status_data.get("data", {}).get("video_url")
                thumbnail_url = status_data.get("data", {}).get("thumbnail_url")
                
                logging.info(f"Parsed - status: {heygen_status}, video_url: {video_url}, thumbnail_url: {thumbnail_url}")
                
                if heygen_status == "completed" and video_url:
                    update_result = await db.videos.update_one(
                        {"id": video_id},
                        {"$set": {
                            "status": "completed",
                            "video_url": video_url,
                            "thumbnail_url": thumbnail_url
                        }}
                    )
                    logging.info(f"MongoDB update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
                    video["status"] = "completed"
                    video["video_url"] = video_url
                    video["thumbnail_url"] = thumbnail_url
                elif heygen_status == "failed":
                    await db.videos.update_one(
                        {"id": video_id},
                        {"$set": {"status": "failed"}}
                    )
                    video["status"] = "failed"
                    logging.info(f"Video marked as failed")
        
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
    
    for video in videos:
        if isinstance(video['created_at'], str):
            video['created_at'] = datetime.fromisoformat(video['created_at'])
    
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
    folder = Folder(
        user_id=current_user["id"],
        name=data.name
    )
    
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
    
    # Remove folder_id from all videos in this folder
    await db.videos.update_many(
        {"folder_id": folder_id},
        {"$set": {"folder_id": None}}
    )
    
    await db.folders.delete_one({"id": folder_id})
    return {"message": "Folder deleted"}

# ============= CHATBOT ROUTES =============

@api_router.post("/chat/message", response_model=ChatResponse)
async def chat_message(data: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        # Save user message
        user_msg = ChatMessage(
            session_id=data.session_id,
            user_id=current_user["id"],
            role="user",
            content=data.message
        )
        user_doc = user_msg.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.chat_messages.insert_one(user_doc)
        
        # Get chat history for context
        history = await db.chat_messages.find(
            {"session_id": data.session_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        
        # Build conversation context
        conversation = "\n".join([
            f"{msg['role']}: {msg['content']}" for msg in history[-10:]
        ])
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=data.session_id,
            system_message="You are a helpful AI assistant for JioGen AI Avatar Video Platform. Help users create video scripts by understanding their needs, suggesting improvements, and generating content. Be conversational and helpful."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=data.message)
        response = await chat.send_message(user_message)
        
        # Save assistant message
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
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"credits": data.credits}}
    )
    
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

# ============= HELPER FUNCTION FOR ELEVENLABS =============

async def _elevenlabs_to_heygen_asset(
    el_api_key: str,
    el_voice_id: str,
    script: str,
    model_id: str = "eleven_multilingual_v2",
    stability: float = 0.5,
    similarity_boost: float = 0.75
) -> str:
    """
    Calls ElevenLabs TTS → uploads MP3 to HeyGen → returns audio_asset_id
    """
    api_key = el_api_key if el_api_key else ELEVENLABS_API_KEY
    async with httpx.AsyncClient(timeout=120.0) as client:
        # 1. Generate audio from ElevenLabs
        el_resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{el_voice_id}",
            headers={
                "xi-api-key": api_key,
                "Accept": "audio/mpeg",
                "Content-Type": "application/json"
            },
            json={
                "text": script,
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

        # 2. Upload MP3 to HeyGen
        hg_resp = await client.post(
            "https://upload.heygen.com/v1/asset",
            headers={
                "X-Api-Key": HEYGEN_API_KEY,
                "Content-Type": "audio/mpeg"
            },
            content=el_resp.content
        )
        logging.info(f"HeyGen asset upload status: {hg_resp.status_code}")
        logging.info(f"HeyGen asset response: {hg_resp.text}")
        hg_resp.raise_for_status()
        asset_id = hg_resp.json().get("data", {}).get("id")
        if not asset_id:
            raise ValueError(f"HeyGen asset upload failed: {hg_resp.json()}")
        return asset_id

# ============= NEW AVATAR V + ELEVENLABS ROUTES =============

@api_router.get("/heygen/voices")
async def get_heygen_voices(current_user: dict = Depends(get_current_user)):
    """Fetch all HeyGen voices including any imported ElevenLabs voices."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
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
async def heygen_tts_preview(
    data: HeyGenTTSRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.heygen.com/v1/audio/text_to_speech",
                headers={
                    "X-Api-Key": HEYGEN_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": data.script[:500],
                    "voice_id": data.voice_id
                }
            )
            resp.raise_for_status()
            result = resp.json()
            # Response can be audio_url or base64
            audio_url = (result.get("data", {}).get("audio_url") or
                        result.get("audio_url") or
                        result.get("data", {}).get("url"))
            audio_b64 = (result.get("data", {}).get("audio") or
                        result.get("audio"))
            return {
                "audio_url": audio_url,
                "audio_base64": audio_b64
            }
    except Exception as e:
        logging.error(f"HeyGen TTS preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/voice/script-preview")
async def voice_script_preview(
    data: ScriptPreviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a voice preview using ElevenLabs by matching the HeyGen voice name.
    Returns base64 audio of the script spoken in the matched ElevenLabs voice.
    """
    try:
        # 1. Fetch ElevenLabs voices and find a match by name
        matched_el_voice_id = None
        async with httpx.AsyncClient(timeout=30.0) as client:
            el_resp = await client.get(
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
            raise HTTPException(
                status_code=400, 
                detail=f"No ElevenLabs voice found matching '{data.heygen_voice_name}'"
            )
        
        # 2. Generate TTS with matched voice (first 500 chars for preview)
        preview_text = data.script[:500] if data.script.strip() else "Hello, this is a voice preview."
        async with httpx.AsyncClient(timeout=60.0) as client:
            tts_resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{matched_el_voice_id}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json"
                },
                json={
                    "text": preview_text,
                    "model_id": data.model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                }
            )
            if tts_resp.status_code == 401:
                raise HTTPException(status_code=500, detail="ElevenLabs API key invalid")
            tts_resp.raise_for_status()
            
            return {
                "audio_base64": base64.b64encode(tts_resp.content).decode("utf-8"),
                "matched_voice_name": data.heygen_voice_name
            }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Script preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/elevenlabs/voices")
async def get_elevenlabs_voices(
    data: ElevenLabsVoicesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Fetch user's ElevenLabs voices. API key only used for this request, never stored."""
    try:
        api_key = data.elevenlabs_api_key if data.elevenlabs_api_key else ELEVENLABS_API_KEY
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": api_key}
            )
            if resp.status_code == 401:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid ElevenLabs API key. Get yours at elevenlabs.io"
                )
            resp.raise_for_status()
            raw = resp.json().get("voices", [])
            voices = [
                {
                    "voice_id": v.get("voice_id"),
                    "name": v.get("name"),
                    "category": v.get("category", ""),
                    "preview_url": v.get("preview_url"),
                    "labels": v.get("labels", {}),
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
async def elevenlabs_preview(
    data: ElevenLabsPreviewRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate ElevenLabs voice preview using first 500 chars. Returns base64 MP3."""
    try:
        api_key = data.elevenlabs_api_key if data.elevenlabs_api_key else ELEVENLABS_API_KEY
        text = data.script[:500] if data.script.strip() else "Hello, this is a voice preview."
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{data.elevenlabs_voice_id}",
                headers={
                    "xi-api-key": api_key,
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json"
                },
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
            return {
                "audio_base64": base64.b64encode(resp.content).decode("utf-8")
            }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"ElevenLabs preview error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/videos/generate-advanced", response_model=VideoResponse)
async def generate_video_advanced(
    data: VideoCreateAdvanced,
    current_user: dict = Depends(get_current_user)
):
    """
    Advanced video generation:
    - Avatar V (use_avatar_v_model: true) — HeyGen April 8 2026
    - Avatar IV (use_avatar_iv_model: true)
    - ElevenLabs Method A: HeyGen-native (elevanlabs_settings)
    - ElevenLabs Method B: Direct API → upload → audio_asset_id
    - 1080p default, captions optional
    Stored in db.videos → auto appears in HistoryPage, status polling works
    """
    video = None
    try:
        logging.info(f"generate-advanced called with avatar_id: {data.avatar_id}")
        logging.info(f"voice_mode: {data.voice_mode}")
        logging.info(f"use_el_in_heygen: {data.use_el_in_heygen}")
        logging.info(f"heygen_voice_name: {data.heygen_voice_name}")
        logging.info(f"heygen_voice_id: {data.heygen_voice_id}")
        
        # Credit check
        if current_user["credits"] < 1:
            raise HTTPException(status_code=400, detail="Insufficient credits")

        # Validate ElevenLabs direct mode inputs
        if data.voice_mode == "elevenlabs":
            if not data.elevenlabs_api_key:
                raise HTTPException(status_code=400, detail="ElevenLabs API key required")
            if not data.elevenlabs_voice_id:
                raise HTTPException(status_code=400, detail="ElevenLabs voice ID required")

        # Create DB record (same pattern as existing generate route)
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
            # Method B: Direct ElevenLabs → upload to HeyGen → use asset
            asset_id = await _elevenlabs_to_heygen_asset(
                el_api_key=data.elevenlabs_api_key,
                el_voice_id=data.elevenlabs_voice_id,
                script=data.script,
                model_id=data.elevenlabs_model_id,
                stability=data.el_stability,
                similarity_boost=data.el_similarity_boost
            )
            voice_block = {
                "type": "audio",
                "audio_asset_id": asset_id
            }
        elif data.voice_mode == "heygen" and data.use_el_in_heygen:
            # New Method: Match voice name to ElevenLabs voice_id
            # then generate audio directly and upload to HeyGen
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
                logging.info(f"Asset ID received: {asset_id}")
                voice_block = {
                    "type": "audio",
                    "audio_asset_id": asset_id
                }
                logging.info(f"Using EL audio asset: {asset_id}")
            else:
                logging.warning(f"No EL voice match for: {data.heygen_voice_name}, using HeyGen voice")
                voice_block = {
                    "type": "text",
                    "input_text": data.script,
                    "voice_id": data.heygen_voice_id or "1bd001e7e50f421d891986aad5158bc8",
                    "speed": 1.0
                }
        elif data.heygen_voice_id:
            # Standard HeyGen voice
            voice_block = {
                "type": "text",
                "input_text": data.script,
                "voice_id": data.heygen_voice_id,
                "speed": 1.0
            }
        else:
            # Default fallback voice
            voice_block = {
                "type": "text",
                "input_text": data.script,
                "voice_id": "1bd001e7e50f421d891986aad5158bc8",
                "speed": 1.0
            }

        # Build character block
        character_block = {
            "type": "avatar",
            "avatar_id": data.avatar_id,
            "avatar_style": "normal"
        }
        if data.avatar_engine == "avatar_v":
            character_block["use_avatar_v_model"] = True
        elif data.avatar_engine == "avatar_iv":
            character_block["use_avatar_iv_model"] = True

        # Build full HeyGen payload
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

        # Call HeyGen API
        async with httpx.AsyncClient(timeout=60.0) as client:
            hg = await client.post(
                "https://api.heygen.com/v2/video/generate",
                headers={
                    "X-Api-Key": HEYGEN_API_KEY,
                    "Content-Type": "application/json"
                },
                json=payload
            )
            logging.info(f"HeyGen video generate status: {hg.status_code}")
            logging.info(f"HeyGen video response: {hg.text}")
            hg.raise_for_status()
            heygen_video_id = hg.json().get("data", {}).get("video_id")

        # Store HeyGen video ID (same pattern as existing route)
        await db.videos.update_one(
            {"id": video.id},
            {"$set": {"heygen_video_id": heygen_video_id}}
        )

        # Deduct 1 credit (same pattern as existing route)
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$inc": {"credits": -1}}
        )

        if isinstance(video.created_at, str):
            video.created_at = datetime.fromisoformat(video.created_at)

        return VideoResponse(**video.model_dump())

    except HTTPException:
        if video:
            await db.videos.update_one(
                {"id": video.id}, {"$set": {"status": "failed"}}
            )
        raise
    except httpx.HTTPStatusError as e:
        logging.error(f"HeyGen error: {e.response.text}")
        if video:
            await db.videos.update_one(
                {"id": video.id}, {"$set": {"status": "failed"}}
            )
        raise HTTPException(
            status_code=500,
            detail=f"Video generation failed: {e.response.text}"
        )
    except Exception as e:
        logging.error(f"Advanced generate error: {e}")
        if video:
            await db.videos.update_one(
                {"id": video.id}, {"$set": {"status": "failed"}}
            )
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()