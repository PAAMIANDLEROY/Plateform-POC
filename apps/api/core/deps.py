from fastapi import Depends, HTTPException, status, Cookie
from typing import Optional

from core.security import decode_token
from core.store import store, CurrentUser


def get_current_user(
    access_token: Optional[str] = Cookie(default=None),
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
    if not access_token:
        raise credentials_exception

    payload = decode_token(access_token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    user_data = store.get_by_id(user_id)
    if not user_data:
        raise credentials_exception

    return CurrentUser(user_data)


def require_role(*roles: str):
    def checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker
