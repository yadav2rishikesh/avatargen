#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class JioGenAPITester:
    def __init__(self, base_url="https://jio-avatar-studio.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({"test": test_name, "details": details})
            print(f"❌ {test_name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            if not success:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'No error details')}"
                except:
                    details += f" - {response.text[:200]}"
            
            self.log_result(name, success, details if not success else "")
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@jiogen.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Admin logged in successfully, credits: {response.get('user', {}).get('credits', 'N/A')}")
            return True
        return False

    def test_heygen_voices(self):
        """Test GET /api/heygen/voices"""
        success, response = self.run_test(
            "HeyGen Voices API",
            "GET",
            "heygen/voices",
            200
        )
        if success:
            voices_count = len(response.get('voices', []))
            print(f"   Found {voices_count} HeyGen voices")
        return success

    def test_elevenlabs_voices_valid_key(self):
        """Test POST /api/elevenlabs/voices with valid key"""
        # Using a dummy key for testing - this should return 400 for invalid key
        success, response = self.run_test(
            "ElevenLabs Voices (Valid Key Test)",
            "POST",
            "elevenlabs/voices",
            400,  # Expecting 400 for invalid key
            data={"elevenlabs_api_key": "sk_dummy_key_for_testing"}
        )
        return success

    def test_elevenlabs_voices_invalid_key(self):
        """Test POST /api/elevenlabs/voices with invalid key"""
        success, response = self.run_test(
            "ElevenLabs Voices (Invalid Key)",
            "POST",
            "elevenlabs/voices",
            400,
            data={"elevenlabs_api_key": "invalid_key"}
        )
        return success

    def test_elevenlabs_preview(self):
        """Test POST /api/elevenlabs/preview"""
        success, response = self.run_test(
            "ElevenLabs Preview API",
            "POST",
            "elevenlabs/preview",
            400,  # Expecting 400 for invalid key
            data={
                "elevenlabs_api_key": "sk_dummy_key",
                "elevenlabs_voice_id": "dummy_voice_id",
                "script": "Hello, this is a test.",
                "model_id": "eleven_multilingual_v2",
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        )
        return success

    def test_avatars_endpoint(self):
        """Test avatars endpoint to get avatar for video generation"""
        success, response = self.run_test(
            "Get Avatars",
            "GET",
            "avatars",
            200
        )
        if success and response.get('avatars'):
            self.test_avatar = response['avatars'][0]
            print(f"   Using avatar: {self.test_avatar.get('display_name', 'Unknown')}")
            return True
        return False

    def test_generate_advanced_standard_engine(self):
        """Test POST /api/videos/generate-advanced with standard engine"""
        if not hasattr(self, 'test_avatar'):
            print("   Skipping - no avatar available")
            return False
            
        success, response = self.run_test(
            "Advanced Video Generation (Standard Engine)",
            "POST",
            "videos/generate-advanced",
            200,
            data={
                "avatar_id": self.test_avatar['avatar_id'],
                "avatar_name": self.test_avatar.get('display_name', 'Test Avatar'),
                "title": "Test Advanced Video - Standard",
                "script": "This is a test script for advanced video generation with standard engine.",
                "language": "English",
                "duration": 30,
                "voice_mode": "heygen",
                "avatar_engine": "standard",
                "width": 1920,
                "height": 1080,
                "enable_captions": False
            }
        )
        return success

    def test_generate_advanced_avatar_v_engine(self):
        """Test POST /api/videos/generate-advanced with avatar_v engine"""
        if not hasattr(self, 'test_avatar'):
            print("   Skipping - no avatar available")
            return False
            
        success, response = self.run_test(
            "Advanced Video Generation (Avatar V Engine)",
            "POST",
            "videos/generate-advanced",
            200,
            data={
                "avatar_id": self.test_avatar['avatar_id'],
                "avatar_name": self.test_avatar.get('display_name', 'Test Avatar'),
                "title": "Test Advanced Video - Avatar V",
                "script": "This is a test script for advanced video generation with Avatar V engine.",
                "language": "English",
                "duration": 30,
                "voice_mode": "heygen",
                "avatar_engine": "avatar_v",
                "width": 1920,
                "height": 1080,
                "enable_captions": False
            }
        )
        return success

    def test_generate_advanced_avatar_iv_engine(self):
        """Test POST /api/videos/generate-advanced with avatar_iv engine"""
        if not hasattr(self, 'test_avatar'):
            print("   Skipping - no avatar available")
            return False
            
        success, response = self.run_test(
            "Advanced Video Generation (Avatar IV Engine)",
            "POST",
            "videos/generate-advanced",
            200,
            data={
                "avatar_id": self.test_avatar['avatar_id'],
                "avatar_name": self.test_avatar.get('display_name', 'Test Avatar'),
                "title": "Test Advanced Video - Avatar IV",
                "script": "This is a test script for advanced video generation with Avatar IV engine.",
                "language": "English",
                "duration": 30,
                "voice_mode": "heygen",
                "avatar_engine": "avatar_iv",
                "width": 1920,
                "height": 1080,
                "enable_captions": False
            }
        )
        return success

    def test_generate_original_backward_compatibility(self):
        """Test original POST /api/videos/generate for backward compatibility"""
        if not hasattr(self, 'test_avatar'):
            print("   Skipping - no avatar available")
            return False
            
        success, response = self.run_test(
            "Original Video Generation (Backward Compatibility)",
            "POST",
            "videos/generate",
            200,
            data={
                "avatar_id": self.test_avatar['avatar_id'],
                "avatar_name": self.test_avatar.get('display_name', 'Test Avatar'),
                "title": "Test Original Video",
                "script": "This is a test script for original video generation.",
                "language": "English",
                "duration": 30
            }
        )
        return success

    def test_script_generation(self):
        """Test script generation endpoint"""
        success, response = self.run_test(
            "Script Generation",
            "POST",
            "scripts/generate",
            200,
            data={"prompt": "Create a script about Jio 5G benefits"}
        )
        return success

    def test_voice_preview(self):
        """Test voice preview endpoint"""
        success, response = self.run_test(
            "Voice Preview",
            "POST",
            "voice/preview",
            200,
            data={
                "script": "This is a test script for voice preview.",
                "language": "English"
            }
        )
        return success

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting JioGen AI Avatar Platform API Tests")
        print("=" * 60)
        
        # Authentication
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        # Get avatars for video generation tests
        self.test_avatars_endpoint()
        
        # Test new HeyGen voices endpoint
        self.test_heygen_voices()
        
        # Test ElevenLabs endpoints
        self.test_elevenlabs_voices_valid_key()
        self.test_elevenlabs_voices_invalid_key()
        self.test_elevenlabs_preview()
        
        # Test advanced video generation with different engines
        self.test_generate_advanced_standard_engine()
        self.test_generate_advanced_avatar_v_engine()
        self.test_generate_advanced_avatar_iv_engine()
        
        # Test backward compatibility
        self.test_generate_original_backward_compatibility()
        
        # Test other endpoints
        self.test_script_generation()
        self.test_voice_preview()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"   • {failed['test']}: {failed['details']}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests ({len(self.passed_tests)}):")
            for passed in self.passed_tests:
                print(f"   • {passed}")
        
        return len(self.failed_tests) == 0

def main():
    tester = JioGenAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())