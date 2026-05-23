import logging
from datetime import timedelta

import numpy as np
from django.utils import timezone

from apps.core.currency_utils import expense_amount_in_currency
from .debounce import mark_trained, should_retrain
from .priors import get_global_category_priors
from .train import SKLEARN_AVAILABLE, load_user_models, train_user_models
from . import features

logger = logging.getLogger(__name__)

COLD_START_EXPENSES = 10
COLD_START_DAYS = 30


def _expense_features(exp, cat_index, target_currency):
    amt = expense_amount_in_currency(exp, target_currency) or 0
    day = exp.expense_date.day if exp.expense_date else 15
    cat = exp.category.name if exp.category_id else 'Uncategorized'
    return [float(day), float(cat_index.get(cat, 0)), amt / 1000.0], amt


def _predict_amount(bundle, row):
    if bundle.get('engine') == 'sklearn' and bundle.get('forecast') is not None:
        return float(bundle['forecast'].predict([row])[0])
    numpy_m = bundle.get('numpy')
    if numpy_m:
        coef = np.array(numpy_m['coef'])
        x = np.array([1.0, *row])
        return float(x @ coef[: len(x)])
    return numpy_m.get('mean', 0) if numpy_m else 0


def _is_anomaly(bundle, row, amt, prior):
    if bundle.get('engine') == 'sklearn' and bundle.get('anomaly') is not None:
        try:
            return bundle['anomaly'].decision_function([row])[0] < -0.05
        except Exception:
            pass
    numpy_m = bundle.get('numpy')
    if numpy_m:
        z = (amt - numpy_m['mean']) / max(numpy_m['std'], 1)
        return abs(z) > 2.5
    z = (amt - prior['avg']) / max(prior['std'], 1)
    return abs(z) > 2.5


def run_ml_pipeline(user, expenses_qs, target_currency, budget_rows, year, month):
    expenses = list(expenses_qs[:5000])
    expense_count = len(expenses)
    today = timezone.now().date()
    history_start = today - timedelta(days=365)
    history = [e for e in expenses if e.expense_date and e.expense_date >= history_start]

    ml_is_estimate = expense_count < COLD_START_EXPENSES
    if history:
        span = (max(e.expense_date for e in history) - min(e.expense_date for e in history)).days
        if span < COLD_START_DAYS:
            ml_is_estimate = True

    priors = get_global_category_priors()
    categories = sorted({e.category.name if e.category_id else 'Uncategorized' for e in history} or priors.keys())
    cat_index = {c: i for i, c in enumerate(categories[:20])}

    feature_rows = []
    amounts = []
    for exp in history:
        row, amt = _expense_features(exp, cat_index, target_currency)
        feature_rows.append(row)
        amounts.append(amt)

    user_id = str(user.id)
    if should_retrain(user_id) and len(amounts) >= 3:
        train_user_models(user_id, feature_rows, amounts)
        mark_trained(user_id)

    bundle = load_user_models(user_id)
    ml_available = bundle is not None

    forecasts = []
    risks = []
    anomalies = []
    ml_insights = []

    days_elapsed, days_total = features.days_in_month_elapsed(year, month, today)

    for row in budget_rows[:6]:
        cat = row.get('name', 'Other')
        spent = row.get('spent', 0)
        budget = row.get('budget', 0) or 1
        pct_used = spent / budget if budget else 0
        daily_rate = spent / max(days_elapsed, 1)
        projected = daily_rate * days_total

        idx = cat_index.get(cat, 0)
        feat_row = [float(days_total), float(idx), spent / 1000.0]
        if bundle:
            projected = _predict_amount(bundle, feat_row)

        risk_prob = min(0.95, max(0.05, pct_used * (days_total / max(days_elapsed, 1))))
        if bundle and bundle.get('engine') == 'sklearn' and bundle.get('risk') is not None:
            try:
                X = np.array([[days_elapsed, idx, spent / 1000.0]])
                risk_prob = float(bundle['risk'].predict_proba(X)[0][1])
            except Exception:
                pass

        forecasts.append({
            'category': cat,
            'projected_eom': round(projected, 2),
            'budget': budget,
            'spent_mtd': spent,
        })

        if risk_prob > 0.6:
            risks.append({
                'category': cat,
                'probability': round(risk_prob, 2),
                'message': f'{int(risk_prob * 100)}% chance of exceeding {cat} budget this month',
            })
            ml_insights.append({
                'id': f'ml_risk_{cat}',
                'type': 'warning',
                'severity': 'high' if risk_prob > 0.8 else 'medium',
                'title': f'{cat} overspend risk',
                'detail': f'Projected spend ${projected:.0f} vs budget ${budget:.0f}.',
                'source': 'ml',
                'insight_key': f'overspend_risk_{cat}_{year}_{month}',
            })

        if projected > budget * 1.1 and budget > 0:
            ml_insights.append({
                'id': f'ml_forecast_{cat}',
                'type': 'warning',
                'severity': 'critical' if projected > budget * 1.25 else 'high',
                'title': f'{cat} forecast exceeds budget',
                'detail': f'On pace for ${projected:.0f} by month end (budget ${budget:.0f}).',
                'source': 'ml',
                'insight_key': f'forecast_over_{cat}_{year}_{month}',
            })

    recent = sorted(history, key=lambda e: e.expense_date or today, reverse=True)[:30]
    for exp in recent:
        amt = expense_amount_in_currency(exp, target_currency) or 0
        cat = exp.category.name if exp.category_id else 'Uncategorized'
        prior = priors.get(cat, priors.get('Other', {'avg': 50, 'std': 25}))
        row, _ = _expense_features(exp, cat_index, target_currency)
        is_anomaly = _is_anomaly(bundle or {}, row, amt, prior)

        if is_anomaly and amt > prior['avg'] * 1.5:
            z = (amt - prior['avg']) / max(prior['std'], 1)
            anomalies.append({
                'expense_id': str(exp.id),
                'title': exp.title,
                'amount': amt,
                'category': cat,
                'z_score': round(z, 2),
            })
            ml_insights.append({
                'id': f'ml_anomaly_{exp.id}',
                'type': 'warning',
                'severity': 'critical' if z > 3.5 else 'high',
                'title': 'Unusual transaction detected',
                'detail': f'"{exp.title}" (${amt:.2f}) is higher than typical {cat} spending.',
                'source': 'ml',
                'insight_key': f'anomaly_{exp.id}',
                'action': f'/app/expenses/{exp.id}',
            })

    return {
        'forecasts': forecasts,
        'risks': risks,
        'anomalies': anomalies,
        'ml_insights': ml_insights,
        'ml_is_estimate': ml_is_estimate,
        'ml_available': ml_available,
        'ml_engine': bundle.get('engine', 'numpy') if bundle else 'none',
    }
