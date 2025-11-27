from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash')

@app.route('/simplify', methods=['POST'])
def simplify():
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"simplified": "No text provided."})

    try:
        # STRICTER PROMPT
        prompt = f"""
        You are an assistive technology. Summarize the text below for a user with learning difficulties.
        
        STRICT RULES:
        1. Do NOT include introductory text like "Here is a summary" or "Sure!".
        2. Do NOT use markdown headers (like ### or ***).
        3. Start directly with the first bullet point.
        4. Use simple English.
        
        Text: {text[:3000]}
        """
        
        response = model.generate_content(prompt)
        # Extra safety: Strip leading/trailing whitespace
        clean_text = response.text.strip()
        return jsonify({"simplified": clean_text})
        
    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({"simplified": "Error processing text."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)