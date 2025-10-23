from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class EvaluationRequest(BaseModel):
    submissionId: str
    guideNumber: int
    exerciseNumber: int
    code: str
    language: str
    timeout: int = 5000
    memoryLimit: int = 256
    timestamp: str

class CompilationResult(BaseModel):
    success: bool
    output: Optional[str] = None
    errors: Optional[str] = None

class TestResult(BaseModel):
    testNumber: int
    passed: bool
    executionTime: str
    error: Optional[str] = None

class ExecutionResult(BaseModel):
    totalTests: int
    passedTests: int
    failedTests: int
    testResults: List[TestResult]

class EvaluationResponse(BaseModel):
    submissionId: str
    status: str  # "completed", "timeout", "error"
    compilation: CompilationResult
    execution: ExecutionResult
    score: int
    executionTime: str
    memoryUsage: str
    timestamp: str