from fastapi import APIRouter, HTTPException
from models.schemas import EvaluationRequest, EvaluationResponse
from services.code_executor import execute_evaluation

# Crear el router con prefijo
router = APIRouter(prefix="/evaluate", tags=["evaluation"])

@router.post("/", response_model=EvaluationResponse)  
def evaluate_code(request: EvaluationRequest):
    # Validate language
    if request.language != "c":
        raise HTTPException(status_code=400, detail="Only C language is supported")
    
    # Execute evaluation
    result = execute_evaluation(request)
    return result

