"""
@file __init__.py
@description Story Engine API - Core nodes and utilities (LoRA upload restored)
"""
import os
from aiohttp import web
try:
    import folder_paths
    from server import PromptServer

    @PromptServer.instance.routes.post("/story_engine/upload/lora")
    async def upload_lora(request):
        reader = await request.multipart()
        field = await reader.next()
        fname = request.headers.get("X-Lora-Filename") or field.filename
        
        # ComfyUI loras path
        lora_paths = folder_paths.get_folder_paths("loras")
        if not lora_paths:
            return web.json_response({"error": "Lora paths not found"}, status=500)
            
        dest = os.path.join(lora_paths[0], fname)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        
        with open(dest, "wb") as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
                
        return web.json_response({"status": "ok", "path": fname})

except Exception as e:
    print(f"[StoryEngineAPI] Boot error: {e}")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
