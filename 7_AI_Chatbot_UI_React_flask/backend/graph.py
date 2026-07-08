from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from typing import TypedDict, Annotated
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_tavily import TavilySearch
from langchain_core.tools import tool
from langgraph.prebuilt import ToolNode, tools_condition
import requests
import os

load_dotenv()
STOCK_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")


llm = ChatOpenAI(model="gpt-4.1-mini")


# ------------ Tools -------------------------
search_tool = TavilySearch(max_results=5, topic="general",)

@tool
def calculator(first_num: float, second_num: float, operation: str) -> dict:
    """
    Perform a basic arithmetic operation on two numbers.
    Supported operations: add, sub, mul, div
    """

    try:
        if operation == "add":
            result = first_num + second_num
        elif operation == "sub":
            result = first_num - second_num
        elif operation == "mul":
            result = first_num * second_num
        elif operation == "div":
            if second_num == 0:
                return {"error": "Division by zero is not allowed"}
            result = first_num / second_num
        else:
            return {"error": f"Unsupported operation '{operation}'"}
        return {"first_num": first_num, "second_num": second_num, "operation": operation, "result": result}
    
    except Exception as e:
        return {"error": str(e)}
    

@tool
def get_stock_price(symbol: str) -> dict:
    """
    Fetch latest stock price for a given symbol (e.g. 'AAPL', 'TSLA')
    using Alpha Vantage with API key in the URL.
    """

    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={STOCK_API_KEY}"
    r = requests.get(url)
    return r.json()


# ------------------ Tool list------------------------------------
tools = [get_stock_price, search_tool, calculator]

# bind tools woth llm
llm_with_tools = llm.bind_tools(tools)


#-------------------- State -------------------------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


def chat_node(state: ChatState):
    messages = state['messages']
    response = llm_with_tools.invoke(messages)
    return {'messages': response}

# Inbuild Tool Node
tool_node = ToolNode(tools) 

checkPointer = MemorySaver()
graph = StateGraph(ChatState)

# Add Node
graph.add_node('chat_node', chat_node)
graph.add_node("tools", tool_node)

# Add Edges
graph.add_edge(START, 'chat_node')
graph.add_conditional_edges("chat_node", tools_condition)
graph.add_edge("tools", "chat_node")
graph.add_edge('chat_node', END)

# Compile graph
workflow = graph.compile(checkpointer=checkPointer)
