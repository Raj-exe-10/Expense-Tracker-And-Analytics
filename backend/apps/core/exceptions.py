"""
Custom Exception Handlers
Provides consistent error responses across the API
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Custom exception handler for consistent error responses"""
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data
        }
        
        # Log the error
        logger.error(
            f"API Error: {exc}",
            exc_info=True,
            extra={'context': context}
        )
        
        response.data = custom_response_data
    
    return response
