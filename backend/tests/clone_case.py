from backend.database.repositories.user_repository import (
    UserRepository,
)
from backend.services.demo_graph_service import (
    DemoGraphService,
)


user_repository = UserRepository()

user = user_repository.get(
    "usr_dev_henning"
)

service = DemoGraphService()

demo_case = (
    service.ensure_demo_graph_for_user(
        user
    )
)

print(
    demo_case.model_dump(
        mode="json"
    )
)