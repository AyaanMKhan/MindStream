
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://nagonzalez601:fOCPtYU4wzK3L2Ma@gemiknights.o3brlir.mongodb.net/?retryWrites=true&w=majority&appName=GemiKnights"


async def connect_db():
    global client, database
    uri = "mongodb+srv://nagonzalez601:fOCPtYU4wzK3L2Ma@gemiknights.o3brlir.mongodb.net/?retryWrites=true&w=majority&appName=GemiKnights"

    client = MongoClient(uri, server_api=ServerApi('1'))
    database = client.GemiHacks
    print("connected to MongoDB")
    

async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")
# Create a new client and connect to the server
# client = MongoClient(uri, server_api=ServerApi('1'))
# db = client.GemiHacks