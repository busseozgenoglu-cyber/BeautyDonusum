from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import base64
import json
import bcrypt
import jwt as pyjwt
import random
import requests as http_requests
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent

# ==================== ENV VALIDATION ====================

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
JWT_SECRET = os.environ.get("JWT_SECRET", "default_secret_change_in_production")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@estetikpusula.app")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# CORS: virgülle ayrılmış origin listesi. Wildcard + credentials birlikte çalışmaz.
ALLOWED_ORIGINS_RAW = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:8081,http://localhost:19006,http://localhost:3000,exp://localhost:8081"
)
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]

JWT_ALGORITHM = "HS256"
DB_NAME = os.environ.get("DB_NAME", "estetik_pusula_db")

client = AsyncIOMotorClient(mongo_url)
db = client[DB_NAME]

# ==================== AUTH HELPERS (before lifespan) ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: str, email: str) -> str:
    return pyjwt.encode(
        {"sub": user_id, "email": email,
         "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"},
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

# ==================== LIFESPAN (replaces on_event) ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — MongoDB bağlantısı başarısız olsa bile uygulama ayakta kalsın
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.analyses.create_index("analysis_id", unique=True)
        await db.analyses.create_index("user_id")

        existing = await db.users.find_one({"email": ADMIN_EMAIL})
        if not existing:
            await db.users.insert_one({
                "user_id": f"user_{uuid.uuid4().hex[:12]}",
                "email": ADMIN_EMAIL,
                "name": "Admin",
                "password_hash": hash_password(ADMIN_PASSWORD),
                "role": "admin", "subscription": "premium",
                "analyses_count": 0, "language": "tr",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            logger.info(f"Admin oluşturuldu: {ADMIN_EMAIL}")
        elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
            logger.info("Admin şifresi güncellendi")

        logger.info("MongoDB bağlantısı başarılı")
    except Exception as e:
        logger.error(f"MongoDB başlangıç hatası (uygulama devam ediyor): {e}")

    logger.info("Uygulama başlatıldı")
    yield
    # Shutdown
    client.close()
    logger.info("Uygulama durduruldu")

# ==================== APP (middleware önce, router sonra) ====================

app = FastAPI(lifespan=lifespan)

# CORS middleware — wildcard origin + credentials birlikte çalışmaz;
# production'da ALLOWED_ORIGINS env değişkenine gerçek domain gir.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    email = data.email.lower().strip()  # her zaman lowercase normalize
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Geçersiz email adresi")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalı")
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id, "email": email, "name": data.name.strip(),
        "password_hash": hash_password(data.password),
        "role": "user", "subscription": "free", "analyses_count": 0,
        "language": "tr", "created_at": datetime.now(timezone.utc).isoformat()
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
    safe = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return {"user": safe, "token": create_token(user["user_id"], email)}

@api_router.get("/auth/me")
async def get_me(request: Request):
    return await get_current_user(request)

@api_router.post("/auth/google-session")
async def google_session(data: SessionRequest):
    try:
        resp = http_requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}, timeout=10
        )
    except Exception as e:
        logger.error(f"Google session fetch error: {e}")
        raise HTTPException(status_code=503, detail="Google auth servisi erişilemiyor")
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
            "user_id": user_id, "email": email,
            "name": g.get("name", "Kullanıcı"), "picture": g.get("picture", ""),
            "role": "user", "subscription": "free", "analyses_count": 0,
            "language": "tr", "created_at": datetime.now(timezone.utc).isoformat()
        })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": user, "token": create_token(user_id, email)}

# ==================== FACE ANALYSIS ====================

FACE_SHAPES = ["oval", "kalp", "kare", "yuvarlak", "elmas", "dikdörtgen"]

