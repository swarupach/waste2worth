import os
import json
import uuid
import base64
import logging
import random
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ecosort")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


CENTER_COORDS = {
    "GreenCycle Recycling Hub": (28.6139, 77.2090),
    "EcoTech E-Waste Center": (28.6280, 77.2310),
    "City Compost Facility": (28.6050, 77.1990),
    "SafeDispose Hazardous Unit": (28.6350, 77.2250),
    "PaperMill Recovery": (28.6100, 77.2150),
    "ReNew Multi-Waste Depot": (28.5980, 77.2400),
}


CATEGORY_META = {
    "Biodegradable": {"color": "biodegradable", "bin": "Green / Compost Bin", "emoji": "🟢"},
    "Recyclable": {"color": "recyclable", "bin": "Blue Recyclable Bin", "emoji": "🔵"},
    "Hazardous": {"color": "hazardous", "bin": "Red Hazardous Bin", "emoji": "🔴"},
}

WASTE_KB = {
    "plastic": {"category": "Recyclable", "instructions": "Empty and rinse before disposal. Remove caps and place in the recyclable bin.", "do_not": "Do not throw with food waste or burn plastic.", "safety": "Crush bottles to save space. Check for the recycling symbol."},
    "paper": {"category": "Recyclable", "instructions": "Keep dry and clean, then place in the recyclable bin.", "do_not": "Do not recycle greasy or food-soiled paper.", "safety": "Flatten to save space; shred confidential documents."},
    "cardboard": {"category": "Recyclable", "instructions": "Flatten boxes and place in the recyclable bin.", "do_not": "Do not recycle wet or grease-stained cardboard.", "safety": "Remove tape and plastic wrap first."},
    "metal": {"category": "Recyclable", "instructions": "Rinse cans and tins, then place in the recyclable bin.", "do_not": "Do not include paint or chemical cans.", "safety": "Watch out for sharp edges on opened cans."},
    "glass": {"category": "Recyclable", "instructions": "Rinse and place in the glass/recyclable bin.", "do_not": "Do not mix broken glass with regular waste.", "safety": "Wrap broken glass safely before handling."},
    "food": {"category": "Biodegradable", "instructions": "Compost food scraps in the green bin.", "do_not": "Do not mix with plastic or packaging.", "safety": "Use a lined caddy to reduce odour."},
    "organic": {"category": "Biodegradable", "instructions": "Compost in the green bin to create nutrient-rich soil.", "do_not": "Do not add meat/dairy to home compost.", "safety": "Turn compost regularly for best results."},
    "leaves": {"category": "Biodegradable", "instructions": "Add garden leaves to the green/compost bin.", "do_not": "Do not burn leaves; it pollutes the air.", "safety": "Dry leaves make excellent mulch."},
    "battery": {"category": "Hazardous", "instructions": "Take to a hazardous-waste or e-waste drop-off point.", "do_not": "Never put batteries in regular or recycling bins.", "safety": "Tape terminals of lithium batteries before transport."},
    "e-waste": {"category": "Hazardous", "instructions": "Drop off at a certified e-waste recycling center.", "do_not": "Do not throw electronics in household bins.", "safety": "Wipe personal data from devices first."},
    "phone": {"category": "Hazardous", "instructions": "Recycle at an e-waste center; batteries handled separately.", "do_not": "Do not dispose in normal trash.", "safety": "Factory-reset and remove SIM before recycling."},
    "laptop": {"category": "Hazardous", "instructions": "Take to an e-waste recycling facility.", "do_not": "Do not landfill; contains heavy metals.", "safety": "Back up and wipe your data first."},
}


def classify_from_keyword(text: str):
    t = (text or "").lower()
    for key, info in WASTE_KB.items():
        if key in t:
            item = key.title()
            return {"item": item, **info}
    return {"item": text.title() if text else "Mixed Waste", "category": "Recyclable",
            "instructions": "Sort by material type and place in the appropriate recyclable bin.",
            "do_not": "Do not mix hazardous items with recyclables.",
            "safety": "When unsure, check with your local recycling center."}


# ---------------- Models ----------------
class LoginReq(BaseModel):
    email: str
    password: str


class RegisterReq(BaseModel):
    name: str
    email: str
    password: str


class ScanReq(BaseModel):
    user_id: str
    image_base64: str


class PickupReq(BaseModel):
    user_id: str
    category: str
    quantity: str
    address: str
    preferred_date: str
    image_base64: Optional[str] = None


