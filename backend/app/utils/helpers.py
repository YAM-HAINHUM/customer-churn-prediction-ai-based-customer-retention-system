"""
Shared helper utilities: ObjectId serialization, pagination, CSV export.
"""
from bson import ObjectId
from datetime import datetime
from typing import Any


def serialize_doc(doc: dict) -> dict:
    """
    Recursively convert MongoDB document to JSON-serializable dict.
    Converts ObjectId → str and datetime → ISO string.
    """
    if doc is None:
        return {}
    result = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            result[k] = str(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, dict):
            result[k] = serialize_doc(v)
        elif isinstance(v, list):
            result[k] = [serialize_doc(i) if isinstance(i, dict) else i for i in v]
        else:
            result[k] = v
    return result


def paginate(items: list, page: int, page_size: int) -> dict:
    """Calculate pagination metadata."""
    total = len(items)
    total_pages = max(1, -(-total // page_size))  # ceiling division
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
