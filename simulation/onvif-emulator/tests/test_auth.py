"""Tests for ONVIF authentication."""

import base64
import hashlib
from datetime import datetime, timezone

import pytest

from src.auth import ONVIFAuth


class TestONVIFAuth:
    """Test cases for ONVIF authentication."""

    def test_generate_digest(self):
        """Test password digest generation."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        nonce = b"random_nonce_bytes"
        created = "2024-01-01T12:00:00.000Z"

        digest = auth.generate_digest("password123", nonce, created)

        # Digest should be base64-encoded SHA-1
        assert isinstance(digest, str)
        decoded = base64.b64decode(digest)
        assert len(decoded) == 20  # SHA-1 produces 20 bytes

    def test_verify_digest_valid(self):
        """Test valid digest verification."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        nonce = b"test_nonce_12345"
        created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        # Generate valid digest
        password_digest = auth.generate_digest("password123", nonce, created)
        nonce_b64 = base64.b64encode(nonce).decode("utf-8")

        # Verify
        assert auth.verify_digest("admin", password_digest, nonce_b64, created) is True

    def test_verify_digest_invalid_username(self):
        """Test digest verification with invalid username."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        nonce = b"test_nonce"
        created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        password_digest = auth.generate_digest("password123", nonce, created)
        nonce_b64 = base64.b64encode(nonce).decode("utf-8")

        # Wrong username
        assert auth.verify_digest("wronguser", password_digest, nonce_b64, created) is False

    def test_verify_digest_invalid_password(self):
        """Test digest verification with invalid password."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        nonce = b"test_nonce"
        created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        # Generate digest with wrong password
        password_digest = auth.generate_digest("wrong_password", nonce, created)
        nonce_b64 = base64.b64encode(nonce).decode("utf-8")

        assert auth.verify_digest("admin", password_digest, nonce_b64, created) is False

    def test_auth_disabled(self):
        """Test that auth bypass works when disabled."""
        auth = ONVIFAuth("admin", "password123", enabled=False)

        # Should always return True when disabled
        assert auth.verify_digest("anyuser", "anydigest", "anynonce", "anytime") is True

    def test_create_auth_header(self):
        """Test auth header creation for client requests."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        header = auth.create_auth_header()

        assert "Username" in header
        assert "Password" in header
        assert "Nonce" in header
        assert "Created" in header

        assert header["Username"] == "admin"
        # Verify nonce is base64
        try:
            base64.b64decode(header["Nonce"])
        except Exception:
            pytest.fail("Nonce is not valid base64")

    def test_extract_credentials_from_soap(self):
        """Test extraction of credentials from SOAP envelope."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        soap_body = """<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <s:Header>
        <wsse:Security>
            <wsse:UsernameToken>
                <wsse:Username>admin</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">dGVzdGRpZ2VzdA==</wsse:Password>
                <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">dGVzdG5vbmNl</wsse:Nonce>
                <wsu:Created>2024-01-01T12:00:00.000Z</wsu:Created>
            </wsse:UsernameToken>
        </wsse:Security>
    </s:Header>
    <s:Body>
        <GetDeviceInformation/>
    </s:Body>
</s:Envelope>"""

        credentials = auth.extract_credentials_from_soap(soap_body)

        assert credentials is not None
        username, password_digest, nonce, created = credentials

        assert username == "admin"
        assert password_digest == "dGVzdGRpZ2VzdA=="
        assert nonce == "dGVzdG5vbmNl"
        assert created == "2024-01-01T12:00:00.000Z"

    def test_extract_credentials_no_auth(self):
        """Test extraction when no auth present in SOAP."""
        auth = ONVIFAuth("admin", "password123", enabled=True)

        soap_body = """<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
    <s:Body>
        <GetDeviceInformation/>
    </s:Body>
</s:Envelope>"""

        credentials = auth.extract_credentials_from_soap(soap_body)
        assert credentials is None
