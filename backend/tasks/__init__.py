import os
import json
import inspect
import asyncio
import pathlib
import importlib.util
from functools import wraps
from fastapi import WebSocket

def task(name: str = None):
    def annotator(f):
        f._task_meta = {"name": name}

        @wraps(f)
        async def async_handler(*args, **kwargs):
            return await f(*args, **kwargs)

        @wraps(f)
        def sync_handler(*args, **kwargs):
            return f(*args, **kwargs)

        return async_handler if asyncio.iscoroutinefunction(f) else sync_handler

    return annotator

class Tasks:
    __instance = None

    def __new__(cls, *args, **kwargs):
        if cls.__instance is None:
            cls.__instance = super(Tasks, cls).__new__(cls)
            cls.__instance.__init_once(*args, **kwargs)
        return cls.__instance

    def __init_once(self, dir_path="."):
        if getattr(self, '_is_initialized', False):
            return
        self._is_initialized = True

        self.directory = os.path.abspath(dir_path)
        self.tasks = []
        self._get_tasks()

    def _get_tasks(self):
        task_files = self._find_task_files()
        for filepath in task_files:
            self._load_tasks_from_file(filepath)

    def _find_task_files(self):
        return [
            filepath for filepath in pathlib.Path(self.directory, 'backend', 'tasks').rglob("*.py")
            if filepath.name != "__init__.py"
        ]

    def _load_tasks_from_file(self, filepath):
        module_name = os.path.splitext(os.path.basename(filepath))[0]
        spec = importlib.util.spec_from_file_location(module_name, filepath)
        module = importlib.util.module_from_spec(spec)
        
        if spec.loader:
            spec.loader.exec_module(module)
            self._extract_tasks_from_module(module)

    def _extract_tasks_from_module(self, module):
        for attr in dir(module):
            fn = getattr(module, attr)
            if callable(fn) and hasattr(fn, '_task_meta'):
                task_info = getattr(fn, '_task_meta')
                description = fn.__doc__ if fn.__doc__ else ""
                self.tasks.append({
                    "title": task_info.get("title", fn.__name__),
                    "description": task_info.get("description", description),
                    "function": fn,
                })

    async def task_handler(self, msg, ws: WebSocket):
        """
        Handles task execution requests received over a WebSocket connection.

        Args:
            payload: The data received from the WebSocket client.
            ws: The WebSocket connection instance.

        Returns:
            Sends the execution result or error message back over the WebSocket connection.
        """

        payload = json.loads(msg)
        task_name = payload.get("title")
        task_item = next((task for task in self.tasks if task.get("title") == task_name), None)

        if not task_item:
            await ws.send_text(json.dumps({"status": "error", "message": f"Task '{task_name}' not found."}))
            return

        try:
            task_func = task_item.get("function")
            params = inspect.signature(task_func).parameters

            context_args = {
                'payload': payload,
                'ws': ws,
            }
            provided_args = payload.get('args', {})

            # Include context_args if **kwargs is acceptable
            if any(param.kind == inspect.Parameter.VAR_KEYWORD for param in params.values()):
                provided_args.update(context_args)
            else: # Include only specified args
                for arg_key, arg_val in context_args.items():
                    if arg_key in params:
                        provided_args[arg_key] = arg_val

            if inspect.iscoroutinefunction(task_func):
                result = await task_func(**provided_args)
            else:
                result = task_func(**provided_args)

            await ws.send_text(json.dumps(result))
        except Exception as ex:
            await ws.send_text(json.dumps({"status": "error", "message": f"Task '{task_name}' encountered an error: {str(ex)}"}))
