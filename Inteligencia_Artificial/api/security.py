"""Autenticación y autorización de la API.

- Usuarios finales: Firebase ID token (Bearer).
- Ingesta interna de telemetría: clave compartida X-Ingest-Key.
"""

import logging
import os
import secrets
from typing import Any, Dict, Set

from fastapi import Depends, Header, HTTPException, status

from src.services.firebase_service import get_firebase_service

logger = logging.getLogger(__name__)


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de Authorization inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token.strip()


async def get_current_user(
    authorization: str | None = Header(default=None),
) -> Dict[str, Any]:
    """Verifica el ID token de Firebase y devuelve el usuario decodificado."""
    token = _bearer_token(authorization)
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase no disponible",
        )
    try:
        decoded = fb.verify_id_token(token)
    except Exception as exc:
        logger.info("Token Firebase rechazado: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o vencido",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not decoded.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token no contiene uid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded


async def require_same_user(
    uid: str,
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Impide que un usuario consulte o modifique el espacio de otro."""
    if str(user.get("uid")) != str(uid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés permiso para acceder a este usuario",
        )
    return user


def user_silo_ids(uid: str) -> Set[str]:
    """IDs de silos que pertenecen al usuario autenticado."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase no disponible",
        )
    try:
        return {
            str(silo.get("silo_id"))
            for silo in fb.get_user_silos(uid)
            if silo.get("silo_id")
        }
    except Exception as exc:
        logger.error("No se pudieron leer los silos de %s: %s", uid, exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo verificar la propiedad de los silos",
        ) from exc


def require_silo_access(uid: str, silo_id: str) -> None:
    """Verifica que el silo pertenezca al usuario autenticado."""
    if silo_id not in user_silo_ids(uid):
        # No revelar si el silo existe o pertenece a otro usuario.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Silo no encontrado")


async def require_ingest_key(
    x_ingest_key: str | None = Header(default=None, alias="X-Ingest-Key"),
) -> None:
    """Protege /ingest para que solo el bridge interno pueda inyectar lecturas."""
    expected = os.getenv("INGEST_API_KEY")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INGEST_API_KEY no configurada en el servidor",
        )
    if not x_ingest_key or not secrets.compare_digest(x_ingest_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de ingesta inválida",
        )