FACE_SHAPE_TIPS = {
    "oval": {
        "description": "Oval yüz şekli, en dengeli ve orantılı yüz tiplerinden biridir. Alın ve çene yaklaşık aynı genişlikte, elmacıklar en geniş noktadır.",
        "makeup": "Neredeyse her makyaj trendi size yakışır. Keskin kontur çalışması elmacıkları vurgulayabilir.",
        "hair": "Her saç kesimi size uyar. Katlı kesimler ve dalgalı stiller yüz hatlarınızı güzelleştirir.",
        "glasses": "Kare, dikdörtgen, yuvarlak ve kelebek çerçeveler çok yakışır.",
    },
    "kalp": {
        "description": "Kalp yüz şeklinde alın geniş, çene ise daha dar ve sivridir. Elmacık kemikleri belirgindir.",
        "makeup": "Çene bölgesini aydınlatmak için highlighter kullanın. Alından elmacıklara doğru kontür çekin.",
        "hair": "Çeneye doğru uzanan orta boy kesimler ve yan ayırmalar çok yakışır. Saçı çeneye kadar indirmek yüzü dengeler.",
        "glasses": "Altı geniş çerçeveler (aviator, kelebek) yüzü dengeler. Ağır üst çerçevelerden kaçının.",
    },
    "kare": {
        "description": "Kare yüz şeklinde alın, elmacık ve çene genişlikleri birbirine yakındır. Çene köşeleri belirgindir.",
        "makeup": "Çene köşelerine kontür uygulayarak yumuşatın. Elmacıkları çapraz konturla ön plana çıkarın.",
        "hair": "Uzun, katlı kesimler ve dalgalar yüzü uzatır ve yumuşatır. Saçı yanlardan dolgunlaştırmaktan kaçının.",
        "glasses": "Yuvarlak ve oval çerçeveler sert hatları yumuşatır. Kare ve dikdörtgen çerçevelerden kaçının.",
    },
    "yuvarlak": {
        "description": "Yuvarlak yüz şeklinde en, boy oranı birbirine yakındır ve yüzün dış hatları yuvarlaklık gösterir.",
        "makeup": "Alın ve çeneye kontür yaparak yüzü uzatın. Elmacıkların üstünü aydınlatın.",
        "hair": "Uzun, düz veya hafif dalgalı saçlar yüzü uzatır. Saç üstte hacim, yanlarda yassılık sağlamalı.",
        "glasses": "Dikdörtgen ve kare çerçeveler yüzü uzatır ve güçlü görünüm verir.",
    },
    "elmas": {
        "description": "Elmas yüz şeklinde elmacık kemikleri en geniş noktadır, alın ve çene ise dardır.",
        "makeup": "Alın ve çeneyi aydınlatın, elmacık altına ince kontür çekin.",
        "hair": "Yanlardan dolgunluk katan kesimler ve tam fringe (perçem) dengeyi sağlar.",
        "glasses": "Oval ve kedi gözü çerçeveler elmacıkları dengeler ve zarif görünüm verir.",
    },
    "dikdörtgen": {
        "description": "Dikdörtgen yüz şeklinde yüz boyca uzundur, alın, elmacık ve çene yaklaşık aynı genişliktedir.",
        "makeup": "Alın ve çeneye kontür yaparak yüzü görsel olarak kısaltın. Yatay kontur çizgileri tercih edin.",
        "hair": "Yanlardan dolgun, kısa ve orta boy saçlar yüzü dengeler. Uzun düz saçtan kaçının.",
        "glasses": "Büyük, yuvarlak veya kelebek çerçeveler yüzü dengeler ve kısaltarak gösterir.",
    },
}

PROCEDURE_COSTS_TL = {
    "Rinoplasti": {"min": 80000, "max": 200000, "currency": "TL"},
    "Çene Kontürleme": {"min": 60000, "max": 150000, "currency": "TL"},
    "Mentoplasti": {"min": 50000, "max": 120000, "currency": "TL"},
    "Simetri Düzeltmesi": {"min": 40000, "max": 100000, "currency": "TL"},
    "Blefaroplasti": {"min": 35000, "max": 90000, "currency": "TL"},
    "Lazer Cilt Yenileme": {"min": 5000, "max": 20000, "currency": "TL"},
    "Dudak Dolgusu": {"min": 3000, "max": 8000, "currency": "TL"},
    "Botoks ile Çene İncelme": {"min": 4000, "max": 12000, "currency": "TL"},
    "Alın Botoksu": {"min": 3000, "max": 9000, "currency": "TL"},
    "Elmacık Dolgusu": {"min": 4000, "max": 14000, "currency": "TL"},
    "Koruyucu Bakım": {"min": 500, "max": 2000, "currency": "TL"},
}

def detect_face_shape_from_metrics(metrics: dict) -> str:
    """Metriklerden yüz şeklini tahmin et."""
    jawline = metrics.get("jawline_definition", 0.7)
    cheekbone = metrics.get("cheekbone_prominence", 0.7)
    forehead = metrics.get("forehead_proportion", 0.7)
    chin = metrics.get("chin_projection", 0.7)
    symmetry = metrics.get("symmetry_score", 0.8)

    if cheekbone > 0.82 and chin < 0.62:
        return "elmas"
    elif forehead > 0.80 and chin < 0.65:
        return "kalp"
    elif jawline > 0.82 and symmetry > 0.85:
        return "kare"
    elif jawline < 0.65 and cheekbone < 0.68:
        return "yuvarlak"
    elif forehead < 0.68 and jawline < 0.72:
        return "dikdörtgen"
    else:
        return "oval"

