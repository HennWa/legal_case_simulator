from fastapi import APIRouter
from backend.database.repositories.case_repository import CaseRepository

router = APIRouter()

@router.get("/cases/{owner_id}")
def get_cases(owner_id: str):

    repo = CaseRepository()
    cases = repo.get_by_owner_id(owner_id)

    cases_json = [case.model_dump(mode="json") for case in cases]

    return cases_json