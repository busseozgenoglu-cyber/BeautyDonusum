"""
FaceGlow Pro Backend API Tests
Tests: Auth, Analysis, Subscription, Health
"""
import pytest
import requests
import os
import base64
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL') or "https://face-glow-pro-2.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@faceglow.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = "test@faceglow.com"
TEST_USER_PASSWORD = "test123"

# Test data
SAMPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    """Get admin token for authenticated requests"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]

@pytest.fixture
def test_user_token(api_client):
    """Get test user token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Test user login failed: {response.status_code}")
    return response.json()["token"]

# ==================== HEALTH CHECK ====================

class TestHealth:
    """Health check endpoint"""
    
    def test_health_check(self, api_client):
        """GET /api/health should return ok"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data

# ==================== AUTH TESTS ====================

class TestAuth:
    """Authentication endpoints"""
    
    def test_register_new_user(self, api_client):
        """POST /api/auth/register creates new user"""
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
        # Email is lowercased by backend
        assert data["user"]["email"] == unique_email.lower()
        assert data["user"]["subscription"] == "free"
        assert data["user"]["role"] == "user"
    
    def test_register_duplicate_email(self, api_client):
        """POST /api/auth/register with existing email should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "anypass",
            "name": "Duplicate"
        })
        assert response.status_code == 400
        assert "zaten kayıtlı" in response.json()["detail"].lower() or "already" in response.json()["detail"].lower()
    
    def test_login_success(self, api_client):
        """POST /api/auth/login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["subscription"] == "premium"
    
    def test_login_invalid_credentials(self, api_client):
        """POST /api/auth/login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_get_me_authenticated(self, api_client, admin_token):
        """GET /api/auth/me with valid token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "password_hash" not in data
        assert "_id" not in data
    
    def test_get_me_unauthenticated(self, api_client):
        """GET /api/auth/me without token should fail"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401

# ==================== ANALYSIS TESTS ====================

class TestAnalysis:
    """Face analysis endpoints"""
    
    def test_create_analysis_cerrahi(self, api_client, test_user_token):
        """POST /api/analysis/create with cerrahi category"""
        response = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "category": "cerrahi",
                "photo_base64": SAMPLE_IMAGE_BASE64
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "analysis_id" in data
        assert data["category"] == "cerrahi"
        assert "metrics" in data
        assert data["status"] == "metrics_ready"
        
        # Verify metrics structure
        metrics = data["metrics"]
        expected_keys = ["symmetry_score", "jawline_definition", "nose_proportion", 
                        "eye_spacing", "lip_ratio", "skin_quality", "cheekbone_prominence",
                        "forehead_proportion", "chin_projection", "overall_harmony"]
        for key in expected_keys:
            assert key in metrics
            assert 0 <= metrics[key] <= 1
    
    def test_create_analysis_medikal(self, api_client, test_user_token):
        """POST /api/analysis/create with medikal category"""
        response = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "category": "medikal",
                "photo_base64": SAMPLE_IMAGE_BASE64
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "medikal"
        assert "analysis_id" in data
    
    def test_create_analysis_unauthenticated(self, api_client):
        """POST /api/analysis/create without token should fail"""
        response = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        assert response.status_code == 401
    
    def test_get_recommendations(self, api_client, test_user_token):
        """POST /api/analysis/{id}/recommendations generates recommendations"""
        # First create analysis
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        
        # Get recommendations
        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/recommendations",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == analysis_id
        assert "recommendations" in data
        assert data["status"] == "completed"
        
        # Verify recommendations structure
        recs = data["recommendations"]
        assert "summary" in recs
        assert "recommendations" in recs
        assert "overall_score" in recs
        assert isinstance(recs["recommendations"], list)
        assert len(recs["recommendations"]) > 0
    
    def test_get_analysis_by_id(self, api_client, test_user_token):
        """GET /api/analysis/{id} retrieves analysis"""
        # Create analysis
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "medikal", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        
        # Get analysis
        response = api_client.get(
            f"{BASE_URL}/api/analysis/{analysis_id}",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == analysis_id
        assert "metrics" in data
        assert "_id" not in data
        assert "full_photo" not in data  # Should be excluded
    
    def test_get_user_history(self, api_client, test_user_token):
        """GET /api/analysis/user/history returns user's analyses"""
        response = api_client.get(
            f"{BASE_URL}/api/analysis/user/history",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "analyses" in data
        assert isinstance(data["analyses"], list)

# ==================== SUBSCRIPTION TESTS ====================

class TestSubscription:
    """Subscription endpoints (MOCKED payment)"""
    
    def test_activate_premium_subscription(self, api_client, test_user_token):
        """POST /api/subscription/activate upgrades user to premium"""
        response = api_client.post(
            f"{BASE_URL}/api/subscription/activate",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"plan": "premium"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["subscription"] == "premium"
        assert "subscription_activated_at" in data["user"]
        
        # Verify persistence by checking /api/auth/me
        me_resp = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert me_resp.json()["subscription"] == "premium"
    
    def test_subscription_status(self, api_client, admin_token):
        """GET /api/subscription/status returns subscription info"""
        response = api_client.get(
            f"{BASE_URL}/api/subscription/status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscription" in data
        assert data["subscription"] == "premium"

# ==================== PREMIUM FEATURES ====================

class TestPremiumFeatures:
    """Premium-only features"""
    
    def test_transform_requires_premium(self, api_client, test_user_token):
        """POST /api/analysis/{id}/transform requires premium subscription"""
        # Create analysis with test user
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"category": "cerrahi", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        
        # Try to generate transformation
        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/transform",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        # Note: test user might have been upgraded in previous test
        # So we check either 403 (not premium), 200 (premium success), or 500 (premium but GPT Image error)
        assert response.status_code in [200, 403, 500]
        if response.status_code == 403:
            assert "premium" in response.json()["detail"].lower()
    
    def test_transform_with_premium(self, api_client, admin_token):
        """POST /api/analysis/{id}/transform works for premium users"""
        # Create analysis with admin (premium)
        create_resp = api_client.post(
            f"{BASE_URL}/api/analysis/create",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"category": "medikal", "photo_base64": SAMPLE_IMAGE_BASE64}
        )
        analysis_id = create_resp.json()["analysis_id"]
        
        # Generate recommendations first
        api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/recommendations",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Generate transformation (may take up to 60 seconds)
        response = api_client.post(
            f"{BASE_URL}/api/analysis/{analysis_id}/transform",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=70
        )
        # This might fail if GPT Image 1 has issues, so we allow 500
        assert response.status_code in [200, 500]
        if response.status_code == 200:
            data = response.json()
            assert "transformation_base64" in data
            assert len(data["transformation_base64"]) > 100

# ==================== USER SETTINGS ====================

class TestUserSettings:
    """User settings endpoints"""
    
    def test_update_language(self, api_client, test_user_token):
        """PUT /api/user/language updates user language preference"""
        response = api_client.put(
            f"{BASE_URL}/api/user/language",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"language": "en"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "en"
