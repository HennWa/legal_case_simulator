# backend/tests/conftest.py

import os


# ------------------------------------------------------------------
# Test environment
# ------------------------------------------------------------------
#
# These values are set before pytest imports the backend modules.
#
# This ensures:
# - tests never accidentally use development authentication
# - tests never require the real MongoDB connection string
# - no production database is touched
#
# Individual tests mock repositories, so this MongoDB URI is never
# actually contacted.
# ------------------------------------------------------------------

os.environ["APP_ENV"] = "test"
os.environ["AUTH_MODE"] = "test"

os.environ["MONGODB_URI"] = (
    "mongodb://localhost:27017/"
)

os.environ["MONGODB_DATABASE"] = (
    "legal_case_simulator_test"
)

os.environ["MONGODB_VECTOR_DATABASE"] = (
    "legal_case_simulator_test"
)