"""
Global exception handler for consistent JSON error responses across the API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.serializers import ValidationError as SerializerValidationError
from rest_framework.exceptions import (
    AuthenticationFailed,
    PermissionDenied,
    NotFound,
    ValidationError as DRFValidationError,
)
import logging

logger = logging.getLogger(__name__)


def _normalize_detail(detail):
    """Turn DRF exception detail (list/dict) into a single message string."""
    if detail is None:
        return "An error occurred."
    if isinstance(detail, list):
        return "; ".join(str(m) for m in detail)
    if isinstance(detail, dict):
        parts = []
        for field, errors in detail.items():
            if isinstance(errors, list):
                parts.extend(str(e) for e in errors)
            else:
                parts.append(str(errors))
        return "; ".join(parts) if parts else "Validation error."
    return str(detail)


def _build_error_response(message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Return a consistent JSON error response."""
    payload = {"detail": message, "message": message}
    if details is not None:
        payload["details"] = details
    return Response(payload, status=status_code)


def custom_exception_handler(exc, context):
    """
    Custom exception handler: DRF exceptions get normalized JSON;
    unhandled exceptions get 500 with a generic message.
    """
    # Let DRF handle known exceptions first
    response = exception_handler(exc, context)

    if response is not None:
        # Normalize to consistent shape: detail, message (and optionally details)
        message = _normalize_detail(response.data)
        response.data = {
            "detail": message,
            "message": message,
            "details": response.data if isinstance(response.data, (dict, list)) else None,
        }
        # Ensure details is only set when it's useful (e.g. validation errors)
        if response.data.get("details") == response.data.get("detail"):
            response.data.pop("details", None)
        return response

    # Unhandled exception (e.g. from view code or third party)
    logger.exception("Unhandled exception: %s", exc, exc_info=True, extra={"context": context})

    if isinstance(exc, SerializerValidationError):
        message = _normalize_detail(exc.detail)
        return _build_error_response(message, details=exc.detail, status_code=status.HTTP_400_BAD_REQUEST)
    if isinstance(exc, DRFValidationError):
        message = _normalize_detail(exc.detail)
        return _build_error_response(message, details=exc.detail, status_code=status.HTTP_400_BAD_REQUEST)
    if isinstance(exc, AuthenticationFailed):
        return _build_error_response(
            _normalize_detail(getattr(exc, "detail", str(exc))),
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
    if isinstance(exc, PermissionDenied):
        return _build_error_response(
            _normalize_detail(getattr(exc, "detail", str(exc))),
            status_code=status.HTTP_403_FORBIDDEN,
        )
    if isinstance(exc, NotFound):
        return _build_error_response(
            _normalize_detail(getattr(exc, "detail", str(exc))),
            status_code=status.HTTP_404_NOT_FOUND,
        )

    # Generic 500 for any other exception
    return _build_error_response(
        "An internal server error occurred. Please try again later.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
