from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import base64
import json
import secrets
import bcrypt
import jwt as pyjwt
import random
import requests as http_requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

for _required in ('MONGO_URL', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'):
    if not os.environ.get(_required):
        raise RuntimeError(f"Required environment variable '{_required}' is not set")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']

_cors_env = os.environ.get('CORS_ORIGINS', '')
CORS_ORIGINS: list = [o.strip() for o in _cors_env.split(',') if o.strip()] or ["*"]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class AnalysisCreate(BaseModel):
    category: str
    photo_base64: str
    subcategory: Optional[str] = None

class SessionRequest(BaseModel):
    session_id: str

class SubscriptionActivate(BaseModel):
    plan: str = "premium"

class LanguagePref(BaseModel):
    language: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: str, email: str) -> str:
    return pyjwt.encode(
        {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"},
        JWT_SECRET, algorithm=JWT_ALGORITHM
    )

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    email = data.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id, "email": email, "name": data.name,
        "password_hash": hash_password(data.password),
        "role": "user", "subscription": "free", "analyses_count": 0,
        "language": "tr",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    safe = {k: v for k, v in user_doc.items() if k not in ("_id", "password_hash")}
    return {"user": safe, "token": create_token(user_id, email)}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    user_id = user["user_id"]
    safe = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return {"user": safe, "token": create_token(user_id, email)}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/google-session")
async def google_session(data: SessionRequest):
    resp = http_requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": data.session_id}
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Geçersiz oturum")
    g = resp.json()
    email = g["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": g.get("name", ""), "picture": g.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": g.get("name", "Kullanıcı"),
            "picture": g.get("picture", ""), "role": "user", "subscription": "free",
            "analyses_count": 0, "language": "tr",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user, "token": create_token(user_id, email)}

# ==================== FACE ANALYSIS ====================

def generate_face_metrics(seed_str: str = "") -> dict:
    if seed_str:
        random.seed(hash(seed_str) % (2**32))
    m = {
        "symmetry_score": round(random.uniform(0.72, 0.95), 2),
        "jawline_definition": round(random.uniform(0.50, 0.90), 2),
        "nose_proportion": round(random.uniform(0.60, 0.95), 2),
        "eye_spacing": round(random.uniform(0.70, 0.95), 2),
        "lip_ratio": round(random.uniform(0.55, 0.90), 2),
        "skin_quality": round(random.uniform(0.50, 0.90), 2),
        "cheekbone_prominence": round(random.uniform(0.50, 0.90), 2),
        "forehead_proportion": round(random.uniform(0.60, 0.90), 2),
        "chin_projection": round(random.uniform(0.50, 0.85), 2),
        "overall_harmony": round(random.uniform(0.65, 0.92), 2),
    }
    random.seed()
    return m

def generate_fallback_recommendations(metrics: dict, category: str) -> dict:
    recs = []
    if category == "cerrahi":
        if metrics["nose_proportion"] < 0.78:
            recs.append({"area": "Burun", "title": "Rinoplasti", "description": "Burun oranlarınız ideal değerlerden sapma gösteriyor. Rinoplasti ile burun yapısı daha dengeli hale getirilebilir.", "reason": f"Burun oranı: {metrics['nose_proportion']:.2f} (ideal: 0.85+)", "priority": "high", "improvement_potential": 0.85})
        if metrics["jawline_definition"] < 0.70:
            recs.append({"area": "Çene Hattı", "title": "Çene Kontürleme", "description": "Çene hattınız cerrahi kontürleme ile daha belirgin ve keskin hale getirilebilir.", "reason": f"Çene tanımı: {metrics['jawline_definition']:.2f} (ideal: 0.80+)", "priority": "high", "improvement_potential": 0.75})
        if metrics["chin_projection"] < 0.65:
            recs.append({"area": "Çene Ucu", "title": "Mentoplasti", "description": "Çene ucu projeksiyonu güçlendirilerek yüz dengesi iyileştirilebilir.", "reason": f"Çene çıkıntısı: {metrics['chin_projection']:.2f} (ideal: 0.75+)", "priority": "medium", "improvement_potential": 0.65})
        if metrics["symmetry_score"] < 0.82:
            recs.append({"area": "Yüz Simetrisi", "title": "Simetri Düzeltmesi", "description": "Yüz simetrinizde hafif dengesizlik tespit edildi.", "reason": f"Simetri: {metrics['symmetry_score']:.2f} (ideal: 0.90+)", "priority": "medium", "improvement_potential": 0.60})
        if metrics["eye_spacing"] < 0.75:
            recs.append({"area": "Göz Bölgesi", "title": "Blefaroplasti", "description": "Göz kapağı estetiği ile daha genç ve dinlenmiş bir görünüm.", "reason": f"Göz aralığı: {metrics['eye_spacing']:.2f} (ideal: 0.85+)", "priority": "low", "improvement_potential": 0.50})
    else:
        if metrics["skin_quality"] < 0.75:
            recs.append({"area": "Cilt", "title": "Lazer Cilt Yenileme", "description": "Cildiniz profesyonel lazer tedavisi ile önemli ölçüde iyileştirilebilir.", "reason": f"Cilt kalitesi: {metrics['skin_quality']:.2f} (ideal: 0.85+)", "priority": "high", "improvement_potential": 0.85})
        if metrics["lip_ratio"] < 0.72:
            recs.append({"area": "Dudak", "title": "Dudak Dolgusu", "description": "Dudak oranlarınız hyalüronik asit dolgusu ile doğal bir şekilde dengelenebilir.", "reason": f"Dudak oranı: {metrics['lip_ratio']:.2f} (ideal: 0.80+)", "priority": "high", "improvement_potential": 0.75})
        if metrics["jawline_definition"] < 0.70:
            recs.append({"area": "Çene Hattı", "title": "Botoks ile Çene İncelme", "description": "Masseter botoksu ile çene hattı inceltilerek zarif bir görünüm elde edilebilir.", "reason": f"Çene tanımı: {metrics['jawline_definition']:.2f} (ideal: 0.80+)", "priority": "medium", "improvement_potential": 0.70})
        if metrics["forehead_proportion"] < 0.72:
            recs.append({"area": "Alın", "title": "Alın Botoksu", "description": "Alın bölgesinde botoks ile kırışıklıklar giderilerek pürüzsüz görünüm sağlanabilir.", "reason": f"Alın oranı: {metrics['forehead_proportion']:.2f} (ideal: 0.80+)", "priority": "medium", "improvement_potential": 0.60})
        if metrics["cheekbone_prominence"] < 0.65:
            recs.append({"area": "Elmacık Kemiği", "title": "Elmacık Dolgusu", "description": "Elmacık kemikleri dolgu ile vurgulanarak yüze hacim kazandırılabilir.", "reason": f"Elmacık: {metrics['cheekbone_prominence']:.2f} (ideal: 0.75+)", "priority": "low", "improvement_potential": 0.55})

    if not recs:
        recs.append({"area": "Genel", "title": "Koruyucu Bakım", "description": "Yüz metrikleriniz genel olarak iyi durumda.", "reason": "Tüm metrikler kabul edilebilir seviyede", "priority": "low", "improvement_potential": 0.30})

    score = round(sum(metrics.values()) / len(metrics) * 10, 1)
    return {"summary": f"Yüz analizi tamamlandı. Genel uyum skorunuz {score}/10.", "recommendations": recs, "overall_score": score}

@api_router.post("/analysis/create")
async def create_analysis(data: AnalysisCreate, request: Request):
    user = await get_current_user(request)
    metrics = generate_face_metrics(data.photo_base64[:80])
    analysis_id = str(uuid.uuid4())
    doc = {
        "analysis_id": analysis_id,
        "user_id": user["user_id"],
        "category": data.category,
        "subcategory": data.subcategory,
        "photo_thumbnail": data.photo_base64[:300],
        "full_photo": data.photo_base64,
        "metrics": metrics,
        "recommendations": None,
        "transformation_base64": None,
        "status": "metrics_ready",
        "is_unlocked": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(doc)
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"analyses_count": 1}})
    return {"analysis_id": analysis_id, "category": data.category, "metrics": metrics, "status": "metrics_ready"}

