from pydantic import BaseModel
from typing import List, Optional

class CountExecutionItem(BaseModel):
    item_code: str
    physical_qty: float

class CountExecutionRequest(BaseModel):
    date: str
    items: List[CountExecutionItem]

class SlottingDecision(BaseModel):
    item_code: str
    final_bin: str
    sic_code: Optional[str] = None
