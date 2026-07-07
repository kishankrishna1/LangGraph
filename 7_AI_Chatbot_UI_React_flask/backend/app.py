import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from graph import workflow

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        
        user_message = data.get("message")
        thread_id = data.get("thread_id")
        
        if not user_message:
            return jsonify({"error": "Missing 'message' field"}), 400
        if not thread_id:
            return jsonify({"error": "Missing 'thread_id' field"}), 400
        
        # Configure thread for MemorySaver
        config = {'configurable': {'thread_id': str(thread_id)}}
        
        # Invoke the LangGraph workflow
        state_output = workflow.invoke(
            {'messages': [HumanMessage(content=user_message)]}, 
            config=config
        )
        
        # Get response from last message in state
        bot_response = state_output['messages'][-1].content
        
        return jsonify({"response": bot_response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