def generate_face_metrics(seed_str: str = "") -> dict:
    """Fallback: AI key yoksa rastgele metrik üret."""
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
    face_shape = detect_face_shape_from_metrics(m)
    m["face_shape"] = face_shape
    return m

async def analyze_face_with_ai(photo_base64: str, category: str) -> dict:
    """GPT-4o Vision ile gerçek yüz analizi yapar."""
    if not OPENAI_API_KEY:
        return generate_face_metrics(photo_base64[:80])

    try:
        import httpx
        cat_text = "cerrahi estetik (ameliyat)" if category == "cerrahi" else "medikal estetik (ameliyatsız)"
        system_prompt = """Sen uzman bir estetik cerrah ve yüz analizi yapay zekasısın.
Verilen yüz fotoğrafını analiz et ve aşağıdaki metrikleri 0.0-1.0 arasında puanla.
face_shape için sadece şu değerlerden birini kullan: oval, kalp, kare, yuvarlak, elmas, dikdörtgen
SADECE geçerli JSON döndür, başka hiçbir şey yazma:
{
  "symmetry_score": 0.0,
  "jawline_definition": 0.0,
  "nose_proportion": 0.0,
  "eye_spacing": 0.0,
  "lip_ratio": 0.0,
  "skin_quality": 0.0,
  "cheekbone_prominence": 0.0,
  "forehead_proportion": 0.0,
  "chin_projection": 0.0,
  "overall_harmony": 0.0,
  "face_shape": "oval"
}"""
        user_prompt = f"Bu yüzü {cat_text} kategorisinde analiz et. Metrikleri gerçekçi ve detaylı değerlendir. Yüz şeklini de belirle."

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o",
                    "max_tokens": 350,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {
                                "url": f"data:image/jpeg;base64,{photo_base64}",
                                "detail": "high"
                            }}
                        ]}
                    ]
                }
            )
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = "\n".join(content.split("\n")[1:-1])
            if content.startswith("json"):
                content = content[4:].strip()
        metrics = json.loads(content)
        face_shape = metrics.pop("face_shape", None)
        # Değerlerin 0-1 arasında olduğunu garantile
        for k in list(metrics.keys()):
            metrics[k] = round(max(0.0, min(1.0, float(metrics[k]))), 2)
        if face_shape and face_shape in FACE_SHAPES:
            metrics["face_shape"] = face_shape
        else:
            metrics["face_shape"] = detect_face_shape_from_metrics(metrics)
        return metrics
    except Exception as e:
        logger.error(f"AI yüz analizi hatası: {e}")
        return generate_face_metrics(photo_base64[:80])

def add_cost_estimate(rec: dict) -> dict:
    title = rec.get("title", "")
    cost = PROCEDURE_COSTS_TL.get(title)
    if cost:
        rec["cost_min_tl"] = cost["min"]
        rec["cost_max_tl"] = cost["max"]
    return rec

