import os
import subprocess
import time
import logging
from datetime import datetime
from models.schemas import EvaluationRequest, EvaluationResponse, CompilationResult, ExecutionResult, TestResult

_SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_SERVICE_DIR, ".."))
_REPO_ROOT = os.path.abspath(os.path.join(_PROJECT_ROOT, ".."))
_PROJECT_TESTS_PATH = os.path.join(_PROJECT_ROOT, "tests")
_ENV_TESTS_PATH = os.environ.get("TESTS_BASE_PATH")
_TESTS_SEARCH_PATHS = [
    path for path in (
        _ENV_TESTS_PATH,
        "/tests",
        _PROJECT_TESTS_PATH,
    ) if path
]
_ENV_SUBMISSIONS_PATH = os.environ.get("SUBMISSIONS_BASE_PATH")
_SUBMISSIONS_SEARCH_PATHS = [
    path for path in (
        _ENV_SUBMISSIONS_PATH,
        os.path.join(_PROJECT_ROOT, "submissions"),
        os.path.join(_REPO_ROOT, "submissions"),
    ) if path
]
_TMP_SUBMISSIONS_PATH = "/tmp/submissions"
logger = logging.getLogger(__name__)

def execute_evaluation(request: EvaluationRequest) -> EvaluationResponse:
    """Execute code evaluation with test cases"""
    start_time = time.time()
    submission_id = request.submissionId
    submission_paths = _build_submission_paths(submission_id)
    source_file = submission_paths["tmp_source"]
    exe_file = submission_paths["tmp_executable"]
    
    try:
        # Create submissions directory if it doesn't exist
        os.makedirs(_TMP_SUBMISSIONS_PATH, exist_ok=True)
        
        # Save source code
        with open(source_file, 'w') as f:
            f.write(request.code)
        
        # Resolve test harness path
        test_file = _get_test_file_path(request)
        if not os.path.exists(test_file):
            compilation_result = CompilationResult(
                success=False,
                errors=f"Test harness not found for guide {request.guideNumber}, "
                       f"exercise {request.exerciseNumber}"
            )
            return _create_error_response(
                request,
                "error",
                compilation_result,
                ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[]),
                0,
                f"{time.time() - start_time:.3f}s"
            )
        
        # Compile code
        compilation_result = _compile_code(source_file, exe_file, test_file)
        
        if not compilation_result.success:
            return _create_error_response(request, "error", compilation_result, 
                                        ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[]),
                                        0, f"{time.time() - start_time:.3f}s")
        
        # Execute test harness
        execution_result = _execute_test_cases(exe_file, request)
        
        # Calculate score
        score = round((execution_result.passedTests / execution_result.totalTests) * 100) if execution_result.totalTests > 0 else 0
        
        return EvaluationResponse(
            submissionId=request.submissionId,
            status="completed",
            compilation=compilation_result,
            execution=execution_result,
            score=score,
            executionTime=f"{time.time() - start_time:.3f}s",
            memoryUsage="N/A",  # Could be enhanced with actual memory monitoring
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        return _create_error_response(request, "error", 
                                    CompilationResult(success=False, errors=str(e)),
                                    ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[]),
                                    0, f"{time.time() - start_time:.3f}s")
    finally:
        _cleanup_files(
            submission_paths["tmp_source"],
            submission_paths["tmp_executable"],
            *submission_paths["workspace_sources"]
        )

