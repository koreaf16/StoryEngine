"""
@file __init__.py
@description Story Engine API — ComfyUI 커스텀 엔드포인트.
    POST /story_engine/upload/lora : 백엔드가 Oracle DB BLOB에서 꺼낸 LoRA를
    ComfyUI loras 폴더로 직접 배포한다. 업로드 후 파일 목록 캐시를 초기화해
    다음 워크플로우 검증 시 새 파일이 즉시 인식된다.
@usage Story Engine 백엔드의 comfyui.deployLora() 호출 → 이 엔드포인트 수신
@connects folder_paths (ComfyUI 내장), aiohttp (ComfyUI 웹서버)
"""
import os
from aiohttp import web
import folder_paths

try:
    from server import PromptServer

    @PromptServer.instance.routes.post("/story_engine/upload/lora")
    async def upload_lora(request):
        reader = await request.multipart()
        field = await reader.next()
        if field is None:
            return web.json_response({"error": "No file in request"}, status=400)

        # X-Lora-Filename 헤더 우선, 없으면 multipart filename 사용
        raw_name = request.headers.get("X-Lora-Filename") or field.filename or ""

        # 경로 정규화 (백슬래시/슬래시 통일) 및 경로 순회 공격 방지
        parts = [p for p in raw_name.replace("\\", "/").split("/") if p]
        if not parts or any(p in (".", "..") for p in parts) or len(parts) > 3:
            return web.json_response({"error": "Invalid filename"}, status=400)

        lora_base = folder_paths.get_folder_paths("loras")[0]
        dest_path = os.path.join(lora_base, *parts)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)

        with open(dest_path, "wb") as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)

        # ComfyUI 파일 목록 캐시 초기화 — 이후 워크플로우 검증 시 새 파일 인식
        if hasattr(folder_paths, "filename_list_cache"):
            folder_paths.filename_list_cache.pop("loras", None)

        saved_name = os.sep.join(parts)
        size = os.path.getsize(dest_path)
        print(f"[StoryEngineAPI] LoRA deployed: {saved_name} ({size:,} bytes)")
        return web.json_response({"status": "ok", "filename": saved_name, "size": size})

except Exception as e:
    print(f"[StoryEngineAPI] Failed to register routes: {e}")

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
