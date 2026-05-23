"""Convert amounts to a user's preferred currency."""
import logging
from decimal import Decimal

from apps.core.models import Currency

logger = logging.getLogger(__name__)


def convert_amount(amount, from_code: str, to_code: str) -> Decimal | None:
    """Return amount in to_code, or None if rates unavailable."""
    if not amount:
        return Decimal('0')
    if from_code == to_code:
        return Decimal(str(amount))
    try:
        from_cur = Currency.objects.get(code=from_code, is_active=True)
        to_cur = Currency.objects.get(code=to_code, is_active=True)
    except Currency.DoesNotExist:
        logger.warning('Currency conversion missing: %s -> %s', from_code, to_code)
        return None
    usd = from_cur.convert_to_usd(amount)
    return to_cur.convert_from_usd(usd)


def expense_amount_in_currency(expense, target_code: str) -> float | None:
    code = expense.currency.code if expense.currency_id else 'USD'
    converted = convert_amount(expense.amount, code, target_code)
    if converted is None:
        return None
    return float(converted)
