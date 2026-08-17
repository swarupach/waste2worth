"""Backend regression + feature verification for Waste2Worth."""
import os
import time
import uuid
import base64
import io
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
# Fallback: read from frontend .env if not set in environment
if not BASE_URL:
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

DEMO_USER_ID = "user-demo-0001"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def bottle_b64():
    """Read pre-generated bottle image; regenerate if missing."""
    path = '/tmp/bottle_b64.txt'
    if os.path.exists(path):
        return open(path).read().strip()
    from PIL import Image, ImageDraw
    img = Image.new('RGB', (400, 500), 'skyblue')
    d = ImageDraw.Draw(img)
    d.rectangle([150, 100, 250, 400], fill='lightblue', outline='blue', width=3)
    d.rectangle([170, 60, 230, 110], fill='white', outline='blue', width=2)
    d.ellipse([170, 50, 230, 80], fill='red', outline='darkred')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    return base64.b64encode(buf.getvalue()).decode()


# ---------- Health ----------
def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200


# ---------- Auth / login regression ----------
def test_login_user(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": "user@ecosort.demo", "password": "user123"})
    assert r.status_code == 200
    data = r.json()
    assert data["user"]["id"] == DEMO_USER_ID
    assert data["user"]["role"] == "user"


def test_login_admin(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": "admin@ecosort.demo", "password": "admin123"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "admin"


def test_login_invalid(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": "user@ecosort.demo", "password": "wrong"})
    assert r.status_code == 401
    assert r.json().get("detail") == "Invalid credentials"


# ---------- Login normalization fix (bug reported) ----------
def test_login_messy_email_uppercase_and_spaces(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": "  User@Ecosort.Demo  ", "password": "user123"})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["id"] == DEMO_USER_ID


def test_login_trailing_space_password(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": "user@ecosort.demo", "password": "user123 "})
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "user"


def test_login_unknown_email_401(client):
    r = client.post(f"{BASE_URL}/api/auth/login",
                    json={"email": f"nope_{uuid.uuid4().hex[:6]}@nowhere.demo", "password": "user123"})
    assert r.status_code == 401


def test_register_and_login_roundtrip_normalized(client):
    rand = uuid.uuid4().hex[:8]
    messy_email = f"  RT_{rand}@Waste2Worth.app  "
    normalized_email = f"rt_{rand}@waste2worth.app"
    reg = client.post(f"{BASE_URL}/api/auth/register",
                      json={"name": "RT User", "email": messy_email, "password": " pass1234 "})
    assert reg.status_code == 200, reg.text
    u = reg.json()["user"]
    assert u["ecopoints"] == 20
    assert u["email"] == normalized_email
    # Now login with clean/normalized creds (proves both email + password normalized)
    login = client.post(f"{BASE_URL}/api/auth/login",
                        json={"email": normalized_email, "password": "pass1234"})
    assert login.status_code == 200, login.text
    assert login.json()["user"]["id"] == u["id"]


# ---------- Welcome bonus (new feature) ----------
def test_register_welcome_bonus(client):
    email = f"qa_unique_{uuid.uuid4().hex[:8]}@waste2worth.app"
    r = client.post(f"{BASE_URL}/api/auth/register",
                    json={"name": "QA User", "email": email, "password": "test123"})
    assert r.status_code == 200, r.text
    u = r.json()["user"]
    assert u["ecopoints"] == 20
    assert u["addresses"] == []
    assert u["welcome_bonus"] == 20
    assert u["role"] == "user"


def test_register_duplicate_email(client):
    email = f"qa_dup_{uuid.uuid4().hex[:8]}@waste2worth.app"
    r1 = client.post(f"{BASE_URL}/api/auth/register",
                     json={"name": "QA Dup", "email": email, "password": "test123"})
    assert r1.status_code == 200
    r2 = client.post(f"{BASE_URL}/api/auth/register",
                     json={"name": "QA Dup", "email": email, "password": "test123"})
    assert r2.status_code == 400


def test_register_short_password(client):
    email = f"qa_short_{uuid.uuid4().hex[:8]}@waste2worth.app"
    r = client.post(f"{BASE_URL}/api/auth/register",
                    json={"name": "QA S", "email": email, "password": "abc"})
    assert r.status_code == 400


# ---------- Saved addresses (new feature) ----------
def test_addresses_seed_present(client):
    r = client.get(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}")
    assert r.status_code == 200
    addrs = r.json()
    labels = [a["label"] for a in addrs]
    assert "Home" in labels
    assert "Hostel" in labels


def test_address_add_and_delete(client):
    # add
    r = client.post(f"{BASE_URL}/api/addresses",
                    json={"user_id": DEMO_USER_ID, "label": "Office", "address": "Tech Park"})
    assert r.status_code == 200
    addr = r.json()
    assert addr["label"] == "Office"
    assert addr["address"] == "Tech Park"
    assert "id" in addr
    aid = addr["id"]

    # Verify persisted
    r2 = client.get(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}")
    assert any(a["id"] == aid for a in r2.json())

    # delete
    r3 = client.delete(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}/{aid}")
    assert r3.status_code == 200

    # Verify removed
    r4 = client.get(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}")
    assert not any(a["id"] == aid for a in r4.json())


def test_address_empty_400(client):
    r = client.post(f"{BASE_URL}/api/addresses",
                    json={"user_id": DEMO_USER_ID, "label": "", "address": ""})
    assert r.status_code == 400
    r2 = client.post(f"{BASE_URL}/api/addresses",
                     json={"user_id": DEMO_USER_ID, "label": "X", "address": ""})
    assert r2.status_code == 400


# ---------- Default address (new feature) ----------
def test_default_address_seeded(client):
    r = client.get(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}")
    assert r.status_code == 200
    addrs = r.json()
    home = next((a for a in addrs if a["label"] == "Home"), None)
    hostel = next((a for a in addrs if a["label"] == "Hostel"), None)
    assert home is not None and hostel is not None
    assert home["is_default"] is True
    assert hostel["is_default"] is False


def test_set_default_address_switch(client):
    addrs = client.get(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}").json()
    home = next(a for a in addrs if a["label"] == "Home")
    hostel = next(a for a in addrs if a["label"] == "Hostel")

    # Switch default to Hostel
    r = client.put(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}/{hostel['id']}/default")
    assert r.status_code == 200
    updated = r.json()
    hu = next(a for a in updated if a["id"] == hostel["id"])
    hom = next(a for a in updated if a["id"] == home["id"])
    assert hu["is_default"] is True
    assert hom["is_default"] is False
    # Exactly one default
    assert sum(1 for a in updated if a.get("is_default")) == 1

    # Reset back
    r2 = client.put(f"{BASE_URL}/api/addresses/{DEMO_USER_ID}/{home['id']}/default")
    assert r2.status_code == 200
    reset = r2.json()
    assert next(a for a in reset if a["id"] == home["id"])["is_default"] is True
    assert next(a for a in reset if a["id"] == hostel["id"])["is_default"] is False


def test_set_default_unknown_user_404(client):
    r = client.put(f"{BASE_URL}/api/addresses/nonexistent-user-xyz/some-addr/default")
    assert r.status_code == 404


# ---------- Center favourites (new feature) ----------
def test_favourites_toggle(client):
    centers = client.get(f"{BASE_URL}/api/centers").json()
    assert len(centers) > 0
    cid = centers[0]["id"]

    # ensure clean start
    initial = client.get(f"{BASE_URL}/api/favourites/{DEMO_USER_ID}").json()
    if cid in initial:
        client.post(f"{BASE_URL}/api/favourites", json={"user_id": DEMO_USER_ID, "center_id": cid})

    # add
    r1 = client.post(f"{BASE_URL}/api/favourites", json={"user_id": DEMO_USER_ID, "center_id": cid})
    assert r1.status_code == 200
    favs1 = r1.json()
    assert cid in favs1

    # remove
    r2 = client.post(f"{BASE_URL}/api/favourites", json={"user_id": DEMO_USER_ID, "center_id": cid})
    assert r2.status_code == 200
    favs2 = r2.json()
    assert cid not in favs2

    # ensure empty at end
    final = client.get(f"{BASE_URL}/api/favourites/{DEMO_USER_ID}").json()
    assert cid not in final


def test_favourites_unknown_user_404(client):
    r = client.post(f"{BASE_URL}/api/favourites",
                    json={"user_id": "nonexistent-user-xyz", "center_id": "any"})
    assert r.status_code == 404


def test_get_favourites_returns_list(client):
    r = client.get(f"{BASE_URL}/api/favourites/{DEMO_USER_ID}")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Live Gemini scan (new feature) ----------
def test_scan_live_gemini(client, bottle_b64):
    before = client.get(f"{BASE_URL}/api/me/{DEMO_USER_ID}").json()
    before_pts = before["ecopoints"]

    r = client.post(f"{BASE_URL}/api/scan",
                    json={"user_id": DEMO_USER_ID, "image_base64": bottle_b64},
                    timeout=60)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("item", "confidence", "category", "bin", "instructions",
              "do_not", "safety", "points", "source"):
        assert k in d, f"missing {k}"
    assert d["category"] in ("Biodegradable", "Recyclable", "Hazardous")
    assert isinstance(d["confidence"], int)
    assert d["points"] == 10
    assert d["source"] in ("ai", "fallback")
    # Report actual value
    print(f"\n[SCAN] source={d['source']} item={d['item']} category={d['category']} confidence={d['confidence']}")

    time.sleep(0.5)
    after = client.get(f"{BASE_URL}/api/me/{DEMO_USER_ID}").json()
    assert after["ecopoints"] == before_pts + 10


# ---------- Disposal search regression ----------
def test_disposal_search_phone(client):
    r = client.get(f"{BASE_URL}/api/disposal/search", params={"q": "old mobile phone"})
    assert r.status_code == 200
    d = r.json()
    assert d["category"] == "Hazardous"


# ---------- Centers ----------
def test_centers_list(client):
    r = client.get(f"{BASE_URL}/api/centers")
    assert r.status_code == 200
    centers = r.json()
    assert len(centers) >= 6
    # Coordinates must exist for sort-by-distance to work
    with_coords = [c for c in centers if c.get("lat") and c.get("lng")]
    assert len(with_coords) >= 1
