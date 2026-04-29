"""
JWT and authentication security
"""
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
from app.core.config import settings
from app.utils.logger import logger
from fastapi import HTTPException, status


def create_access_token(
    user_id: int,
    email: str,
    roles: List[str],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            hours=settings.jwt_expiration_hours
        )

    to_encode = {
        "sub": str(user_id),   # JWT spec requires sub to be string
        "email": email,
        "roles": roles,
        "iat": datetime.utcnow().timestamp(),
        "exp": expire.timestamp(),
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> dict:
    """
    Verify and decode JWT token
    Raises HTTPException if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id_str = payload.get("sub")
        email: str = payload.get("email")
        roles: List[str] = payload.get("roles", [])

        if user_id_str is None or email is None:
            raise JWTError("Invalid token payload")

        # Convert sub back to integer
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise JWTError("Invalid user_id in token")

        return {
            "user_id": user_id,
            "email": email,
            "roles": roles,
        }
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def extract_token_from_header(authorization: str) -> str:
    """
    Extract token from Authorization header
    Expected format: "Bearer <token>"
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header",
        )
    return authorization.split(" ")[1]
