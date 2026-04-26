import os
from groq import AsyncGroq
import traceback

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from .env file")
    return AsyncGroq(api_key=api_key)

from pathlib import Path

def load_faqs():
    """Reads the FAQ text file to act as our RAG Knowledge Base."""
    try:
        # Resolve path relative to this file's parent directory (ai_services/)
        faq_path = Path(__file__).resolve().parent.parent / "faqs.txt"
        with open(faq_path, "r") as file:
            return file.read()
    except FileNotFoundError:
        print("WARNING: faqs.txt not found. AI will answer without context.")
        return "No specific company policies provided."

async def generate_reply(user_message: str, user_id: str) -> str:
    """Calls Llama 3 using Retrieval-Augmented Generation (RAG)."""
    client = get_groq_client()
    
    # 1. Retrieve the Knowledge
    company_knowledge = load_faqs()
    
    # 2. Augment the Prompt 
    system_prompt = f"""
    You are a helpful, empathetic customer support agent for a clothing brand. 
    Always base your answers strictly on the COMPANY FAQ below. 
    If the user asks something not in the FAQ, politely say you don't know and will connect them to a human agent.
    Keep your responses concise and natural.
    
    {company_knowledge}
    """
    
    # 3. Generate the Answer
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3, # Lower temperature makes the AI more factual and less likely to hallucinate
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print("Groq API Error:")
        traceback.print_exc()
        raise e