class ReportReq(BaseModel):
    user_id: str
    issue_type: str
    location: str
    description: str
    image_base64: Optional[str] = None


class Center(BaseModel):
    name: str
    location: str
    distance: str
    accepted_categories: List[str]
    accepted_types: str
    hours: str
    phone: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class StatusUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None


class AddressReq(BaseModel):
    user_id: str
    label: str
    address: str


class FavReq(BaseModel):
    user_id: str
    center_id: str


class BinUpdate(BaseModel):
    level: int


# ---------------- Auth ----------------
def clean(doc):
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


@api_router.post("/auth/login")
async def login(req: LoginReq):
    email = req.email.lower().strip()
    password = req.password.strip()
    user = await db.users.find_one({"email": email, "password": password})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    clean(user)
    return {"token": f"demo-{user['id']}-{user['role']}", "user": user}


@api_router.post("/auth/register")
async def register(req: RegisterReq):
    email = req.email.lower().strip()
    if not req.name.strip() or not email or len(req.password.strip()) < 4:
        raise HTTPException(status_code=400, detail="Name, email and a 4+ char password are required")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {"id": str(uuid.uuid4()), "name": req.name.strip(), "email": email,
            "password": req.password.strip(), "role": "user", "ecopoints": 20, "items_segregated": 0,
            "waste_diverted": 0, "community": "Waste2Worth", "addresses": [], "welcome_bonus": 20}
    await db.users.insert_one(dict(user))
    clean(user)
    return {"token": f"demo-{user['id']}-user", "user": user}


