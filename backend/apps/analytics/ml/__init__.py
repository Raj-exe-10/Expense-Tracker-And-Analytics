__all__ = ['run_ml_pipeline']


def run_ml_pipeline(*args, **kwargs):
    from .predict import run_ml_pipeline as _run
    return _run(*args, **kwargs)
