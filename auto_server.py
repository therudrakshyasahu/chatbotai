import sys
import subprocess
import os
import time

# --- PART 1: AUTO-INSTALLER ---
# This runs BEFORE any imports to ensure libraries exist
def install_dependencies():
    print("🔧 CHECKING LIBRARIES...")
    required = [
        "fastapi", 
        "uvicorn", 
        "python-multipart",
        "langchain==0.1.16",           # We specify exact versions to prevent conflicts
        "langchain-community==0.0.34", 
        "langchain-core==0.1.45", 
        "langchain-google-genai", 
        "langchain-text-splitters",
        "chromadb", 
        "pypdf"
    ]
    
    # We use sys.executable to make sure we install to THIS specific Python
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + required)
        print("✅ Libraries installed successfully.\n")
    except Exception as e:
        print(f"❌ Failed to install libraries: {e}")
        exit(1)

# Run the installer
if __name__ == "__main__":
    # Check for file shadowing (Common error)
    if os.path.exists("langchain.py"):
        print("❌ CRITICAL ERROR: You have a file named 'langchain.py' in this folder.")
        print("   Please DELETE or RENAME it, or Python will break.")
        input("   Press Enter after deleting it...")
        exit(1)
    
    install_dependencies()


import shutil
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn


from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain.chains import retrieval_qa


os.environ["GOOGLE_API_KEY"] = "AIzaSyA7l2EY8Z4VHMWC44_fCc-8xxXeWUdiP3g" 

UPLOAD_DIR = "./uploaded_docs"
DB_DIR = "./chroma_db"

app = FastAPI(title="Academic RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🚀 Initializing AI Models...")
try:
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    vector_store = Chroma(persist_directory=DB_DIR, embedding_function=embeddings)
    print("✅ System Ready!")
except Exception as e:
    print(f"❌ Initialization Error: {e}")

class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

def process_pdf(file_path):
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    vector_store.add_documents(texts)
    return len(texts)

@app.get("/")
def read_root():
    return {"status": "Online"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not os.path.exists(UPLOAD_DIR): os.makedirs(UPLOAD_DIR)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    count = process_pdf(file_path)
    return {"message": "Success", "chunks_added": count}

@app.post("/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    prompt_template = """Use the context to answer. Context: {context} Question: {question} Answer:"""
    PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    qa_chain = retrieval_qa.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, return_source_documents=True, chain_type_kwargs={"prompt": PROMPT})
    result = qa_chain.invoke({"query": request.question})
    sources = [doc.metadata.get("source", "Unknown") for doc in result.get("source_documents", [])]
    return QueryResponse(answer=result["result"], sources=list(set(sources)))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)