def generate_fallback_recommendations(metrics: dict, category: str) -> dict:
    recs = []
    if category == "cerrahi":
        if metrics.get("nose_proportion", 1) < 0.78:
            recs.append({"area": "Burun", "title": "Rinoplasti", "description": "Burun oranlarınız ideal değerlerden sapma gösteriyor. Rinoplasti ile burun yapısı daha dengeli hale getirilebilir.", "reason": f"Burun oranı: {metrics.get('nose_proportion', 0):.2f} (ideal: 0.85+)", "priority": "high", "improvement_potential": 0.85})
        if metrics.get("jawline_definition", 1) < 0.70:
            recs.append({"area": "Çene Hattı", "title": "Çene Kontürleme", "description": "Çene hattınız cerrahi kontürleme ile daha belirgin ve keskin hale getirilebilir.", "reason": f"Çene tanımı: {metrics.get('jawline_definition', 0):.2f} (ideal: 0.80+)", "priority": "high", "improvement_potential": 0.75})
        if metrics.get("chin_projection", 1) < 0.65:
            recs.append({"area": "Çene Ucu", "title": "Mentoplasti", "description": "Çene ucu projeksiyonu güçlendirilerek yüz dengesi iyileştirilebilir.", "reason": f"Çene çıkıntısı: {metrics.get('chin_projection', 0):.2f} (ideal: 0.75+)", "priority": "medium", "improvement_potential": 0.65})
        if metrics.get("symmetry_score", 1) < 0.82:
            recs.append({"area": "Yüz Simetrisi", "title": "Simetri Düzeltmesi", "description": "Yüz simetrinizde hafif dengesizlik tespit edildi.", "reason": f"Simetri: {metrics.get('symmetry_score', 0):.2f} (ideal: 0.90+)", "priority": "medium", "improvement_potential": 0.60})
        if metrics.get("eye_spacing", 1) < 0.75:
            recs.append({"area": "Göz Bölgesi", "title": "Blefaroplasti", "description": "Göz kapağı estetiği ile daha genç ve dinlenmiş bir görünüm.", "reason": f"Göz aralığı: {metrics.get('eye_spacing', 0):.2f} (ideal: 0.85+)", "priority": "low", "improvement_potential": 0.50})
    else:
        if metrics.get("skin_quality", 1) < 0.75:
            recs.append({"area": "Cilt", "title": "Lazer Cilt Yenileme", "description": "Cildiniz profesyonel lazer tedavisi ile önemli ölçüde iyileştirilebilir.", "reason": f"Cilt kalitesi: {metrics.get('skin_quality', 0):.2f} (ideal: 0.85+)", "priority": "high", "improvement_potential": 0.85})
        if metrics.get("lip_ratio", 1) < 0.72:
            recs.append({"area": "Dudak", "title": "Dudak Dolgusu", "description": "Dudak oranlarınız hyalüronik asit dolgusu ile doğal bir şekilde dengelenebilir.", "reason": f"Dudak oranı: {metrics.get('lip_ratio', 0):.2f} (ideal: 0.80+)", "priority": "high", "improvement_potential": 0.75})
        if metrics.get("jawline_definition", 1) < 0.70:
            recs.append({"area": "Çene Hattı", "title": "Botoks ile Çene İncelme", "description": "Masseter botoksu ile çene hattı inceltilerek zarif bir görünüm elde edilebilir.", "reason": f"Çene tanımı: {metrics.get('jawline_definition', 0):.2f} (ideal: 0.80+)", "priority": "medium", "improvement_potential": 0.70})
        if metrics.get("forehead_proportion", 1) < 0.72:
            recs.append({"area": "Alın", "title": "Alın Botoksu", "description": "Alın bölgesinde botoks ile kırışıklıklar giderilerek pürüzsüz görünüm sağlanabilir.", "reason": f"Alın oranı: {metrics.get('forehead_proportion', 0):.2f} (ideal: 0.80+)", "priority": "medium", "improvement_potential": 0.60})
        if metrics.get("cheekbone_prominence", 1) < 0.65:
            recs.append({"area": "Elmacık Kemiği", "title": "Elmacık Dolgusu", "description": "Elmacık kemikleri dolgu ile vurgulanarak yüze hacim kazandırılabilir.", "reason": f"Elmacık: {metrics.get('cheekbone_prominence', 0):.2f} (ideal: 0.75+)", "priority": "low", "improvement_potential": 0.55})
    if not recs:
        recs.append({"area": "Genel", "title": "Koruyucu Bakım", "description": "Yüz metrikleriniz genel olarak iyi durumda.", "reason": "Tüm metrikler kabul edilebilir seviyede", "priority": "low", "improvement_potential": 0.30})
    recs = [add_cost_estimate(r) for r in recs]
    numeric_vals = [v for v in metrics.values() if isinstance(v, (int, float))]
    score = round(sum(numeric_vals) / len(numeric_vals) * 10, 1) if numeric_vals else 7.0
    face_shape = metrics.get("face_shape", "oval")
    shape_tips = FACE_SHAPE_TIPS.get(face_shape, FACE_SHAPE_TIPS["oval"])
    return {
        "summary": f"Yüz analizi tamamlandı. Genel uyum skorunuz {score}/10.",
        "recommendations": recs,
        "overall_score": score,
        "face_shape": face_shape,
        "face_shape_tips": shape_tips,
    }

