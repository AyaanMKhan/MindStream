
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi


def addMindMap(client):
    db = client.GemiHacks
    collection = db.mindmaps

    test = {
            "chunks": [
                { "start": 0.0,  "end": 5.0,  "text": "Let's kick off the meeting by setting goals." },
                { "start": 5.1,  "end": 15.0, "text": "We want to build a mobile-first UI." },
                { "start": 15.1, "end": 25.0, "text": "Alice will design wireframes by Thursday." }
            ]
            }
    
    result = collection.insert_one(test)
    print(f"inserted ID {result.inserted_id}")
    
uri = "mongodb+srv://nagonzalez601:fOCPtYU4wzK3L2Ma@gemiknights.o3brlir.mongodb.net/?retryWrites=true&w=majority&appName=GemiKnights"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
    addMindMap(client)
except Exception as e:
    print(e)

