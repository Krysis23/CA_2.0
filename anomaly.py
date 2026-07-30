import re
import numpy as np
from sklearn.ensemble import IsolationForest

def _to_float(val) -> float:
    if val is None:
        return 0.0

    return float(
        re.sub(r"[^\d.]", "", str(val)) or 0
    )

def detect_anomalies(transactions: list[dict]) -> list[dict]:
    """
    Find anomalous transactions using IsolationForest.

    Args:
        transactions: list of dicts with at least
        {
            "date": str,
            "description": str,
            "amount": str|float,
            "type": "credit"|"debit"
        }

    Returns:
        list of anomalous transaction dicts,
        each with an added "anomaly_reason".
    """

    if len(transactions) < 5:
        # Too few transactions to detect anomalies reliably
        return []

    amounts = np.array([
        _to_float(t.get("amount"))
        for t in transactions
    ])

    mean = amounts.mean()
    std = amounts.std()

    # IsolationForest expects 2-D input
    X = amounts.reshape(-1, 1)

    clf = IsolationForest(
        contamination=0.07,
        random_state=42,
    )

    labels = clf.fit_predict(X)

    flagged = []

    for txn, label, amt in zip(
        transactions,
        labels,
        amounts,
    ):

        if label == -1:

            ratio = amt / mean if mean > 0 else 1.0

            direction = (
                "credit"
                if txn.get("type", "").lower() == "credit"
                else "debit"
            )

            reason = (
                f"This {direction} of Rs. {amt:,.0f} is "
                f"{ratio:.1f}x your average transaction amount "
                f"(avg Rs. {mean:,.0f}). "
            )

            if ratio > 5:

                reason += (
                    "Large one-time amounts may affect "
                    "advance tax liability."
                )

            elif std > 0 and abs(amt - mean) > 2.5 * std:

                reason += (
                    "Statistically unusual—verify this transaction."
                )

            else:

                reason += (
                    "Consider discussing this with your CA."
                )

            flagged.append({
                **txn,
                "anomaly_reason": reason,
            })

    return flagged

def anomaly_summary_text(flagged: list[dict]) -> str:
    """
    Convert flagged list to a human-readable summary.
    """

    if not flagged:
        return ""

    lines = [
        "\n**Flagged transactions requiring attention:**\n"
    ]

    for txn in flagged:

        lines.append(
            f"- {txn.get('date', 'Unknown date')}: "
            f"{txn.get('description', 'Transaction')} "
            f"(Rs. {_to_float(txn.get('amount')):,.0f}) — "
            f"{txn.get('anomaly_reason', '')}"
        )

    return "\n".join(lines)
