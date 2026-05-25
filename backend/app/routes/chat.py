"""
AI Chat Assistant route — context-aware responses about churn analytics.
Uses rule-based NLP with analytics context injection.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import logging
import re

from ..database import get_database
from ..utils.helpers import serialize_doc
from ..services import ml_service
from .auth import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Assistant"])
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


# ─── Intent patterns ──────────────────────────────────────────────────────────

INTENTS = [
    (r"churn.*(increase|rise|up|high|more)", "churn_increase"),
    (r"(why|reason|cause|factor).*(churn|leav|quit)", "churn_causes"),
    (r"(reduce|lower|decrease|prevent|stop).*(churn|leav)", "reduce_churn"),
    (r"(high.risk|at.risk|danger)", "high_risk"),
    (r"(revenue|money|loss|cost|profit)", "revenue"),
    (r"(model|accuracy|performance|ml|ai)", "model_performance"),
    (r"(recommend|suggest|action|strategy|retention)", "recommendations"),
    (r"(segment|group|cluster|type)", "segmentation"),
    (r"(forecast|predict|future|next month|trend)", "forecast"),
    (r"(contract|plan|subscription)", "contract"),
    (r"(payment|billing|charge|price)", "payment"),
    (r"(support|help|service|tech)", "support"),
    (r"(hello|hi|hey|start|help)", "greeting"),
    (r"(summary|overview|report|status)", "summary"),
]

RESPONSES = {
    "greeting": [
        "👋 Hello! I'm your AI Churn Analytics Assistant. I can help you understand churn patterns, explain predictions, suggest retention strategies, and analyze your customer data. What would you like to know?",
    ],
    "churn_increase": [
        "📈 Churn increases are typically driven by:\n\n"
        "• **Month-to-month contracts** — customers with no long-term commitment churn 3× more\n"
        "• **High monthly charges** — bills above $70/month correlate strongly with churn\n"
        "• **Short tenure** — new customers (< 6 months) are most vulnerable\n"
        "• **Fiber optic internet** — higher cost service leads to more price-sensitive behavior\n"
        "• **Electronic check payments** — manual payment methods show higher churn\n\n"
        "💡 **Recommendation:** Focus retention efforts on month-to-month customers with high charges.",
    ],
    "churn_causes": [
        "🔍 The top churn causes in your data are:\n\n"
        "1. **Contract type** — Month-to-month customers churn 3× more than annual\n"
        "2. **Tenure** — Short-tenure customers haven't built loyalty yet\n"
        "3. **Monthly charges** — Price sensitivity is a major driver\n"
        "4. **Internet service** — Fiber optic users have higher expectations\n"
        "5. **Payment method** — Electronic check users are less committed\n"
        "6. **Missing add-ons** — No tech support or security increases frustration\n\n"
        "Use the **Predict** page to analyze individual customers and see their specific risk factors.",
    ],
    "reduce_churn": [
        "✅ Proven strategies to reduce churn:\n\n"
        "• **Offer annual contracts** — reduces churn risk by ~18%\n"
        "• **Provide discounts** — 10-20% discount can cut churn probability in half\n"
        "• **Add tech support** — reduces frustration-driven churn by ~8%\n"
        "• **Bundle services** — online backup + device protection increases stickiness\n"
        "• **Switch to auto-pay** — automatic payments reduce churn by ~6%\n"
        "• **Early intervention** — contact high-risk customers before month 6\n\n"
        "Try the **Retention Simulator** to test these strategies on specific customers!",
    ],
    "high_risk": [
        "🚨 High-risk customers (probability ≥ 70%) need immediate attention:\n\n"
        "**Immediate actions:**\n"
        "• Personal outreach within 24 hours\n"
        "• Offer a personalized discount or upgrade\n"
        "• Assign a dedicated account manager\n"
        "• Propose contract upgrade with incentives\n\n"
        "**Key insight:** High CLV + High Risk customers represent your biggest revenue threat. "
        "Prioritize customers with monthly charges > $70 and tenure < 12 months.",
    ],
    "revenue": [
        "💰 Revenue impact analysis:\n\n"
        "• Each churned customer costs approximately **$350** in lost annual revenue\n"
        "• High-risk customers (≥70% probability) represent your immediate revenue threat\n"
        "• A 5% reduction in churn can increase profits by **25-95%**\n"
        "• Retaining existing customers costs **5-7× less** than acquiring new ones\n\n"
        "Check the **Revenue Impact** section in Analytics for your specific numbers.",
    ],
    "model_performance": [
        "🤖 Your ML model performance:\n\n"
        "The system uses a **Tuned Random Forest** classifier trained on Telco customer data:\n"
        "• **Accuracy:** ~80%\n"
        "• **ROC-AUC:** ~89%\n"
        "• **F1 Score:** ~69%\n\n"
        "The model analyzes 40+ features including contract type, tenure, charges, and service usage. "
        "Visit the **Model Center** to compare all trained models and their metrics.",
    ],
    "recommendations": [
        "💡 AI Retention Recommendations:\n\n"
        "**For High-Risk Customers:**\n"
        "1. Offer 20% discount on next 3 months\n"
        "2. Upgrade to annual contract with price lock\n"
        "3. Add free tech support for 6 months\n"
        "4. Personal call from account manager\n\n"
        "**For Medium-Risk Customers:**\n"
        "1. Send loyalty reward email\n"
        "2. Offer bundle upgrade\n"
        "3. Switch to automatic payment\n\n"
        "Use the **Retention Simulator** to test the impact of each action!",
    ],
    "segmentation": [
        "👥 Customer segments in your data:\n\n"
        "• **High Risk** 🚨 — Probability ≥ 70%, needs immediate action\n"
        "• **Loyal Customers** 💚 — Tenure > 24 months, low churn risk\n"
        "• **Premium Users** ⭐ — High monthly charges (> $70)\n"
        "• **Price Sensitive** 💰 — Lower charges, moderate risk\n\n"
        "Each segment requires a different retention strategy. "
        "View detailed segment analysis in the **Segmentation** section.",
    ],
    "forecast": [
        "📊 Churn forecasting insights:\n\n"
        "The system uses historical trend analysis to project future churn rates. "
        "Key forecasting signals:\n\n"
        "• **Increasing trend** — Churn rate rising month-over-month\n"
        "• **Stable trend** — Consistent churn rate\n"
        "• **Decreasing trend** — Retention efforts are working\n\n"
        "View the **30-day forecast** in the Analytics → Forecast section for your specific projections.",
    ],
    "contract": [
        "📋 Contract type is the #1 churn predictor:\n\n"
        "• **Month-to-month:** ~42% churn rate — highest risk\n"
        "• **One year:** ~11% churn rate — moderate risk\n"
        "• **Two year:** ~3% churn rate — lowest risk\n\n"
        "**Strategy:** Offer month-to-month customers a discounted annual contract. "
        "Even a 10% discount on annual plans dramatically reduces churn.",
    ],
    "payment": [
        "💳 Payment method impacts churn:\n\n"
        "• **Electronic check:** Highest churn (~45%) — manual, less committed\n"
        "• **Mailed check:** High churn (~37%) — inconvenient, friction\n"
        "• **Bank transfer (auto):** Lower churn (~17%) — automatic, committed\n"
        "• **Credit card (auto):** Lowest churn (~15%) — most convenient\n\n"
        "**Action:** Incentivize customers to switch to automatic payment methods.",
    ],
    "support": [
        "🛠️ Support services significantly impact retention:\n\n"
        "• Customers **without tech support** churn 8% more\n"
        "• Customers **without online security** churn 6% more\n"
        "• Adding **both services** reduces churn risk by ~12%\n\n"
        "**Recommendation:** Offer a free 3-month trial of tech support + online security "
        "to high-risk customers. The retention value far exceeds the cost.",
    ],
    "summary": [
        "📊 Here's your analytics summary:\n\n"
        "I can provide detailed insights on:\n"
        "• **Churn causes** — Why customers are leaving\n"
        "• **High-risk customers** — Who needs immediate attention\n"
        "• **Revenue impact** — Financial cost of churn\n"
        "• **Retention strategies** — How to reduce churn\n"
        "• **Model performance** — How accurate predictions are\n"
        "• **Forecasting** — Future churn projections\n\n"
        "Ask me anything about your churn data!",
    ],
    "default": [
        "🤔 I can help you with:\n\n"
        "• **Churn analysis** — 'Why is churn increasing?'\n"
        "• **Retention strategies** — 'How can I reduce churn?'\n"
        "• **High-risk customers** — 'Who are my at-risk customers?'\n"
        "• **Revenue impact** — 'What is churn costing me?'\n"
        "• **Model performance** — 'How accurate is the AI?'\n"
        "• **Forecasting** — 'What will churn look like next month?'\n\n"
        "Try asking one of these questions!",
    ],
}


def detect_intent(message: str) -> str:
    msg_lower = message.lower()
    for pattern, intent in INTENTS:
        if re.search(pattern, msg_lower):
            return intent
    return "default"


@router.post("/message")
async def chat_message(
    body: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Process a chat message and return an AI response."""
    intent = detect_intent(body.message)
    responses = RESPONSES.get(intent, RESPONSES["default"])
    response_text = responses[0]

    # Inject live stats if available
    if intent in ("summary", "churn_increase", "high_risk"):
        try:
            db = get_database()
            docs = await db.predictions.find(
                {"user_id": str(current_user["_id"])}
            ).to_list(length=100)
            if docs:
                total = len(docs)
                churn = sum(1 for d in docs if d.get("prediction") == "Churn")
                high_risk = sum(1 for d in docs if d.get("probability", 0) >= 0.7)
                rate = churn / total * 100 if total else 0
                response_text += (
                    f"\n\n📈 **Your current stats:** {total} predictions analyzed, "
                    f"{churn} churn ({rate:.1f}% rate), {high_risk} high-risk customers."
                )
        except Exception:
            pass

    return {
        "response": response_text,
        "intent": intent,
        "suggestions": _get_suggestions(intent),
    }


def _get_suggestions(intent: str) -> List[str]:
    suggestions_map = {
        "greeting": ["Why is churn increasing?", "Who are my high-risk customers?", "How can I reduce churn?"],
        "churn_increase": ["What are the top churn causes?", "How can I reduce churn?", "Show retention strategies"],
        "churn_causes": ["How can I reduce churn?", "What is the revenue impact?", "Show high-risk customers"],
        "reduce_churn": ["What discounts work best?", "How does contract type affect churn?", "Show retention simulator"],
        "high_risk": ["What actions should I take?", "What is the revenue at risk?", "How to prioritize customers?"],
        "revenue": ["How can I reduce revenue loss?", "Who are my highest value customers?", "Show churn forecast"],
        "default": ["Why is churn increasing?", "How can I reduce churn?", "What is the revenue impact?"],
    }
    return suggestions_map.get(intent, suggestions_map["default"])
