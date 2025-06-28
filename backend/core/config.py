import os
from dotenv import load_dotenv
import google.generativeai as gemini

load_dotenv()

# DEBUG: see if the key was loaded
print("🔑 GOOGLE_API_KEY is", os.getenv("GOOGLE_API_KEY"))

GEMINI_MODEL = "gemini-1.5-flash-latest"

gemini.configure(api_key=os.getenv("GOOGLE_API_KEY"))
