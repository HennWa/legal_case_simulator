from database.mongo import db


class VectorRepository:

    def __init__(self):
        self.collection = db["law_embeddings"]