import textstat
def grade(text: str):
    if not text.strip():
        return 0.0
    try:
        return round(float(textstat.flesch_kincaid_grade(text)), 1)
    except Exception:
        return None
