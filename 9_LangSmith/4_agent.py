from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
import requests
import os
from dotenv import load_dotenv
from langchain_community.tools import DuckDuckGoSearchRun

os.environ['LANGSMITH_PROJECT'] = 'Agent_track_Demo'

load_dotenv()

search_tool = DuckDuckGoSearchRun()

@tool
def get_weather_data(city: str) -> str:
  """
  This function fetches the current weather data for a given city
  """
  url = f'https://api.weatherstack.com/current?access_key=57821ed4455b5299f0fd9f45cb6ffa9c&query={city}'

  response = requests.get(url)

  return response.json()

llm = ChatOpenAI(
    model="gpt-4.1-mini",
    temperature=0
)

agent = create_agent(
    model=llm,
    tools=[search_tool, get_weather_data],
    system_prompt="""
    You are a helpful assistant.
    Use available tools whenever necessary to answer user questions.
    """
)


# Step 5: Invoke
response = agent.invoke(
    {
        "messages": [
            {
                "role": "user",
                "content": "Find the capital of Uttar Pradesh, then find its current weather condition."
            }
        ]
    }
)

# print(response)

print(response["messages"][-1].content)