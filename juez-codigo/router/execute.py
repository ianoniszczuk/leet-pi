from fastapi import APIRouter
from models.schemas import Item, ExecuteResponse
from services.code_executor import execute_c_code

# Crear el router con prefijo
router = APIRouter(prefix="/execute", tags=["execution"])

@router.post("/", response_model=ExecuteResponse)  
def execute_code(item: Item):
    result = execute_c_code(item.code)
    return ExecuteResponse(**result)

