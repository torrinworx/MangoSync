import os
import time
import traceback
import subprocess
import logging.config
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from ws import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    build_dir = Path("./build")
    logger = logging.getLogger("uvicorn")

    while not build_dir.exists():
        logger.info("Build directory not found. Waiting...")
        time.sleep(2)

    app.mount("/", StaticFiles(directory="./build", html=True), name="static")
    logger.info("Static files mounted successfully.")

    yield


app = FastAPI(lifespan=lifespan, redoc_url=False, docs_url=None)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = "".join(
        traceback.format_exception(type(exc), exc, exc.__traceback__)
    )
    logger = logging.getLogger("uvicorn")
    logger.error(f"Validation Error: {error_details}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn

    env = os.getenv("ENV")
    url = os.getenv("URL")
    parsed_url = urlparse(url)

    if not url:
        raise EnvironmentError("URL is not set.")

    if not parsed_url.hostname or not parsed_url.port:
        raise EnvironmentError("Invalid URL.")

    uvicorn_params = {
        "app": "main:app",
        "host": parsed_url.hostname,
        "port": parsed_url.port,
        "log_level": "info" if env == "development" else "info",
    }

    if env == "development":
        uvicorn_params.update({"reload": True, "reload_dirs": ["backend"]})

        # Start the webpack client with color support
        webpack_process = subprocess.Popen(
            ["npm", "run", "dev", "--", "--color"],
            cwd="frontend",  # Adjust this to your actual frontend directory
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        # Capture webpack output
        def stream_output(process):
            try:
                while True:
                    output = process.stdout.readline()
                    if output == "" and process.poll() is not None:
                        break
                    if output:
                        print(output.strip())
            except Exception as e:
                print(f"Error streaming webpack output: {str(e)}")

        # Stream webpack output in a separate thread
        thread = Thread(target=stream_output, args=(webpack_process,))
        thread.start()

    uvicorn.run(**uvicorn_params)
