"""
Moderation Pipeline Evaluation Script
Runs the hybrid moderation pipeline against the multilingual test dataset
and reports Accuracy, Precision, Recall per language and overall.

Usage:
    python -m app.evaluation.evaluate
"""
import sys
import os

# Ensure project root is on sys.path when run standalone
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.evaluation.dataset import EVALUATION_DATASET
from app.pipelines.moderation import HybridModerationPipeline


def run_evaluation():
    print("=" * 70)
    print("  MULTILINGUAL MODERATION PIPELINE — EVALUATION REPORT")
    print("=" * 70)

    pipeline = HybridModerationPipeline()

    results_by_lang = {}
    overall = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}

    for sample in EVALUATION_DATASET:
        text = sample["text"]
        expected = sample["expected_toxic"]
        lang = sample["language"]

        result = pipeline.moderate_document(text)
        predicted = result["is_toxic"]

        if lang not in results_by_lang:
            results_by_lang[lang] = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}

        bucket = results_by_lang[lang]

        if predicted and expected:
            bucket["tp"] += 1
            overall["tp"] += 1
        elif predicted and not expected:
            bucket["fp"] += 1
            overall["fp"] += 1
        elif not predicted and not expected:
            bucket["tn"] += 1
            overall["tn"] += 1
        else:
            bucket["fn"] += 1
            overall["fn"] += 1

    def metrics(b):
        total = b["tp"] + b["fp"] + b["tn"] + b["fn"]
        accuracy = (b["tp"] + b["tn"]) / total if total else 0
        precision = b["tp"] / (b["tp"] + b["fp"]) if (b["tp"] + b["fp"]) else 0
        recall = b["tp"] / (b["tp"] + b["fn"]) if (b["tp"] + b["fn"]) else 0
        return accuracy, precision, recall

    # Per-language results
    for lang in ["ar", "fr", "en", "mixed"]:
        if lang in results_by_lang:
            b = results_by_lang[lang]
            acc, prec, rec = metrics(b)
            print(f"\n── {lang.upper()} ({b['tp']+b['fp']+b['tn']+b['fn']} samples) ──")
            print(f"   TP={b['tp']}  FP={b['fp']}  TN={b['tn']}  FN={b['fn']}")
            print(f"   Accuracy:  {acc:.2%}")
            print(f"   Precision: {prec:.2%}")
            print(f"   Recall:    {rec:.2%}")

    # Overall
    acc, prec, rec = metrics(overall)
    total = sum(overall.values())
    print(f"\n{'=' * 70}")
    print(f"  OVERALL ({total} samples)")
    print(f"{'=' * 70}")
    print(f"   TP={overall['tp']}  FP={overall['fp']}  TN={overall['tn']}  FN={overall['fn']}")
    print(f"   Accuracy:  {acc:.2%}")
    print(f"   Precision: {prec:.2%}")
    print(f"   Recall:    {rec:.2%}  {'✅ TARGET MET' if rec >= 0.90 else '⚠️ BELOW 90% TARGET'}")
    print(f"{'=' * 70}")

    return acc, prec, rec


if __name__ == "__main__":
    run_evaluation()
