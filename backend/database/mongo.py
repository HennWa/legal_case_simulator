from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")

print('---------------------------')
print(MONGO_URI)

client = MongoClient(MONGO_URI)

db = client["legal_case_simulator"]