@api_router.post("/analysis/create")
async def create_analysis(data: AnalysisCreate, request: Request):
    user = await get_current_user(request)
    if data.category not in ("cerrahi", "medikal"):
        raise HTTPException(status_code=400, detail="Geçersiz kategori")
    metrics = await analyze_face_with_ai(data.photo_base64, data.category)
    analysis_id = str(uuid.uuid4())
    doc = {
        "analysis_id": analysis_id, "user_id": user["user_id"],
        "category": data.category, "subcategory": data.subcategory,
        "photo_thumbnail": data.photo_base64[:300] if data.photo_base64 else "",
        "full_photo": data.photo_base64,
        "metrics": metrics, "recommendations": None, "transformation_base64": None,
        "status": "metrics_ready", "is_unlocked": False,
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
    api_key = OPENAI_API_KEY or EMERGENT_LLM_KEY
    if api_key:
        try:
            import httpx
            cat_text = "Cerrahi (Ameliyat gerektiren)" if category == "cerrahi" else "Medikal Estetik (Ameliyatsız)"
            system_msg = f"""Sen deneyimli bir estetik cerrah ve güzellik danışmanısın. Yüz analizi metriklerine göre {cat_text} kategorisinde Türkçe kişiselleştirilmiş öneriler üretiyorsun.
SADECE geçerli JSON döndür:
{{"summary":"...","recommendations":[{{"area":"...","title":"...","description":"...","reason":"...","priority":"high|medium|low","improvement_potential":0.0}}],"overall_score":0.0}}"""
            prompt = f"""Metrikler: simetri={metrics['symmetry_score']}, çene={metrics['jawline_definition']}, burun={metrics['nose_proportion']}, göz={metrics['eye_spacing']}, dudak={metrics['lip_ratio']}, cilt={metrics['skin_quality']}, elmacık={metrics['cheekbone_prominence']}, alın={metrics['forehead_proportion']}, çene_ucu={metrics['chin_projection']}, uyum={metrics['overall_harmony']}
Kategori: {cat_text}
Bu metriklere göre detaylı ve kişiselleştirilmiş Türkçe öneriler üret."""
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o",
                        "max_tokens": 1000,
                        "messages": [
                            {"role": "system", "content": system_msg},
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = "\n".join(content.split("\n")[1:-1])
                if content.startswith("json"):
                    content = content[4:].strip()
            recs_data = json.loads(content)
            # Add cost estimates and face shape to GPT-generated recs too
            if "recommendations" in recs_data:
                recs_data["recommendations"] = [add_cost_estimate(r) for r in recs_data["recommendations"]]
            face_shape = metrics.get("face_shape", detect_face_shape_from_metrics(metrics))
            recs_data["face_shape"] = face_shape
            recs_data["face_shape_tips"] = FACE_SHAPE_TIPS.get(face_shape, FACE_SHAPE_TIPS["oval"])
        except Exception as e:
            logger.error(f"GPT-4o öneri hatası: {e}")
            recs_data = generate_fallback_recommendations(metrics, category)
    else:
        recs_data = generate_fallback_recommendations(metrics, category)
    await db.analyses.update_one({"analysis_id": analysis_id}, {"$set": {"recommendations": recs_data, "status": "completed"}})
    return {"analysis_id": analysis_id, "recommendations": recs_data, "status": "completed"}

@api_router.post("/analysis/{analysis_id}/transform")
async def generate_transformation(analysis_id: str, request: Request):
    user = await get_current_user(request)
    # Taze DB sorgusu — subscription kontrolü için
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    # Premium değilse kesinlikle 403 dön (500 değil)
    if user_doc.get("subscription") != "premium":
        raise HTTPException(status_code=403, detail="Bu özellik premium abonelik gerektirir")
    analysis = await db.analyses.find_one({"analysis_id": analysis_id, "user_id": user["user_id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analiz bulunamadı")
    recs = analysis.get("recommendations") or {}
    rec_list = recs.get("recommendations", [])
    improvements = ", ".join([r.get("title", "") for r in rec_list[:4]])
    category = analysis.get("category", "medikal")
    cat_label = "cerrahi estetik" if category == "cerrahi" else "medikal estetik"
    prompt = (
        f"A professional beauty portrait photo showing ideal results after {cat_label} aesthetic procedures. "
        f"Enhancements applied: {improvements}. "
        "Natural, photorealistic appearance. Soft studio lighting. Subtle 'AI Simulation' watermark in the corner. "
        "High quality professional headshot."
    )
    api_key = OPENAI_API_KEY or EMERGENT_LLM_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="Görsel üretimi için API anahtarı gerekli")
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "response_format": "b64_json",
                    "quality": "standard",
                }
            )
        if not resp.is_success:
            logger.error(f"DALL-E hatası: {resp.status_code} {resp.text[:400]}")
            raise HTTPException(status_code=500, detail="Görsel üretilemedi")
        img_b64 = resp.json()["data"][0]["b64_json"]
        await db.analyses.update_one({"analysis_id": analysis_id}, {"$set": {"transformation_base64": img_b64, "is_unlocked": True}})
        return {"transformation_base64": img_b64, "status": "completed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transform hatası: {e}")
        raise HTTPException(status_code=500, detail=f"Dönüşüm hatası: {str(e)}")

@api_router.get("/analysis/user/history")
async def get_history(request: Request):
    user = await get_current_user(request)
    analyses = await db.analyses.find(
        {"user_id": user["user_id"]},
        {"_id": 0, "full_photo": 0, "transformation_base64": 0}
    ).sort("created_at", -1).to_list(50)
    return {"analyses": analyses}

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

# ==================== SUBSCRIPTION ====================

@api_router.post("/subscription/activate")
async def activate_subscription(data: SubscriptionActivate, request: Request):
    """DEV/TEST: Ödeme doğrulaması olmadan premium aktifleştirir.
    Production'da Apple/Google StoreKit receipt validation eklenmelidir."""
    user = await get_current_user(request)
    if data.plan not in ("premium", "free"):
        raise HTTPException(status_code=400, detail="Geçersiz plan")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"subscription": data.plan, "subscription_activated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return {"message": "Abonelik güncellendi", "user": updated}

@api_router.get("/subscription/status")
async def subscription_status(request: Request):
    user = await get_current_user(request)
    return {"subscription": user.get("subscription", "free"), "user_id": user["user_id"]}

# ==================== USER SETTINGS ====================

@api_router.put("/user/language")
async def update_language(data: LanguagePref, request: Request):
    if data.language not in ("tr", "en"):
        raise HTTPException(status_code=400, detail="Desteklenen diller: tr, en")
    user = await get_current_user(request)
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"language": data.language}})
    return {"language": data.language}

