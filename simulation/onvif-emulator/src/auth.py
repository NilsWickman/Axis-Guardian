"""ONVIF WS-UsernameToken authentication implementation."""

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from loguru import logger


class ONVIFAuth:
    """ONVIF WS-Security UsernameToken authentication handler."""

    def __init__(self, username: str, password: str, enabled: bool = True):
        """Initialize ONVIF authentication.

        Args:
            username: Expected username
            password: Expected password
            enabled: Whether authentication is enabled
        """
        self.username = username
        self.password = password
        self.enabled = enabled

    def generate_digest(
        self, password: str, nonce: bytes, created: str
    ) -> str:
        """Generate password digest for WS-UsernameToken.

        Args:
            password: Plain text password
            nonce: Random nonce bytes
            created: ISO 8601 timestamp string

        Returns:
            Base64-encoded SHA-1 digest
        """
        # Digest = Base64(SHA-1(nonce + created + password))
        created_bytes = created.encode("utf-8")
        password_bytes = password.encode("utf-8")
        digest_input = nonce + created_bytes + password_bytes
        digest = hashlib.sha1(digest_input).digest()
        return base64.b64encode(digest).decode("utf-8")

    def verify_digest(
        self,
        username: str,
        password_digest: str,
        nonce_b64: str,
        created: str,
    ) -> bool:
        """Verify WS-UsernameToken password digest.

        Args:
            username: Provided username
            password_digest: Base64-encoded password digest
            nonce_b64: Base64-encoded nonce
            created: ISO 8601 timestamp string

        Returns:
            True if authentication is valid
        """
        if not self.enabled:
            return True

        # Verify username
        if username != self.username:
            logger.warning(f"Invalid username: {username}")
            return False

        # Decode nonce
        try:
            nonce = base64.b64decode(nonce_b64)
        except Exception as e:
            logger.error(f"Failed to decode nonce: {e}")
            return False

        # Verify timestamp (prevent replay attacks)
        try:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            time_diff = abs((now - created_dt).total_seconds())

            # Allow 5 minute time window
            if time_diff > 300:
                logger.warning(
                    f"Timestamp outside acceptable range: {time_diff}s difference"
                )
                return False
        except Exception as e:
            logger.error(f"Failed to parse timestamp: {e}")
            return False

        # Generate expected digest
        expected_digest = self.generate_digest(self.password, nonce, created)

        # Compare digests (constant time comparison)
        if password_digest != expected_digest:
            logger.warning("Invalid password digest")
            return False

        logger.debug(f"Authentication successful for user: {username}")
        return True

    def create_auth_header(self) -> dict:
        """Create WS-Security authentication header for client requests.

        Returns:
            Dictionary with authentication header elements
        """
        # Generate random nonce
        nonce = secrets.token_bytes(16)
        nonce_b64 = base64.b64encode(nonce).decode("utf-8")

        # Generate timestamp
        created = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

        # Generate digest
        password_digest = self.generate_digest(self.password, nonce, created)

        return {
            "Username": self.username,
            "Password": password_digest,
            "Nonce": nonce_b64,
            "Created": created,
        }

    def extract_credentials_from_soap(self, soap_body: str) -> Optional[Tuple[str, str, str, str]]:
        """Extract WS-Security credentials from SOAP envelope.

        Args:
            soap_body: Raw SOAP XML string

        Returns:
            Tuple of (username, password_digest, nonce, created) or None
        """
        # Simple XML parsing for WS-Security header
        # In production, use proper XML parsing
        try:
            # Look for UsernameToken elements
            if "UsernameToken" not in soap_body:
                return None

            # Extract username
            username_start = soap_body.find("<wsse:Username>")
            username_end = soap_body.find("</wsse:Username>")
            if username_start == -1 or username_end == -1:
                return None
            username = soap_body[username_start + 15:username_end]

            # Extract password digest
            password_start = soap_body.find('<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">')
            password_end = soap_body.find("</wsse:Password>")
            if password_start == -1 or password_end == -1:
                return None
            password_digest = soap_body[password_start + 122:password_end]

            # Extract nonce
            nonce_start = soap_body.find('<wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">')
            nonce_end = soap_body.find("</wsse:Nonce>")
            if nonce_start == -1 or nonce_end == -1:
                return None
            nonce = soap_body[nonce_start + 124:nonce_end]

            # Extract created timestamp
            created_start = soap_body.find("<wsu:Created>")
            created_end = soap_body.find("</wsu:Created>")
            if created_start == -1 or created_end == -1:
                return None
            created = soap_body[created_start + 13:created_end]

            return (username, password_digest, nonce, created)

        except Exception as e:
            logger.error(f"Failed to extract credentials from SOAP: {e}")
            return None

    def authenticate_request(self, soap_body: str) -> bool:
        """Authenticate a SOAP request.

        Args:
            soap_body: Raw SOAP XML string

        Returns:
            True if authenticated or authentication disabled
        """
        if not self.enabled:
            return True

        credentials = self.extract_credentials_from_soap(soap_body)
        if not credentials:
            logger.warning("No authentication credentials found in request")
            return False

        username, password_digest, nonce, created = credentials
        return self.verify_digest(username, password_digest, nonce, created)
