import csv
import io
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from core.store import store, CurrentUser
from core.deps import get_current_user, require_role

router = APIRouter(prefix="/api/v1/users", tags=["users"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_verified: bool
    school: str
    bio: str
    avatar_url: Optional[str]
    linkedin: str
    github: str
    is_profile_complete: bool
    consent: dict


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    school: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


class ConsentRequest(BaseModel):
    analytics: bool
    tracking: bool


def _to_out(cu: CurrentUser) -> UserOut:
    return UserOut(
        id=cu.id, email=cu.email,
        first_name=cu.first_name, last_name=cu.last_name,
        role=cu.role, is_verified=cu.is_verified,
        school=cu.school, bio=cu.bio,
        avatar_url=cu.avatar_url, linkedin=cu.linkedin, github=cu.github,
        is_profile_complete=cu.is_profile_complete,
        consent=cu.consent,
    )


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: CurrentUser = Depends(get_current_user)):
    return _to_out(current_user)


@router.put("/me", response_model=UserOut)
def update_me(body: UpdateProfileRequest, current_user: CurrentUser = Depends(get_current_user)):
    updated = store.update(current_user.id, body.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(CurrentUser(updated))


# ── RGPD — Art. 15 : Droit d'accès ───────────────────────────────────────────

@router.get("/me/data")
def get_my_data(current_user: CurrentUser = Depends(get_current_user)):
    data = store.export_user_data(current_user.id)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")
    return data


# ── RGPD — Art. 20 : Portabilité ────────────────────────────────────────────

@router.get("/me/export")
def export_my_data(current_user: CurrentUser = Depends(get_current_user)):
    data = store.export_user_data(current_user.id)
    if not data:
        raise HTTPException(status_code=404, detail="User not found")

    json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=hi-platform-export-{current_user.id[:8]}.json"},
    )


# ── RGPD — Art. 17 : Droit à l'effacement ───────────────────────────────────

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(current_user: CurrentUser = Depends(get_current_user)):
    """Anonymise les données PII dans les 30 jours (ici : immédiat en in-memory)."""
    ok = store.anonymize(current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")


# ── RGPD — Art. 21 : Consentement ────────────────────────────────────────────

@router.put("/me/consent", response_model=UserOut)
def update_consent(body: ConsentRequest, current_user: CurrentUser = Depends(get_current_user)):
    updated = store.update_consent(current_user.id, body.analytics, body.tracking)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_out(CurrentUser(updated))


@router.get("/me/consent")
def get_consent(current_user: CurrentUser = Depends(get_current_user)):
    return current_user.consent


# ── Import massif Excel (admin) ───────────────────────────────────────────────

@router.post("/import", dependencies=[Depends(require_role("admin", "superuser"))])
async def import_users_excel(file: UploadFile = File(...)):
    """
    Import batch depuis Excel.
    Colonnes attendues: email, first_name, last_name, school, role (optionnel)
    """
    if not file.filename or not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Fichier Excel (.xlsx) requis")

    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl non installé")

    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content))
    ws = wb.active

    headers = [str(c.value).strip().lower() if c.value else "" for c in next(ws.iter_rows(min_row=1, max_row=1))]
    required = {"email", "first_name", "last_name"}
    if not required.issubset(set(headers)):
        raise HTTPException(
            status_code=400,
            detail=f"Colonnes requises: email, first_name, last_name. Trouvé: {headers}",
        )

    created, skipped, errors = [], [], []

    for row in ws.iter_rows(min_row=2, values_only=True):
        row_data = {headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row)}
        email = row_data.get("email", "").lower()

        if not email or "@" not in email:
            errors.append({"email": email, "reason": "Email invalide"})
            continue

        if store.get_by_email(email):
            skipped.append(email)
            continue

        user, _ = store.get_or_create(email)
        store.update(user["id"], {
            "first_name": row_data.get("first_name", ""),
            "last_name": row_data.get("last_name", ""),
            "school": row_data.get("school", ""),
            "role": row_data.get("role", "student") if row_data.get("role") in ("student", "teacher", "admin") else "student",
        })
        created.append(email)

    return {
        "created": len(created),
        "skipped": len(skipped),
        "errors": len(errors),
        "detail": {"created": created, "skipped": skipped, "errors": errors},
    }