@api_router.get("/me/{user_id}")
async def me(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return clean(user)


@api_router.get("/addresses/{user_id}")
async def get_addresses(user_id: str):
    user = await db.users.find_one({"id": user_id})
    return user.get("addresses", []) if user else []


@api_router.post("/addresses")
async def add_address(req: AddressReq):
    if not req.label.strip() or not req.address.strip():
        raise HTTPException(status_code=400, detail="Label and address are required")
    addr = {"id": str(uuid.uuid4()), "label": req.label.strip(), "address": req.address.strip(), "is_default": False}
    await db.users.update_one({"id": req.user_id}, {"$push": {"addresses": addr}})
    return addr


@api_router.delete("/addresses/{user_id}/{addr_id}")
async def del_address(user_id: str, addr_id: str):
    await db.users.update_one({"id": user_id}, {"$pull": {"addresses": {"id": addr_id}}})
    return {"ok": True}


@api_router.put("/addresses/{user_id}/{addr_id}/default")
async def set_default_address(user_id: str, addr_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    addrs = user.get("addresses", [])
    for a in addrs:
        a["is_default"] = (a["id"] == addr_id)
    await db.users.update_one({"id": user_id}, {"$set": {"addresses": addrs}})
    return addrs


@api_router.get("/favourites/{user_id}")
async def get_favourites(user_id: str):
    user = await db.users.find_one({"id": user_id})
    return user.get("favourites", []) if user else []


@api_router.post("/favourites")
async def toggle_favourite(req: FavReq):
    user = await db.users.find_one({"id": req.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    favs = user.get("favourites", [])
    if req.center_id in favs:
        favs.remove(req.center_id)
    else:
        favs.append(req.center_id)
    await db.users.update_one({"id": req.user_id}, {"$set": {"favourites": favs}})
    return favs


# ---------------- Scanner ----------------
async def gemini_classify(image_base64: str):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    b64 = image_base64.split(",", 1)[1] if image_base64.startswith("data:") else image_base64
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"scan-{uuid.uuid4()}",
        system_message=(
            "You are an expert waste-segregation assistant. Identify the primary waste item in the image. "
            "Reply ONLY with strict JSON, no markdown, with keys: item (short name), confidence (integer 60-99), "
            "category (exactly one of 'Biodegradable','Recyclable','Hazardous'), instructions (how to dispose correctly), "
            "do_not (what not to do), safety (a safety/recycling tip)."
        ),
    ).with_model("gemini", "gemini-3-flash-preview")
    msg = UserMessage(text="Identify this waste item and classify it.", file_contents=[ImageContent(image_base64=b64)])
    resp = await chat.send_message(msg)
    text = resp if isinstance(resp, str) else str(resp)
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    data = json.loads(text[text.find("{"): text.rfind("}") + 1])
    if data.get("category") not in CATEGORY_META:
        data["category"] = classify_from_keyword(data.get("item", ""))["category"]
    return data


@api_router.post("/scan")
async def scan(req: ScanReq):
    try:
        result = await gemini_classify(req.image_base64)
        source = "ai"
    except Exception as e:
        logger.warning(f"Gemini scan failed, using fallback: {e}")
        result = {"item": "Plastic Bottle", "confidence": 96, **WASTE_KB["plastic"]}
        source = "fallback"
    cat = result["category"]
    meta = CATEGORY_META[cat]
    points = 10
    scan_doc = {
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "item": result["item"],
        "confidence": int(result.get("confidence", 90)),
        "category": cat,
        "bin": meta["bin"],
        "instructions": result.get("instructions", ""),
        "do_not": result.get("do_not", ""),
        "safety": result.get("safety", ""),
        "points": points,
        "source": source,
        "created_at": now_iso(),
    }
    await db.scans.insert_one(dict(scan_doc))
    await db.users.update_one({"id": req.user_id}, {"$inc": {"ecopoints": points, "items_segregated": 1, "waste_diverted": 1}})
    clean(scan_doc)
    return scan_doc


@api_router.get("/scans/{user_id}")
async def get_scans(user_id: str):
    docs = await db.scans.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [clean(d) for d in docs]


# ---------------- Disposal ----------------
@api_router.get("/disposal/search")
async def disposal_search(q: str):
    info = classify_from_keyword(q)
    meta = CATEGORY_META[info["category"]]
    return {**info, "bin": meta["bin"], "emoji": meta["emoji"]}


@api_router.get("/centers")
async def get_centers(category: Optional[str] = None):
    query = {}
    if category and category != "All":
        query = {"accepted_categories": category}
    docs = await db.centers.find(query).to_list(100)
    return [clean(d) for d in docs]


@api_router.post("/centers")
async def add_center(c: Center):
    doc = {"id": str(uuid.uuid4()), **c.model_dump(), "created_at": now_iso()}
    await db.centers.insert_one(dict(doc))
    return clean(doc)


@api_router.put("/centers/{cid}")
async def edit_center(cid: str, c: Center):
    await db.centers.update_one({"id": cid}, {"$set": c.model_dump()})
    doc = await db.centers.find_one({"id": cid})
    return clean(doc)


@api_router.delete("/centers/{cid}")
async def del_center(cid: str):
    await db.centers.delete_one({"id": cid})
    return {"ok": True}


# ---------------- Pickups ----------------
@api_router.post("/pickups")
async def create_pickup(req: PickupReq):
    user = await db.users.find_one({"id": req.user_id})
    doc = {"id": str(uuid.uuid4()), "user_id": req.user_id, "user_name": user.get("name", "User") if user else "User",
           "category": req.category, "quantity": req.quantity, "address": req.address,
           "preferred_date": req.preferred_date, "has_image": bool(req.image_base64),
           "status": "Submitted", "assigned_to": None, "created_at": now_iso()}
    await db.pickups.insert_one(dict(doc))
    return clean(doc)


@api_router.get("/pickups")
async def list_pickups(user_id: Optional[str] = None):
    query = {"user_id": user_id} if user_id else {}
    docs = await db.pickups.find(query).sort("created_at", -1).to_list(200)
    return [clean(d) for d in docs]


@api_router.put("/pickups/{pid}")
async def update_pickup(pid: str, upd: StatusUpdate):
    fields = {"status": upd.status}
    if upd.assigned_to is not None:
        fields["assigned_to"] = upd.assigned_to
    await db.pickups.update_one({"id": pid}, {"$set": fields})
    if upd.status == "Completed":
        p = await db.pickups.find_one({"id": pid})
        if p:
            await db.users.update_one({"id": p["user_id"]}, {"$inc": {"ecopoints": 20}})
    doc = await db.pickups.find_one({"id": pid})
    return clean(doc)


# ---------------- Reports ----------------
@api_router.post("/reports")
async def create_report(req: ReportReq):
    user = await db.users.find_one({"id": req.user_id})
    doc = {"id": str(uuid.uuid4()), "user_id": req.user_id, "user_name": user.get("name", "User") if user else "User",
           "issue_type": req.issue_type, "location": req.location, "description": req.description,
           "has_image": bool(req.image_base64), "status": "Submitted", "created_at": now_iso()}
    await db.reports.insert_one(dict(doc))
    await db.users.update_one({"id": req.user_id}, {"$inc": {"ecopoints": 5}})
    return clean(doc)


@api_router.get("/reports")
async def list_reports(user_id: Optional[str] = None):
    query = {"user_id": user_id} if user_id else {}
    docs = await db.reports.find(query).sort("created_at", -1).to_list(200)
    return [clean(d) for d in docs]


@api_router.put("/reports/{rid}")
async def update_report(rid: str, upd: StatusUpdate):
    await db.reports.update_one({"id": rid}, {"$set": {"status": upd.status}})
    doc = await db.reports.find_one({"id": rid})
    return clean(doc)


# ---------------- Impact / Leaderboard ----------------
@api_router.get("/impact/{user_id}")
async def impact(user_id: str):
    user = await db.users.find_one({"id": user_id})
    scans = await db.scans.find({"user_id": user_id}).to_list(1000)
    breakdown = {"Biodegradable": 0, "Recyclable": 0, "Hazardous": 0}
    for s in scans:
        breakdown[s.get("category", "Recyclable")] = breakdown.get(s.get("category", "Recyclable"), 0) + 1
    pts = user.get("ecopoints", 0) if user else 0
    achievements = [
        {"name": "First Scan", "icon": "sprout", "unlocked": len(scans) >= 1},
        {"name": "Eco Starter", "icon": "leaf", "unlocked": pts >= 50},
        {"name": "Recycler", "icon": "recycle", "unlocked": len(scans) >= 5},
        {"name": "Eco Champion", "icon": "award", "unlocked": pts >= 1000},
    ]
    return {"ecopoints": pts, "items_segregated": user.get("items_segregated", 0) if user else 0,
            "waste_diverted": user.get("waste_diverted", 0) if user else 0,
            "breakdown": breakdown, "achievements": achievements}


@api_router.get("/leaderboard")
async def leaderboard():
    docs = await db.users.find({"role": "user"}).sort("ecopoints", -1).to_list(20)
    return [{"name": d["name"], "ecopoints": d.get("ecopoints", 0), "community": d.get("community", "EcoSort")} for d in docs]


# ---------------- Smart Bins ----------------
@api_router.get("/smartbins")
async def get_bins():
    docs = await db.smartbins.find().sort("bin_no", 1).to_list(100)
    return [clean(d) for d in docs]


@api_router.put("/smartbins/{bid}")
async def update_bin(bid: str, upd: BinUpdate):
    lvl = max(0, min(100, upd.level))
    status = "Collection Required" if lvl >= 90 else ("Almost Full" if lvl >= 75 else "Normal")
    await db.smartbins.update_one({"id": bid}, {"$set": {"level": lvl, "status": status}})
    doc = await db.smartbins.find_one({"id": bid})
    return clean(doc)


# ---------------- Admin analytics ----------------
@api_router.get("/admin/dashboard")
async def admin_dashboard():
    total_users = await db.users.count_documents({"role": "user"})
    scans = await db.scans.find().to_list(5000)
    cat = {"Biodegradable": 0, "Recyclable": 0, "Hazardous": 0}
    for s in scans:
        cat[s.get("category", "Recyclable")] = cat.get(s.get("category", "Recyclable"), 0) + 1
    pending_pickups = await db.pickups.count_documents({"status": {"$ne": "Completed"}})
    open_reports = await db.reports.count_documents({"status": {"$ne": "Resolved"}})
    return {"total_users": total_users, "total_scanned": len(scans),
            "recyclable": cat["Recyclable"], "biodegradable": cat["Biodegradable"], "hazardous": cat["Hazardous"],
            "waste_diverted": cat["Recyclable"] + cat["Biodegradable"],
            "pending_pickups": pending_pickups, "open_reports": open_reports}


@api_router.get("/admin/analytics")
async def admin_analytics():
    scans = await db.scans.find().to_list(5000)
    cat = {"Biodegradable": 0, "Recyclable": 0, "Hazardous": 0}
    items = {}
    weekly = {}
    for s in scans:
        cat[s.get("category", "Recyclable")] = cat.get(s.get("category", "Recyclable"), 0) + 1
        items[s.get("item", "Other")] = items.get(s.get("item", "Other"), 0) + 1
        day = (s.get("created_at", "") or "")[:10]
        weekly[day] = weekly.get(day, 0) + 1
    top_items = sorted(items.items(), key=lambda x: -x[1])[:6]
    days = sorted(weekly.items())[-7:]
    completed = await db.pickups.count_documents({"status": "Completed"})
    resolved = await db.reports.count_documents({"status": "Resolved"})
    return {
        "category_distribution": [{"name": k, "value": v} for k, v in cat.items()],
        "top_items": [{"name": k, "value": v} for k, v in top_items],
        "daily": [{"date": d[5:], "scans": v} for d, v in days],
        "active_users": await db.users.count_documents({"role": "user"}),
        "completed_pickups": completed, "reports_resolved": resolved,
    }


@api_router.get("/admin/users")
async def admin_users():
    docs = await db.users.find({"role": "user"}).sort("ecopoints", -1).to_list(200)
    return [clean(d) for d in docs]


@api_router.get("/")
async def root():
    return {"message": "Waste2Worth API"}


# ---------------- Seed ----------------
async def seed():
    if await db.users.count_documents({}) > 0:
        return
    logger.info("Seeding EcoSort demo data...")
    demo_user_id = "user-demo-0001"
    admin_id = "admin-demo-0001"
    extra_names = [("Aarav Sharma", 1280, "Green College"), ("Meera Patel", 940, "Green College"),
                   ("Liam Chen", 760, "City University"), ("Sofia Rossi", 610, "City University"),
                   ("Noah Kim", 430, "Green College")]
    users = [
        {"id": demo_user_id, "name": "Riya", "email": "user@ecosort.demo", "password": "user123",
         "role": "user", "ecopoints": 340, "items_segregated": 24, "waste_diverted": 24, "community": "Green College"},
        {"id": admin_id, "name": "Admin", "email": "admin@ecosort.demo", "password": "admin123",
         "role": "admin", "ecopoints": 0, "items_segregated": 0, "waste_diverted": 0, "community": "EcoSort"},
    ]
    for i, (n, p, c) in enumerate(extra_names):
        users.append({"id": f"user-{i+2:04d}", "name": n, "email": f"{n.split()[0].lower()}@ecosort.demo",
                      "password": "user123", "role": "user", "ecopoints": p, "items_segregated": p // 15,
                      "waste_diverted": p // 15, "community": c})
    await db.users.insert_many(users)

    centers = [
        {"name": "GreenCycle Recycling Hub", "location": "MG Road, Sector 12", "distance": "1.2 km",
         "accepted_categories": ["Recyclable"], "accepted_types": "Plastic, Paper, Cardboard, Metal, Glass",
         "hours": "Mon-Sat 9:00 AM - 7:00 PM", "phone": "+911140011223"},
        {"name": "EcoTech E-Waste Center", "location": "Industrial Area, Phase 2", "distance": "3.4 km",
         "accepted_categories": ["Hazardous"], "accepted_types": "E-waste, Batteries, Laptops, Phones",
         "hours": "Mon-Fri 10:00 AM - 6:00 PM", "phone": "+911140055667"},
        {"name": "City Compost Facility", "location": "Lake View Park", "distance": "2.1 km",
         "accepted_categories": ["Biodegradable"], "accepted_types": "Food waste, Leaves, Garden waste",
         "hours": "Daily 8:00 AM - 5:00 PM", "phone": "+911140099001"},
        {"name": "SafeDispose Hazardous Unit", "location": "Ring Road, North Block", "distance": "4.8 km",
         "accepted_categories": ["Hazardous"], "accepted_types": "Batteries, Chemicals, Paint, E-waste",
         "hours": "Mon-Sat 9:30 AM - 5:30 PM", "phone": "+911140022334"},
        {"name": "PaperMill Recovery", "location": "Old Town Market", "distance": "1.9 km",
         "accepted_categories": ["Recyclable"], "accepted_types": "Paper, Cardboard, Books",
         "hours": "Mon-Sat 9:00 AM - 6:00 PM", "phone": "+911140077889"},
        {"name": "ReNew Multi-Waste Depot", "location": "Riverside Avenue", "distance": "5.6 km",
         "accepted_categories": ["Recyclable", "Biodegradable"], "accepted_types": "Plastic, Glass, Organic, Metal",
         "hours": "Daily 8:00 AM - 8:00 PM", "phone": "+911140033445"},
    ]
    await db.centers.insert_many([{"id": str(uuid.uuid4()), **c,
                                   "lat": CENTER_COORDS.get(c["name"], (None, None))[0],
                                   "lng": CENTER_COORDS.get(c["name"], (None, None))[1],
                                   "created_at": now_iso()} for c in centers])

    bins = [
        {"bin_no": 1, "type": "Recyclable", "level": 82, "status": "Almost Full", "location": "Block A Lobby"},
        {"bin_no": 2, "type": "Organic", "level": 56, "status": "Normal", "location": "Cafeteria"},
        {"bin_no": 3, "type": "Hazardous", "level": 94, "status": "Collection Required", "location": "Lab Wing"},
        {"bin_no": 4, "type": "Recyclable", "level": 38, "status": "Normal", "location": "Library"},
        {"bin_no": 5, "type": "Organic", "level": 71, "status": "Normal", "location": "Hostel Mess"},
        {"bin_no": 6, "type": "Hazardous", "level": 22, "status": "Normal", "location": "Workshop"},
    ]
    await db.smartbins.insert_many([{"id": str(uuid.uuid4()), **b} for b in bins])

    # demo scans across last 7 days
    sample_items = [("Plastic Bottle", "plastic"), ("Newspaper", "paper"), ("Banana Peel", "food"),
                    ("Aluminium Can", "metal"), ("Old Phone", "phone"), ("AA Battery", "battery"),
                    ("Glass Jar", "glass"), ("Cardboard Box", "cardboard"), ("Dry Leaves", "leaves")]
    scan_docs = []
    for d in range(7):
        for _ in range(random.randint(2, 5)):
            name, key = random.choice(sample_items)
            info = WASTE_KB[key]
            meta = CATEGORY_META[info["category"]]
            uid = random.choice([demo_user_id] + [f"user-{i+2:04d}" for i in range(len(extra_names))])
            scan_docs.append({"id": str(uuid.uuid4()), "user_id": uid, "item": name,
                              "confidence": random.randint(85, 98), "category": info["category"], "bin": meta["bin"],
                              "instructions": info["instructions"], "do_not": info["do_not"], "safety": info["safety"],
                              "points": 10, "source": "ai",
                              "created_at": (datetime.now(timezone.utc) - timedelta(days=d, hours=random.randint(0, 20))).isoformat()})
    await db.scans.insert_many(scan_docs)

    await db.pickups.insert_many([
        {"id": str(uuid.uuid4()), "user_id": demo_user_id, "user_name": "Riya", "category": "Recyclable",
         "quantity": "2 bags", "address": "Flat 4B, Green College Hostel", "preferred_date": "2026-08-20",
         "has_image": False, "status": "In Progress", "assigned_to": "Team Alpha", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "user_id": "user-0002", "user_name": "Aarav Sharma", "category": "Hazardous",
         "quantity": "1 box e-waste", "address": "Lab Wing 2", "preferred_date": "2026-08-22",
         "has_image": True, "status": "Submitted", "assigned_to": None, "created_at": now_iso()},
    ])
    await db.reports.insert_many([
        {"id": str(uuid.uuid4()), "user_id": demo_user_id, "user_name": "Riya", "issue_type": "Overflowing bin",
         "location": "Cafeteria entrance", "description": "The recyclable bin is overflowing since morning.",
         "has_image": True, "status": "Under Review", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "user_id": "user-0003", "user_name": "Liam Chen", "issue_type": "Illegal dumping",
         "location": "Behind Block C", "description": "Someone dumped construction debris.",
         "has_image": False, "status": "Submitted", "created_at": now_iso()},
    ])
    logger.info("Seeding complete.")


@app.on_event("startup")
async def on_startup():
    await seed()
    # ensure existing centers have coordinates for location-based sorting
    for c in await db.centers.find({"lat": None}).to_list(200):
        if c.get("name") in CENTER_COORDS:
            lat, lng = CENTER_COORDS[c["name"]]
            await db.centers.update_one({"id": c["id"]}, {"$set": {"lat": lat, "lng": lng}})
    # give the demo user a couple of saved addresses (Home = default)
    demo = await db.users.find_one({"id": "user-demo-0001"})
    if demo is not None:
        addrs = demo.get("addresses") or []
        if not addrs:
            addrs = [
                {"id": str(uuid.uuid4()), "label": "Home", "address": "Flat 4B, Green College Hostel", "is_default": True},
                {"id": str(uuid.uuid4()), "label": "Hostel", "address": "Room 210, Block C Hostel", "is_default": False},
            ]
            await db.users.update_one({"id": "user-demo-0001"}, {"$set": {"addresses": addrs}})
        elif not any(a.get("is_default") for a in addrs):
            for i, a in enumerate(addrs):
                a["is_default"] = (i == 0)
            await db.users.update_one({"id": "user-demo-0001"}, {"$set": {"addresses": addrs}})


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
