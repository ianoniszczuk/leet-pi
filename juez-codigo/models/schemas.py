from pydantic import BaseModel

class Item(BaseModel):
    code:str
    exercise:int
    guide:int

class ExecuteResponse(BaseModel):
    success : bool
    output : str
    error: str = None
    execution_time: float