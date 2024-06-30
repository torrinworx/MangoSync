import os
import subprocess
import traceback
import logging.config as logging
from urllib.parse import urlparse
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI(redoc_url=False, docs_url=None)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = "".join(
        traceback.format_exception(type(exc), exc, exc.__traceback__)
    )
    print(f"Validation Error: {error_details}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files in production
if os.getenv("ENV") == "production":
    build_path = os.path.join(os.path.dirname(__file__), '../build')
    app.mount("/", StaticFiles(directory=build_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(os.path.join(build_path, 'index.html'))

logging.dictConfig({
    "version": 1,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(message)s",
            "use_colors": None,
        }
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        }
    },
    "loggers": {
        "uvicorn": {
            "handlers": ["default"],
            "level": 'INFO',
        }
    },
})

if __name__ == "__main__":
    import uvicorn
    import atexit

    env = os.getenv("ENV")

    url = os.getenv("URL")
    if not url:
        raise EnvironmentError("URL is not set.")

    parsed_url = urlparse(url)
    host = parsed_url.hostname
    port = parsed_url.port

    if not host or not port:
        raise EnvironmentError("Invalid URL.")
    
    uvicorn_params = {
        "app": "main:app",
        "host": host,
        "port": port,
        "log_level": "debug" if env == 'development' else "info"
    }

    webpack_process = None

    # Start Webpack Dev Server in development mode
    if env == "development":
        webpack_process = subprocess.Popen(["npm", "start"], cwd="./frontend")
        print("Started Webpack Dev Server for hot reloading.")

        # Ensure the subprocess is terminated when the script exits
        atexit.register(webpack_process.terminate)

        uvicorn_params.update({
            "reload": True,
            "reload_dirs": ["backend"]
        })

    uvicorn.run(**uvicorn_params)
import os
import subprocess
import traceback
import logging.config as logging
from urllib.parse import urlparse
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI(redoc_url=False, docs_url=None)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_details = "".join(
        traceback.format_exception(type(exc), exc, exc.__traceback__)
    )
    print(f"Validation Error: {error_details}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files in production
if os.getenv("ENV") == "production":
    build_path = os.path.join(os.path.dirname(__file__), '../build')
    app.mount("/", StaticFiles(directory=build_path, html=True), name="static")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        return FileResponse(os.path.join(build_path, 'index.html'))

logging.dictConfig({
    "version": 1,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(message)s",
            "use_colors": None,
        }
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        }
    },
    "loggers": {
        "uvicorn": {
            "handlers": ["default"],
            "level": 'INFO',
        }
    },
})

if __name__ == "__main__":
    import uvicorn
    import atexit

    env = os.getenv("ENV")

    url = os.getenv("URL")
    if not url:
        raise EnvironmentError("URL is not set.")

    parsed_url = urlparse(url)
    host = parsed_url.hostname
    port = parsed_url.port

    if not host or not port:
        raise EnvironmentError("Invalid URL.")
    
    uvicorn_params = {
        "app": "main:app",
        "host": host,
        "port": port,
        "log_level": "debug" if env == 'development' else "info"
    }

    webpack_process = None

    # Start Webpack Dev Server in development mode
    if env == "development":
        webpack_process = subprocess.Popen(["npm", "start"], cwd="./frontend")
        print("Started Webpack Dev Server for hot reloading.")

        # Ensure the subprocess is terminated when the script exits
        atexit.register(webpack_process.terminate)

        uvicorn_params.update({
            "reload": True,
            "reload_dirs": ["backend"]
        })

    uvicorn.run(**uvicorn_params)