# ==================== PROCEDURE CATALOG ====================

PROCEDURE_CATALOG = [
    {
        "id": "rinoplasti",
        "title": "Rinoplasti",
        "category": "cerrahi",
        "icon": "cut-outline",
        "description": "Burun estetiği, burun şeklini ve oranlarını düzelterek yüz uyumunu artırır. Türkiye'de en çok yapılan estetik operasyonlar arasındadır.",
        "duration_min": 60,
        "duration_max": 180,
        "recovery_days": 14,
        "cost_min_tl": 80000,
        "cost_max_tl": 200000,
        "popularity_pct": 88,
        "risk_level": "orta",
        "benefits": ["Burun oranlarını düzeltir", "Nefes almayı iyileştirebilir", "Yüz simetrisini artırır"],
    },
    {
        "id": "dudak_dolgusu",
        "title": "Dudak Dolgusu",
        "category": "medikal",
        "icon": "sparkles-outline",
        "description": "Hyalüronik asit bazlı dolgu ile dudak hacmi ve şekli iyileştirilir. Etkisi 6-12 ay sürer.",
        "duration_min": 15,
        "duration_max": 30,
        "recovery_days": 1,
        "cost_min_tl": 3000,
        "cost_max_tl": 8000,
        "popularity_pct": 94,
        "risk_level": "düşük",
        "benefits": ["Anında görünür sonuç", "Doğal görünüm", "Kalıcı değil, tersine çevrilebilir"],
    },
    {
        "id": "botoks",
        "title": "Botoks",
        "category": "medikal",
        "icon": "flash-outline",
        "description": "Botulinum toksin enjeksiyonu ile kırışıklıklar düzeltilir ve yüz kasları gevşetilir. 4-6 ay etki süresi.",
        "duration_min": 15,
        "duration_max": 30,
        "recovery_days": 0,
        "cost_min_tl": 3000,
        "cost_max_tl": 12000,
        "popularity_pct": 97,
        "risk_level": "düşük",
        "benefits": ["Hızlı uygulama", "İnce çizgileri giderir", "Önleyici etki"],
    },
    {
        "id": "lazer_cilt",
        "title": "Lazer Cilt Yenileme",
        "category": "medikal",
        "icon": "scan-outline",
        "description": "Lazer teknolojisi ile cilt lekelerini, ince çizgileri ve gözenekleri iyileştirir. Birden fazla seans gerekebilir.",
        "duration_min": 30,
        "duration_max": 60,
        "recovery_days": 3,
        "cost_min_tl": 5000,
        "cost_max_tl": 20000,
        "popularity_pct": 79,
        "risk_level": "düşük",
        "benefits": ["Cilt dokusunu iyileştirir", "Leke ve izleri azaltır", "Gençleştirici etki"],
    },
    {
        "id": "elmacik_dolgusu",
        "title": "Elmacık Dolgusu",
        "category": "medikal",
        "icon": "diamond-outline",
        "description": "Elmacık kemiklerine dolgu uygulanarak yüze hacim ve yükseklik kazandırılır.",
        "duration_min": 20,
        "duration_max": 40,
        "recovery_days": 1,
        "cost_min_tl": 4000,
        "cost_max_tl": 14000,
        "popularity_pct": 72,
        "risk_level": "düşük",
        "benefits": ["Yüze yapı kazandırır", "Yüz hatlarını belirginleştirir", "Gençleştirici etki"],
    },
    {
        "id": "blefaroplasti",
        "title": "Blefaroplasti",
        "category": "cerrahi",
        "icon": "eye-outline",
        "description": "Göz kapağı ameliyatı ile sarkık veya torba oluşmuş göz kapakları düzeltilir.",
        "duration_min": 60,
        "duration_max": 120,
        "recovery_days": 10,
        "cost_min_tl": 35000,
        "cost_max_tl": 90000,
        "popularity_pct": 65,
        "risk_level": "orta",
        "benefits": ["Dinlenmiş görünüm", "Görüş alanı genişler", "Kalıcı sonuç"],
    },
    {
        "id": "mentoplasti",
        "title": "Mentoplasti",
        "category": "cerrahi",
        "icon": "git-branch-outline",
        "description": "Çene ucuna implant veya liposuction ile şekil verilerek yüz profili iyileştirilir.",
        "duration_min": 45,
        "duration_max": 90,
        "recovery_days": 7,
        "cost_min_tl": 50000,
        "cost_max_tl": 120000,
        "popularity_pct": 58,
        "risk_level": "orta",
        "benefits": ["Profil dengesi sağlar", "Kalıcı sonuç", "Boyun hatlarını iyileştirir"],
    },
]

