# AI Chatbot — LangGraph + Flask + React

A conversational chatbot web application powered by **LangGraph** and **OpenAI**, served through a **Flask** API, with a **React + Tailwind CSS** frontend styled as a dark-mode chat interface featuring real-time token streaming.

## Features

- **Real-Time Token Streaming**: Streams response chunks token-by-token from the LLM workflow directly into the chat bubble using Server-Sent Events (SSE).
- **Smooth UI Indicators**: Includes a premium "Thinking..." spinner during latency and a sleek blinking cursor (`▌`) as tokens stream.
- **State-Graph Logic**: Conversational chatbot backed by a LangGraph workflow (`StateGraph`).
- **Memory Checkpointing**: Persistent conversation memory per session via LangGraph's checkpointer (`MemorySaver`).
- **Clean Dark-Mode UI**: A polished dark theme, separating user (right-aligned) and bot (left-aligned) messages.

![AI Chatbot UI](./frontend/src/assets/home_page.png)

## Tech Stack

**Backend**
- Python, Flask
- LangGraph
- LangChain (`langchain-openai`)
- OpenAI API (`gpt-4.1-mini`)
- flask-cors

**Frontend**
- React (Vite)
- Tailwind CSS

## Project Structure

```
chatbot-app/
├── backend/
│   ├── app.py            # Flask entry point (routes, SSE streaming)
│   ├── graph.py           # LangGraph workflow (StateGraph, chat_node)
│   ├── requirements.txt
│   └── .env               # OPENAI_API_KEY (not committed)
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── Header.jsx
│   │   ├── App.jsx        # App state & SSE stream processing
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

## How It Works

1. The user types a message in the React chat UI.
2. The frontend sends a `POST /chat/stream` request to the Flask backend with the message and a `thread_id`.
3. The Flask backend uses LangGraph's `workflow.stream(..., stream_mode='messages')` to process the state and read LLM token chunks as they generate.
4. Flask yields these tokens as Server-Sent Events (`data: {"token": "..."}`).
5. The React frontend reads the response body stream chunk-by-chunk using a `ReadableStream` reader, parsing the JSON events and updating the bot bubble state in real time.
6. LangGraph's `MemorySaver` checkpointer manages the conversation state history across messages per `thread_id`.

## API Reference

### **POST** `/chat/stream` (Streaming)

Initiates a Server-Sent Event stream for the conversation response.

**Request body:**
```json
{
  "message": "Write a poem about coding.",
  "thread_id": "abc123"
}
```

**Streamed event format:**
```
data: {"token": "Code "}

data: {"token": "flows "}

...

data: [DONE]
```

### **POST** `/chat` (Non-streaming)

Standard non-streaming route returning the complete response in a single batch.

**Request body:**
```json
{
  "message": "Hello",
  "thread_id": "abc123"
}
```

**Response body:**
```json
{
  "response": "Hi there! How can I help you today?"
}
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- An OpenAI API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

Run the backend:
```bash
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) with the backend running at `http://localhost:5000`.

## Future Improvements
- Multiple chat threads / conversation history sidebar
- User authentication
- Persistent storage (database) instead of in-memory checkpointing

## License
This project is licensed under the MIT License.