def _compile_code(source_file: str, exe_file: str, test_file: str) -> CompilationResult:
    """Compile user code linked with the exercise test harness"""
    compile_command = [
        'gcc',
        '-std=c23',
        '-Wall',
        '-Wextra',
        source_file,
        test_file,
        '-lm',
        '-o',
        exe_file
    ]

    try:
        compile_result = subprocess.run(
            compile_command,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if compile_result.returncode == 0:
            return CompilationResult(success=True, output=compile_result.stdout)
        else:
            return CompilationResult(success=False, errors=compile_result.stderr)
            
    except subprocess.TimeoutExpired:
        return CompilationResult(success=False, errors="Compilation timeout")
    except Exception as e:
        return CompilationResult(success=False, errors=str(e))

def _execute_test_cases(exe_file: str, request: EvaluationRequest) -> ExecutionResult:
    """Execute the compiled test harness for the exercise"""
    test_results = []
    passed_tests = 0
    failed_tests = 0

    test_result = _execute_single_test(exe_file, request.timeout)
    test_results.append(test_result)

    if test_result.passed:
        passed_tests += 1
    else:
        failed_tests += 1

    return ExecutionResult(
        totalTests=len(test_results),
        passedTests=passed_tests,
        failedTests=failed_tests,
        testResults=test_results
    )

def _execute_single_test(exe_file: str, timeout_ms: int) -> TestResult:
    """Execute the compiled program once and report the result"""
    test_start = time.time()
    
    try:
        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=timeout_ms / 1000.0  # Convert to seconds
        )
        
        execution_time = time.time() - test_start

        if run_result.returncode == 0:
            return TestResult(
                testNumber=1,
                passed=True,
                executionTime=f"{execution_time:.3f}s",
                error=None
            )

        error_details = _build_error_message(
            run_result.returncode,
            run_result.stdout,
            run_result.stderr
        )
        return TestResult(
            testNumber=1,
            passed=False,
            executionTime=f"{execution_time:.3f}s",
            error=error_details
        )
            
    except subprocess.TimeoutExpired:
        execution_time = time.time() - test_start
        return TestResult(
            testNumber=1,
            passed=False,
            executionTime=f"{execution_time:.3f}s",
            error="Timeout"
        )
    except Exception as e:
        execution_time = time.time() - test_start
        return TestResult(
            testNumber=1,
            passed=False,
            executionTime=f"{execution_time:.3f}s",
            error=str(e)
        )

def _build_error_message(return_code: int, stdout: str, stderr: str) -> str:
    """Build a concise error message from process output"""
    stderr = (stderr or "").strip()
    stdout = (stdout or "").strip()
    base_message = f"Process exited with code {return_code}"
    
    if stderr and stdout:
        return f"{base_message}. stderr: {stderr}. stdout: {stdout}"
    if stderr:
        return f"{base_message}. stderr: {stderr}"
    if stdout:
        return f"{base_message}. stdout: {stdout}"
    return base_message

def _get_test_file_path(request: EvaluationRequest) -> str:
    """Resolve the absolute path to the C test harness for the requested exercise"""
    guide_dir = f"guide-{request.guideNumber}"
    exercise_file = f"exercise-{request.exerciseNumber}.c"
    for base_path in _TESTS_SEARCH_PATHS:
        candidate = os.path.join(base_path, guide_dir, exercise_file)
        if os.path.exists(candidate):
            return candidate
    # Fall back to first configured base path so upper logic can report a clear error
    return os.path.join(_TESTS_SEARCH_PATHS[0], guide_dir, exercise_file)

def _build_submission_paths(submission_id: str) -> dict:
    """Prepare the different file locations used during evaluation."""
    workspace_sources = [
        _resolve_submission_path(base_path, submission_id)
        for base_path in _SUBMISSIONS_SEARCH_PATHS
    ]
    # Remove duplicates while preserving order
    seen = set()
    unique_workspace_sources = []
    for path in workspace_sources:
        if path not in seen:
            unique_workspace_sources.append(path)
            seen.add(path)
    return {
        "workspace_sources": unique_workspace_sources,
        "tmp_source": os.path.join(_TMP_SUBMISSIONS_PATH, f"{submission_id}.c"),
        "tmp_executable": os.path.join(_TMP_SUBMISSIONS_PATH, submission_id),
    }

def _resolve_submission_path(base_path: str, submission_id: str) -> str:
    """Resolve the absolute file path for a submission within the given base directory."""
    # If base_path is relative, resolve it from the repo root to keep consistency
    if not os.path.isabs(base_path):
        base_path = os.path.abspath(os.path.join(_REPO_ROOT, base_path))
    return os.path.join(base_path, f"{submission_id}.c")

def _cleanup_files(*files):
    """Clean up temporary files"""
    for file_path in files:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass  # Ignore cleanup errors

def _create_error_response(request: EvaluationRequest, status: str, 
                          compilation: CompilationResult, execution: ExecutionResult,
                          score: int, execution_time: str) -> EvaluationResponse:
    """Create error response"""
    return EvaluationResponse(
        submissionId=request.submissionId,
        status=status,
        compilation=compilation,
        execution=execution,
        score=score,
        executionTime=execution_time,
        memoryUsage="N/A",
        timestamp=datetime.now().isoformat()
    )