@api_router.get("/procedures")
async def get_procedures(category: Optional[str] = None):
    """Prosedür kataloğunu döndürür. category=cerrahi veya medikal ile filtrelenebilir."""
    if category and category in ("cerrahi", "medikal"):
        return {"procedures": [p for p in PROCEDURE_CATALOG if p["category"] == category]}
    return {"procedures": PROCEDURE_CATALOG}

@api_router.get("/face-shape/{shape}")
async def get_face_shape_tips(shape: str):
    """Belirli bir yüz şekline ait ipuçlarını döndürür."""
    if shape not in FACE_SHAPES:
        raise HTTPException(status_code=400, detail=f"Geçersiz yüz şekli. Geçerli değerler: {', '.join(FACE_SHAPES)}")
    return {"face_shape": shape, "tips": FACE_SHAPE_TIPS[shape]}

# ==================== DAILY TIPS ====================

DAILY_TIPS = [
    {"id": "tip_1", "category": "Cilt Bakımı", "icon": "water-outline", "tip_tr": "Günde en az 2 litre su içmek cilt elastikiyetini artırır ve kırışıklıkları geciktirir.", "tip_en": "Drinking at least 2 liters of water daily improves skin elasticity and delays wrinkles."},
    {"id": "tip_2", "category": "Koruma", "icon": "sunny-outline", "tip_tr": "SPF 50 güneş kremi kullanımı, erken yaşlanmanın %80'ini önleyebilir.", "tip_en": "Using SPF 50 sunscreen can prevent up to 80% of premature aging."},
    {"id": "tip_3", "category": "Gece Bakımı", "icon": "moon-outline", "tip_tr": "Gece serumu uygulayarak cildinizin yenilenme sürecini destekleyin.", "tip_en": "Support your skin's renewal process by applying a night serum."},
    {"id": "tip_4", "category": "Beslenme", "icon": "nutrition-outline", "tip_tr": "C vitamini içeren gıdalar kolajen üretimini artırarak cildi sıkılaştırır.", "tip_en": "Foods rich in vitamin C boost collagen production, tightening the skin."},
    {"id": "tip_5", "category": "Yaşam Tarzı", "icon": "fitness-outline", "tip_tr": "Düzenli egzersiz kan dolaşımını artırarak cilde doğal bir parlaklık verir.", "tip_en": "Regular exercise increases blood circulation, giving skin a natural glow."},
    {"id": "tip_6", "category": "Cilt Bakımı", "icon": "sparkles-outline", "tip_tr": "Haftada 1-2 kez peeling yaparak ölü hücreleri temizleyin.", "tip_en": "Exfoliate 1-2 times a week to remove dead skin cells."},
    {"id": "tip_7", "category": "Beslenme", "icon": "leaf-outline", "tip_tr": "Omega-3 yağ asitleri cilt bariyerini güçlendirerek kuruluğu önler.", "tip_en": "Omega-3 fatty acids strengthen the skin barrier and prevent dryness."},
    {"id": "tip_8", "category": "Koruma", "icon": "shield-outline", "tip_tr": "Mavi ışık filtresi olan nemlendiriciler ekran kaynaklı cilt hasarını azaltır.", "tip_en": "Moisturizers with blue light filters reduce screen-related skin damage."},
    {"id": "tip_9", "category": "Gece Bakımı", "icon": "bed-outline", "tip_tr": "En az 7-8 saat uyumak, cildin gece boyunca yenilenmesi için önemlidir.", "tip_en": "Getting at least 7-8 hours of sleep is essential for overnight skin renewal."},
    {"id": "tip_10", "category": "Yaşam Tarzı", "icon": "happy-outline", "tip_tr": "Stres yönetimi cildiniz için de kritik: meditasyon ve derin nefes deneyin.", "tip_en": "Stress management is critical for skin too: try meditation and deep breathing."},
]

