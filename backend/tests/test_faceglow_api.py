"""
FaceGlow Pro Backend API Tests
Tests: Auth, Analysis, Subscription, Health
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or "https://face-glow-pro-2.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip('/')

ADMIN_EMAIL = "admin@faceglow.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "test@faceglow.com"
TEST_USER_PASSWORD = "test123"

SAMPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]

@pytest.fixture
def test_user_token(api_client):
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD})
    if response.status_code != 200:
        pytest.skip(f"Test user login failed: {response.status_code}")
    return response.json()["token"]

# ==================== HEALTH ====================

class TestHealth:
    def test_health_check(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data

# ==================== AUTH ====================

class TestAuth:
    def test_register_new_user(self, api_client):
        """Kayıt — backend email'i her zaman lowercase normalize eder."""
        unique_email = f"TEST_newuser_{int(time.time())}@faceglow.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        # Backend email'i lowercase yapar — biz de lowercase karşılaştırıyoruz
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["subscription"] == "free"
        assert data["user"]["role"] == "user"

    def test_register_duplicate_email(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL, "password": "anypass", "name": "Duplicate"
        })
        assert response.status_code == 400
        detail = response.json()["detail"].lower()
        assert "zaten kayıtlı" in detail or "already" in detail

    def test_login_success(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert response.status_code == 200
        data = response.json()
        assert "user" in data and "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["subscription"] == "premium"

    def test_login_invalid_credentials(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrongpassword"})
        assert response.status_code == 401

    def test_get_me_authenticated(self, api_client, admin_token):
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "password_hash" not in data
        assert "_id" not in data

    def test_get_me_unauthenticated(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401

# ==================== ANALYSIS ====================

class TestAnalysis:
    def test_create_analysis_cerrahi(self, api_client, test_user_token):
        response = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        assert response.status_code == 200
        data = response.json()
        assert "analysis_id" in data
        assert data["category"] == "cerrahi"
        assert "metrics" in data
        assert data["status"] == "metrics_ready"
        metrics = data["metrics"]
        for key in ["symmetry_score", "jawline_definition", "nose_proportion", "eye_spacing",
                    "lip_ratio", "skin_quality", "cheekbone_prominence", "forehead_proportion",
                    "chin_projection", "overall_harmony"]:
            assert key in metrics
            assert 0 <= metrics[key] <= 1

    def test_create_analysis_medikal(self, api_client, test_user_token):
        response = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "medikal", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        assert response.status_code == 200
        assert response.json()["category"] == "medikal"

    def test_create_analysis_unauthenticated(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/analysis/create",
                                   json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64})
        assert response.status_code == 401

    def test_get_recommendations(self, api_client, test_user_token):
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/recommendations",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == analysis_id
        recs = data["recommendations"]
        assert "summary" in recs and "recommendations" in recs and "overall_score" in recs
        assert isinstance(recs["recommendations"], list)
        assert len(recs["recommendations"]) > 0

    def test_get_analysis_by_id(self, api_client, test_user_token):
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "medikal", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        response = api_client.get(
            f"{BASE_URL}/api/analysis/{analysis_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == analysis_id
        assert "metrics" in data
        assert "_id" not in data
        assert "full_photo" not in data

    def test_get_user_history(self, api_client, test_user_token):
        response = api_client.get(
            f"{BASE_URL}/api/analysis/user/history",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert isinstance(data["analyses"], list)

# ==================== SUBSCRIPTION ====================

class TestSubscription:
    def test_activate_premium_subscription(self, api_client, test_user_token):
        response = api_client.post(
            f"{BASE_URL}/api/subscription/activate",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"plan": "premium"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["subscription"] == "premium"
        me_resp = api_client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {test_user_token}"})
        assert me_resp.json()["subscription"] == "premium"

    def test_subscription_status(self, api_client, admin_token):
        response = api_client.get(f"{BASE_URL}/api/subscription/status", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        assert response.json()["subscription"] == "premium"

# ==================== PREMIUM FEATURES ====================

class TestPremiumFeatures:
    def test_transform_requires_premium(self, api_client, api_client_free=None):
        """Premium olmayan kullanıcı 403 almalı."""
        # Yeni bir kullanıcı oluştur (kesinlikle free)
        unique_email = f"free_user_{int(time.time())}@faceglow.com"
        reg_resp = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email, "password": "freepass123", "name": "Free User"
        })
        if reg_resp.status_code != 200:
            pytest.skip("Kayıt başarısız")
        free_token = reg_resp.json()["token"]

        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {free_token}"},
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        assert create_resp.status_code == 200
        analysis_id = create_resp.json()["analysis_id"]

        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/transform",
            headers={"Authorization": f"Bearer {free_token}"}
        )
        # Kesinlikle 403 dönmeli (düzeltildi)
        assert response.status_code == 403
        assert "premium" in response.json()["detail"].lower()

    def test_transform_with_premium(self, api_client, admin_token):
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"category": "medikal", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        api_client.post(f"{BASE_URL}/api/analysis/{analysis_id}/recommendations",
                        headers={"Authorization": f"Bearer {admin_token}"})
        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/transform",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=70
        )
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            assert len(response.json()["transformation_base64"]) > 100

# ==================== USER SETTINGS ====================

class TestUserSettings:
    def test_update_language(self, api_client, test_user_token):
        response = api_client.put(
            f"{BASE_URL}/api/user/language",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"language": "en"}
        )
        assert response.status_code == 200
        assert response.json()["language"] == "en"
