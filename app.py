from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/simplify", methods=["POST"])
def simplify():
    data = request.get_json()
    text = data.get("text", "")

    # TODO: replace this with real AI call (Gemini/OpenAI/etc.)
    # Simple dummy simplifier: shorten and add bullets
    sentences = text.split(".")
    short = ". ".join(sentences[:3])
    simplified = "• " + short.replace(". ", ".\n• ")

    return jsonify({"simplified": simplified})

if __name__ == "__main__":
    app.run(debug=True)