@api_router.get("/daily-tips")
async def get_daily_tips():
    today = datetime.now(timezone.utc)
    tip_index = today.timetuple().tm_yday % len(DAILY_TIPS)
    return {"tip": DAILY_TIPS[tip_index], "all_tips": DAILY_TIPS}

# ==================== BEAUTY ROUTINE ====================

class RoutineEntry(BaseModel):
    routine_type: str  # "morning" or "evening"
    steps_completed: list[str]
    notes: Optional[str] = None

@api_router.post("/routine/log")
async def log_routine(data: RoutineEntry, request: Request):
    user = await get_current_user(request)
    entry = {
        "entry_id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "routine_type": data.routine_type,
        "steps_completed": data.steps_completed,
        "notes": data.notes,
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    await db.routines.insert_one(entry)
    return {"message": "Rutin kaydedildi", "entry": {k: v for k, v in entry.items() if k != "_id"}}

@api_router.get("/routine/history")
async def get_routine_history(request: Request):
    user = await get_current_user(request)
    entries = await db.routines.find(
        {"user_id": user["user_id"]},
        {"_id": 0}
    ).sort("logged_at", -1).to_list(100)

    dates_set = set(e.get("date", "") for e in entries)
    streak = 0
    check_date = datetime.now(timezone.utc).date()
    while check_date.strftime("%Y-%m-%d") in dates_set:
        streak += 1
        check_date = check_date - timedelta(days=1)

    return {"entries": entries, "streak_days": streak, "total_entries": len(entries)}

# ==================== PROGRESS TRACKING ====================

@api_router.get("/progress/summary")
async def get_progress_summary(request: Request):
    user = await get_current_user(request)
    analyses = await db.analyses.find(
        {"user_id": user["user_id"], "status": "completed"},
        {"_id": 0, "full_photo": 0, "transformation_base64": 0}
    ).sort("created_at", 1).to_list(50)

    if len(analyses) < 1:
        return {"has_data": False, "message": "Henüz analiz verisi yok"}

    scores = []
    for a in analyses:
        recs = a.get("recommendations") or {}
        score = recs.get("overall_score")
        if score is None:
            metrics = a.get("metrics", {})
            numeric_vals = [v for v in metrics.values() if isinstance(v, (int, float))]
            score = round(sum(numeric_vals) / len(numeric_vals) * 10, 1) if numeric_vals else None
        if score is not None:
            scores.append({"score": score, "date": a.get("created_at", ""), "category": a.get("category", "")})

    trend = "stable"
    if len(scores) >= 2:
        if scores[-1]["score"] > scores[0]["score"]:
            trend = "improving"
        elif scores[-1]["score"] < scores[0]["score"]:
            trend = "declining"

    return {
        "has_data": True,
        "total_analyses": len(analyses),
        "scores": scores,
        "latest_score": scores[-1]["score"] if scores else None,
        "first_score": scores[0]["score"] if scores else None,
        "trend": trend,
    }

# ==================== HEALTH ====================

@api_router.get("/health")
async def health():
    return {"status": "ok", "app": "estetik-pusula", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== ROUTER ====================

app.include_router(api_router)
