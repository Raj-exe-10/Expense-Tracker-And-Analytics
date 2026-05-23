import json
import logging
from pathlib import Path

import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

SKLEARN_AVAILABLE = False
try:
    import joblib
    from sklearn.ensemble import HistGradientBoostingRegressor, IsolationForest
    from sklearn.linear_model import LogisticRegression
    SKLEARN_AVAILABLE = True
except ImportError:
    joblib = None


def model_path(user_id) -> Path:
    base = Path(getattr(settings, 'MEDIA_ROOT', settings.BASE_DIR / 'media')) / 'ml_models'
    base.mkdir(parents=True, exist_ok=True)
    return base / f'{user_id}.json' if not SKLEARN_AVAILABLE else base / f'{user_id}.joblib'


def _train_numpy_bundle(feature_rows, amounts):
    """Lightweight numpy stats model (no sklearn)."""
    X = np.array(feature_rows, dtype=float)
    y = np.array(amounts, dtype=float)
    coef = np.linalg.lstsq(
        np.c_[np.ones(len(X)), X], y, rcond=None
    )[0] if len(X) >= 3 else np.zeros(X.shape[1] + 1)
    mean = float(np.mean(y))
    std = float(np.std(y)) or 1.0
    return {'type': 'numpy', 'coef': coef.tolist(), 'mean': mean, 'std': std}


def train_user_models(user_id, feature_rows, amounts):
    bundle = {'version': 1, 'engine': 'numpy'}

    if len(amounts) < 3:
        return bundle

    if SKLEARN_AVAILABLE:
        bundle['engine'] = 'sklearn'
        bundle['forecast'] = None
        bundle['anomaly'] = None
        bundle['risk'] = None
        X = np.array(feature_rows, dtype=float)
        y = np.array(amounts, dtype=float)
        try:
            reg = HistGradientBoostingRegressor(max_iter=50, random_state=42)
            reg.fit(X, y)
            bundle['forecast'] = reg
        except Exception as e:
            logger.warning('sklearn forecast failed: %s', e)
        try:
            iso = IsolationForest(contamination=0.1, random_state=42)
            iso.fit(X)
            bundle['anomaly'] = iso
        except Exception as e:
            logger.warning('sklearn anomaly failed: %s', e)
        path = model_path(user_id)
        joblib.dump(bundle, path)
        return bundle

    bundle['numpy'] = _train_numpy_bundle(feature_rows, amounts)
    path = model_path(user_id)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(bundle, f)
    return bundle


def load_user_models(user_id):
    path = model_path(user_id)
    if not path.exists():
        return None
    try:
        if SKLEARN_AVAILABLE and path.suffix == '.joblib':
            return joblib.load(path)
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.warning('Load ML model failed for %s: %s', user_id, e)
        return None
