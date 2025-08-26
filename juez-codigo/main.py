from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import subprocess
import tempfile   
import os        
import time       

app = FastAPI() 

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],  
    allow_headers=["*"],
)

class Item(BaseModel):
    code:str
    exercise:int
    guide:int

class ExecuteResponse(BaseModel):
    success : bool
    output : str
    error: str = None
    execution_time: float

def execute_c_code(code:str) -> dict:
    try: 
        start_time = time.time()

        with tempfile.TemporaryDirectory() as temp_dir:
            source_file = os.path.join(temp_dir, "program.c")
            exe_file = os.path.join(temp_dir, "program")

            with open(source_file, 'w') as f:
                f.write(code)

            compile_result = subprocess.run(
                ['gcc',source_file, '-o', exe_file],
                capture_output=True,
                text=True,
                timeout=10
            )

            if compile_result.returncode != 0:
                return {
                    "success" : False,
                    "output" : "",
                    "error" : "Error de compilacion",
                    "execution_time" : time.time() - start_time
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

@app.get("/")
def read_root():
    return {"mensaje":"HOLA!"}

@app.post("/execute" , response_model=ExecuteResponse)
def executeCode(item:Item):
    result = execute_c_code(item.code)
    return ExecuteResponse(**result)

