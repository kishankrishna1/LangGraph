import os
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from graph import workflow
import json

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

@app.route('/chat/stream', methods=['POST'])
def chat_stream():
    """
    Streaming SSE endpoint using LangGraph's stream_mode='messages'.
    Yields individual token chunks as Server-Sent Events for real-time display.
    """
    data = request.get_json()
    if not data or "message" not in data or "thread_id" not in data:
        return jsonify({"error": "Missing message or thread_id"}), 400

    user_message = data.get("message")
    thread_id = data.get("thread_id")
    config = {'configurable': {'thread_id': str(thread_id)}}

    def generate():
        try:
            # stream_mode='messages' yields (message_chunk, metadata) tuples
            # Each message_chunk.content is a token fragment from the LLM
            for message_chunk, metadata in workflow.stream(
                {'messages': [HumanMessage(content=user_message)]},
                config=config,
                stream_mode='messages'
            ):
                if message_chunk.content:
                    payload = json.dumps({"token": message_chunk.content})
                    yield f"data: {payload}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            # Signal the frontend that the stream is complete
            yield "data: [DONE]\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',  # Prevent buffering in Nginx/proxy setups
        }
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
