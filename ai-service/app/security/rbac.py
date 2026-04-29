"""
Role-Based Access Control (RBAC) enforcement
"""
from typing import List
from fastapi import HTTPException, status, Depends, Request
from app.security.auth import verify_token, extract_token_from_header
from app.models.schemas import UserInfo
from app.utils.logger import logger


class RBACManager:
    """
    Manages role-based access control
    """

    # Role definitions
    ROLES = {
        "admin": ["admin"],
        "enseignant": ["enseignant"],
        "etudiant": ["etudiant"],
    }

    # Permission mapping: endpoint -> allowed_roles
    PERMISSIONS = {
        "documents:analyze": ["admin", "enseignant"],
        "reclamations:read": ["admin", "enseignant"],
        "reclamations:insights": ["admin"],
        "analytics:dashboard": ["admin"],
    }

    @staticmethod
    def get_current_user(request: Request) -> UserInfo:
        """
        FastAPI dependency to get current user from JWT
        Usage:
            async def endpoint(user: UserInfo = Depends(RBACManager.get_current_user)):
                ...
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Authorization header",
            )

        try:
            token = extract_token_from_header(auth_header)
            payload = verify_token(token)

            # Support both standard 'sub' and custom 'user_id'
            uid = payload.get("user_id") or payload.get("sub")
            if not uid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload: missing user identification (sub or user_id)",
                )

            return UserInfo(
                id=uid,
                email=payload.get("email", ""),
                nom="",  # Will be fetched from DB if needed
                prenom="",
                roles=payload["roles"],
            )
        except HTTPException as e:
            logger.warning(f"RBAC validation failed: {e.detail}")
            raise

    @staticmethod
    def require_roles(allowed_roles: List[str]):
        """
        Decorator to require specific roles
        Usage:
            @app.get("/admin")
            @RBACManager.require_roles(["admin"])
            async def admin_only(user: UserInfo = Depends(RBACManager.get_current_user)):
                ...
        """
        async def role_checker(
            user: UserInfo = Depends(RBACManager.get_current_user),
        ) -> UserInfo:
            user_roles = set(user.roles)
            required_roles = set(allowed_roles)

            if not user_roles.intersection(required_roles):
                logger.warning(
                    f"User {user.id} attempted unauthorized access. "
                    f"User roles: {user.roles}, Required: {allowed_roles}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required roles: {allowed_roles}",
                )

            return user

        return role_checker

    @staticmethod
    def require_permission(permission: str):
        """
        Decorator to require specific permission
        Usage:
            @app.get("/api")
            @RBACManager.require_permission("documents:analyze")
            async def protected(user: UserInfo = Depends(RBACManager.get_current_user)):
                ...
        """
        allowed_roles = RBACManager.PERMISSIONS.get(permission, [])

        if not allowed_roles:
            raise ValueError(f"Unknown permission: {permission}")

        return RBACManager.require_roles(allowed_roles)

    @staticmethod
    def filter_by_role(user: UserInfo, data: dict) -> dict:
        """
        Filter response data based on user role
        Prevents students from seeing other students' data
        """
        if "etudiant" in user.roles:
            # Students can only see their own data
            if "etudiant_id" in data and data["etudiant_id"] != user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot access other students' data",
                )

        if "enseignant" in user.roles:
            # Teachers can see students' data for their modules
            pass

        if "admin" in user.roles:
            # Admins can see everything
            pass

        return data
