import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

router = APIRouter(prefix="/tests", tags=["tests"])

_TESTS_BASE_PATH = os.environ.get("TESTS_BASE_PATH") or "/tests"


def _get_harness_path(guide_number: int, exercise_number: int) -> str:
    return os.path.join(_TESTS_BASE_PATH, f"guide-{guide_number}", f"exercise-{exercise_number}.c")


@router.post("/upload")
async def upload_test_file(
    guideNumber: int = Form(...),
    exerciseNumber: int = Form(...),
    file: UploadFile = File(...),
):
    if not file.filename or not file.filename.lower().endswith(".c"):
        raise HTTPException(status_code=400, detail="Only .c files are allowed")

    guide_dir = os.path.join(_TESTS_BASE_PATH, f"guide-{guideNumber}")
    os.makedirs(guide_dir, exist_ok=True)

    dest_path = _get_harness_path(guideNumber, exerciseNumber)
    contents = await file.read()

    with open(dest_path, "wb") as f:
        f.write(contents)

    return {"message": f"Test file uploaded to {dest_path}"}


@router.delete("/{guide_number}/{exercise_number}")
def delete_test_file(guide_number: int, exercise_number: int):
    path = _get_harness_path(guide_number, exercise_number)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Test file not found")
    os.remove(path)
    return {"message": f"Test file deleted: {path}"}


@router.get("/{guide_number}/{exercise_number}")
def download_test_file(guide_number: int, exercise_number: int):
    path = _get_harness_path(guide_number, exercise_number)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="Test file not found")
    return FileResponse(
        path,
        media_type="text/plain",
        filename=f"exercise-{exercise_number}.c",
    )