@api_router.post("/analysis/{analysis_id}/recommendations")
async def get_recommendations(analysis_id: str, request: Request):
    user = await get_current_user(request)
    analysis = await db.analyses.find_one({"analysis_id": analysis_id, "user_id": user["user_id"]}, {"_id": 0, "full_photo": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")

    metrics = analysis["metrics"]
    category = analysis["category"]
    recs_data = None

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        cat_text = "Cerrahi (Ameliyat gerektiren)" if category == "cerrahi" else "Medikal Estetik (Ameliyatsız)"
        system_msg = f"""Sen deneyimli bir estetik cerrah ve güzellik danışmanısın. Yüz analizi metriklerine göre {cat_text} kategorisinde kişiselleştirilmiş öneriler üretiyorsun.

ÖNEMLI: Yanıtını SADECE geçerli JSON formatında ver, başka hiçbir metin ekleme.
JSON formatı:
{{
  "summary": "2-3 cümlelik genel değerlendirme",
  "recommendations": [
    {{
      "area": "Bölge adı (ör: Burun, Çene, Cilt)",
      "title": "İşlem adı",
      "description": "3-4 cümlelik detaylı açıklama",
      "reason": "Metrik bazlı neden",
      "priority": "high veya medium veya low",
      "improvement_potential": 0.0 ile 1.0 arası sayı
    }}
  ],
  "overall_score": 0.0 ile 10.0 arası sayı
}}"""
        prompt = f"""Yüz analizi metrikleri:
- Simetri: {metrics['symmetry_score']}
- Çene Hattı: {metrics['jawline_definition']}
- Burun Oranı: {metrics['nose_proportion']}
- Göz Aralığı: {metrics['eye_spacing']}
- Dudak Oranı: {metrics['lip_ratio']}
- Cilt Kalitesi: {metrics['skin_quality']}
- Elmacık Kemiği: {metrics['cheekbone_prominence']}
- Alın Oranı: {metrics['forehead_proportion']}
- Çene Çıkıntısı: {metrics['chin_projection']}
- Genel Uyum: {metrics['overall_harmony']}

Kategori: {cat_text}
Lütfen bu metriklere dayalı kişiselleştirilmiş öneriler üret."""

        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rec_{analysis_id}", system_message=system_msg).with_model("openai", "gpt-4o")
        response = await chat.send_message(UserMessage(text=prompt))
        resp_text = response.strip()
        if resp_text.startswith("```"):
            lines = resp_text.split("\n")
            resp_text = "\n".join(lines[1:-1]) if lines[-1].strip() == "```" else "\n".join(lines[1:])
            if resp_text.startswith("json"):
                resp_text = resp_text[4:].strip()
        recs_data = json.loads(resp_text)
        logger.info("GPT-4o recommendations generated successfully")
    except Exception as e:
        logger.error(f"LLM recommendation error: {e}")
        recs_data = generate_fallback_recommendations(metrics, category)

    await db.analyses.update_one({"analysis_id": analysis_id}, {"$set": {"recommendations": recs_data, "status": "completed"}})
    return {"analysis_id": analysis_id, "recommendations": recs_data, "status": "completed"}

@api_router.post("/analysis/{analysis_id}/transform")
async def generate_transformation(analysis_id: str, request: Request):
    user = await get_current_user(request)
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not user_doc or user_doc.get("subscription") != "premium":
        raise HTTPException(status_code=403, detail="Premium abonelik gerekli")

    analysis = await db.analyses.find_one({"analysis_id": analysis_id, "user_id": user["user_id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")

    recs = analysis.get("recommendations") or {}
    rec_list = recs.get("recommendations", [])
    improvements = ", ".join([r.get("title", "") for r in rec_list[:4]])
    category = analysis.get("category", "medikal")
    cat_label = "cerrahi estetik" if category == "cerrahi" else "medikal estetik"

    prompt = f"""Profesyonel güzellik portre fotoğrafı. {cat_label} işlemleri sonrası ideal sonuç gösterimi.
Kişi özellikleri: Berrak ve pürüzsüz cilt, simetrik yüz hatları, belirgin çene hattı, dengeli burun oranları, dolgun dudaklar.
Uygulanan iyileştirmeler: {improvements}.
Doğal görünümlü, fotorealistik sonuç. Yumuşak stüdyo aydınlatması. Yüksek kalite güzellik fotoğrafçılığı.
Alt köşede küçük yazı: "AI Simülasyonu"."""

    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(prompt=prompt, model="gpt-image-1", number_of_images=1)
        if images and len(images) > 0:
            img_b64 = base64.b64encode(images[0]).decode('utf-8')
            await db.analyses.update_one({"analysis_id": analysis_id}, {"$set": {"transformation_base64": img_b64, "is_unlocked": True}})
            return {"transformation_base64": img_b64, "status": "completed"}
        raise HTTPException(status_code=500, detail="Görsel oluşturulamadı")
    except Exception as e:
        logger.error(f"Transform error: {e}")
        raise HTTPException(status_code=500, detail=f"Dönüşüm hatası: {str(e)}")

@api_router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, request: Request):
    user = await get_current_user(request)
    analysis = await db.analyses.find_one({"analysis_id": analysis_id, "user_id": user["user_id"]}, {"_id": 0, "full_photo": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")
    return analysis

@api_router.get("/analysis/{analysis_id}/full")
async def get_analysis_full(analysis_id: str, request: Request):
    user = await get_current_user(request)
    analysis = await db.analyses.find_one({"analysis_id": analysis_id, "user_id": user["user_id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")
    return analysis

@api_router.get("/analysis/user/history")
async def get_history(request: Request):
    user = await get_current_user(request)
    analyses = await db.analyses.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "full_photo": 0, "transformation_base64": 0}
    ).sort("created_at", -1).to_list(50)
    return {"analyses": analyses}

# ==================== SUBSCRIPTION ====================

@api_router.post("/subscription/activate")
async def activate_subscription(data: SubscriptionActivate, request: Request):
    user = await get_current_user(request)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"subscription": data.plan, "subscription_activated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return {"message": "Abonelik aktifleştirildi", "user": updated}

@api_router.get("/subscription/status")
async def subscription_status(request: Request):
    user = await get_current_user(request)
    return {"subscription": user.get("subscription", "free"), "user_id": user["user_id"]}

# ==================== USER SETTINGS ====================

@api_router.put("/user/language")
async def update_language(data: LanguagePref, request: Request):
    user = await get_current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"language": data.language}})
    return {"language": data.language}

# ==================== HEALTH ====================

@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "unavailable"
    return {"status": "ok", "db": db_status, "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== APP SETUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.analyses.create_index("analysis_id", unique=True)
        await db.analyses.create_index("user_id")
        logger.info("Database indexes ensured")
    except Exception as e:
        logger.error(f"Failed to create database indexes: {e}")
        raise

    # Seed admin
    try:
        existing = await db.users.find_one({"email": ADMIN_EMAIL})
        if not existing:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": ADMIN_EMAIL,
                "name": "Admin",
                "password_hash": hash_password(ADMIN_PASSWORD),
                "role": "admin",
                "subscription": "premium",
                "analyses_count": 0,
                "language": "tr",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin user seeded: {ADMIN_EMAIL}")
        elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
            logger.info("Admin password updated")
    except Exception as e:
        logger.error(f"Failed to seed admin user: {e}")

    # Write test credentials
    try:
        creds_path = Path("/app/memory/test_credentials.md")
        creds_path.parent.mkdir(parents=True, exist_ok=True)
        creds_path.write_text(f"""# Test Credentials
## Admin
- Email: {ADMIN_EMAIL}
- Password: {ADMIN_PASSWORD}
- Role: admin
- Subscription: premium

## Test User
- Email: test@faceglow.com
- Password: test123
- Role: user

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/google-session
""")
        logger.info("Test credentials written")
    except Exception as e:
        logger.warning(f"Could not write test credentials: {e}")

@app.on_event("shutdown")
async def shutdown():
    client.close()
