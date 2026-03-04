import os
import select as _select
import signal
import subprocess
import threading
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
        execution_result, peak_memory_kb, exec_time_str = _execute_test_cases(exe_file, request)

        # Calculate score
        score = round((execution_result.passedTests / execution_result.totalTests) * 100) if execution_result.totalTests > 0 else 0

        return EvaluationResponse(
            submissionId=request.submissionId,
            status="completed",
            compilation=compilation_result,
            execution=execution_result,
            score=score,
            executionTime=exec_time_str,
            memoryUsage=_format_memory(peak_memory_kb),
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

def _execute_test_cases(exe_file: str, request: EvaluationRequest) -> tuple[ExecutionResult, int, str]:
    """Execute the compiled test harness for the exercise.
    Returns (ExecutionResult, peak_memory_kb, execution_time_str)."""
    test_results = []
    passed_tests = 0
    failed_tests = 0
    peak_memory_kb = 0

    test_result, memory_kb = _execute_single_test(exe_file, request.timeout)
    test_results.append(test_result)
    peak_memory_kb = max(peak_memory_kb, memory_kb)

    if test_result.passed:
        passed_tests += 1
    else:
        failed_tests += 1

    return ExecutionResult(
        totalTests=len(test_results),
        passedTests=passed_tests,
        failedTests=failed_tests,
        testResults=test_results
    ), peak_memory_kb, test_result.executionTime

def _execute_single_test(exe_file: str, timeout_ms: int) -> tuple[TestResult, int]:
    """Execute the compiled program once.
    - Time:   rusage.ru_utime (pure user-space CPU time, no fork/exec/OS overhead).
    - Memory: peak VmRSS read from /proc/<pid>/status while the process runs
              (reflects only the exec'd binary + its libraries, not the Python parent).
    Returns (TestResult, peak_memory_kb)."""
    timeout_s = timeout_ms / 1000.0

    proc = subprocess.Popen(
        [exe_file],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout_fd = proc.stdout.fileno()
    stderr_fd = proc.stderr.fileno()

    # Monitor VmRSS from /proc while the process runs.
    # This reads the actual RSS of the exec'd binary, not the Python parent's RSS.
    peak_rss_kb = [0]
    stop_event = threading.Event()

    def _monitor_rss() -> None:
        status_path = f"/proc/{proc.pid}/status"
        while not stop_event.is_set():
            try:
                with open(status_path) as f:
                    for line in f:
                        if line.startswith("VmRSS:"):
                            kb = int(line.split()[1])
                            if kb > peak_rss_kb[0]:
                                peak_rss_kb[0] = kb
                            break
            except (FileNotFoundError, ProcessLookupError, ValueError):
                break
            stop_event.wait(0.001)  # poll every 1 ms

    mon = threading.Thread(target=_monitor_rss, daemon=True)
    mon.start()

    timed_out = False
    stdout_chunks: list[bytes] = []
    stderr_chunks: list[bytes] = []
    active = {stdout_fd, stderr_fd}
    deadline = time.monotonic() + timeout_s

    while active:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            timed_out = True
            proc.kill()
            break
        ready, _, _ = _select.select(list(active), [], [], min(remaining, 0.05))
        for fd in ready:
            chunk = os.read(fd, 4096)
            if not chunk:
                active.discard(fd)
            elif fd == stdout_fd:
                stdout_chunks.append(chunk)
            else:
                stderr_chunks.append(chunk)

    stop_event.set()
    mon.join(timeout=0.2)
    proc.stdout.close()
    proc.stderr.close()

    # wait4 gives per-child rusage without polluting RUSAGE_CHILDREN
    _, raw_status, rusage = os.wait4(proc.pid, 0)

    # Pure user-space CPU time — excludes fork/exec/pipe/OS overhead entirely
    cpu_time_s: float = rusage.ru_utime
    peak_memory_kb: int = peak_rss_kb[0]  # from /proc monitoring

    if timed_out:
        return TestResult(
            testNumber=1,
            passed=False,
            executionTime=_format_time(cpu_time_s),
            error="Timeout"
        ), peak_memory_kb

    returncode = os.waitstatus_to_exitcode(raw_status)
    stdout = b"".join(stdout_chunks).decode("utf-8", errors="replace")
    stderr = b"".join(stderr_chunks).decode("utf-8", errors="replace")

    if returncode == 0:
        return TestResult(
            testNumber=1,
            passed=True,
            executionTime=_format_time(cpu_time_s),
            error=None
        ), peak_memory_kb

    error_details = _build_error_message(returncode, stdout, stderr)
    return TestResult(
        testNumber=1,
        passed=False,
        executionTime=_format_time(cpu_time_s),
        error=error_details
    ), peak_memory_kb

def _format_memory(kb: int) -> str:
    """Convert a peak VmRSS value in KB to a human-readable string."""
    if kb <= 0:
        return "N/A"
    if kb >= 1024:
        return f"{kb / 1024:.1f} MB"
    return f"{kb} KB"

def _format_time(seconds: float) -> str:
    """Format CPU time: always show ms for sub-second runs, s otherwise."""
    if seconds < 1.0:
        return f"{seconds * 1000:.2f} ms"
    return f"{seconds:.3f} s"

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
