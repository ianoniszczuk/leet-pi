import subprocess
import tempfile
import os
import time

def execute_c_code(code: str) -> dict:
    try: 
        start_time = time.time()

         # Flags por defecto
        gcc_flags = ['-Wall', '-Wextra', '-std=c99']

        with tempfile.TemporaryDirectory() as temp_dir:
            source_file = os.path.join(temp_dir, "program.c")
            exe_file = os.path.join(temp_dir, "program")

            with open(source_file, 'w') as f:
                f.write(code)

            compile_command = ['gcc'] + gcc_flags + [source_file, '-o', exe_file]

            compile_result = subprocess.run(
                compile_command,
                capture_output=True,
                text=True,
                timeout=10
            )

            if compile_result.returncode != 0:
                return {
                    "success": False,
                    "output": "",
                    "error": "Error de compilacion",
                    "execution_time": time.time() - start_time
                }
            
            run_result = subprocess.run(
                [exe_file],
                capture_output=True,
                text=True,
                timeout=5
            )

            return {
                "success": run_result.returncode == 0,
                "output": run_result.stdout,
                "error": run_result.stderr if run_result.stderr else "",
                "execution_time": time.time() - start_time
            }

    except Exception as e:
        return {
            "success": False,
            "output": "",
            "error": str(e),
            "execution_time": 0.0
        }