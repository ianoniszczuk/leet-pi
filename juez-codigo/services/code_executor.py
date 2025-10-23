import subprocess
import os
import time
import glob
import json
from datetime import datetime
from typing import Dict, List, Tuple
from models.schemas import EvaluationRequest, EvaluationResponse, CompilationResult, ExecutionResult, TestResult

def execute_evaluation(request: EvaluationRequest) -> EvaluationResponse:
    """Execute code evaluation with test cases"""
    start_time = time.time()
    submission_id = request.submissionId
    
    try:
        # Create submissions directory if it doesn't exist
        os.makedirs("/tmp/submissions", exist_ok=True)
        
        # Save source code
        source_file = f"/tmp/submissions/{submission_id}.c"
        exe_file = f"/tmp/submissions/{submission_id}"
        
        with open(source_file, 'w') as f:
            f.write(request.code)
        
        # Compile code
        compilation_result = _compile_code(source_file, exe_file)
        
        if not compilation_result.success:
            return _create_error_response(request, "error", compilation_result, 
                                        ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[]),
                                        0, f"{time.time() - start_time:.3f}s")
        
        # Load and execute test cases
        execution_result = _execute_test_cases(exe_file, request)
        
        # Calculate score
        score = round((execution_result.passedTests / execution_result.totalTests) * 100) if execution_result.totalTests > 0 else 0
        
        # Clean up files
        _cleanup_files(source_file, exe_file)
        
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
        _cleanup_files(f"/tmp/submissions/{submission_id}.c", f"/tmp/submissions/{submission_id}")
        return _create_error_response(request, "error", 
                                    CompilationResult(success=False, errors=str(e)),
                                    ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[]),
                                    0, f"{time.time() - start_time:.3f}s")

def _compile_code(source_file: str, exe_file: str) -> CompilationResult:
    """Compile C code with gcc"""
    compile_command = [
        'gcc', '-o', exe_file, source_file, 
        '-lm', '-std=c99', '-Wall', '-Wextra'
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
    """Execute all test cases for the exercise"""
    test_dir = f"/tests/guide-{request.guideNumber}/exercise-{request.exerciseNumber}"
    
    # Find all test input files
    test_input_files = glob.glob(f"{test_dir}/test-*.in")
    test_input_files.sort()  # Ensure consistent ordering
    
    if not test_input_files:
        return ExecutionResult(totalTests=0, passedTests=0, failedTests=0, testResults=[])
    
    test_results = []
    passed_tests = 0
    failed_tests = 0
    
    for test_input_file in test_input_files:
        test_number = _extract_test_number(test_input_file)
        test_output_file = test_input_file.replace('.in', '.out')
        
        # Execute single test
        test_result = _execute_single_test(exe_file, test_input_file, test_output_file, 
                                         test_number, request.timeout)
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

def _execute_single_test(exe_file: str, input_file: str, output_file: str, 
                        test_number: int, timeout_ms: int) -> TestResult:
    """Execute a single test case"""
    test_start = time.time()
    
    try:
        # Read expected output
        with open(output_file, 'r') as f:
            expected_output = f.read().strip()
        
        # Execute program with test input
        with open(input_file, 'r') as f:
            run_result = subprocess.run(
                [exe_file],
                stdin=f,
                capture_output=True,
                text=True,
                timeout=timeout_ms / 1000.0  # Convert to seconds
            )
        
        execution_time = time.time() - test_start
        
        # Check if execution was successful
        if run_result.returncode != 0:
            return TestResult(
                testNumber=test_number,
                passed=False,
                executionTime=f"{execution_time:.3f}s",
                error="Runtime Error"
            )
        
        # Compare outputs
        actual_output = run_result.stdout.strip()
        
        if actual_output == expected_output:
            return TestResult(
                testNumber=test_number,
                passed=True,
                executionTime=f"{execution_time:.3f}s",
                error=None
            )
        else:
            return TestResult(
                testNumber=test_number,
                passed=False,
                executionTime=f"{execution_time:.3f}s",
                error="Wrong Answer"
            )
            
    except subprocess.TimeoutExpired:
        execution_time = time.time() - test_start
        return TestResult(
            testNumber=test_number,
            passed=False,
            executionTime=f"{execution_time:.3f}s",
            error="Timeout"
        )
    except Exception as e:
        execution_time = time.time() - test_start
        return TestResult(
            testNumber=test_number,
            passed=False,
            executionTime=f"{execution_time:.3f}s",
            error="Runtime Error"
        )

def _extract_test_number(test_file: str) -> int:
    """Extract test number from filename like test-1.in"""
    filename = os.path.basename(test_file)
    try:
        return int(filename.split('-')[1].split('.')[0])
    except:
        return 1

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