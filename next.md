# 다음에 할 작업

## [ ] 앵커 생성 워크플로우 bf16 전환

**파일:** `backend/services/comfyui/workflows/fluxAnchor.js`

현재 `UNETLoader`의 `weight_dtype: 'default'`가 fp8mixed 모델을 그대로 로드함.
8189 서버(A100 40GB)는 VRAM 여유가 충분하므로 bf16 풀 정밀도로 추론 품질 향상 가능.

**변경 포인트:**
- `UNETLoader` → `weight_dtype: 'default'` → `'bf16'`
- `FLUX2_MODEL` 값(`flux2_dev_fp8mixed.safetensors`)도 bf16 체크포인트로 교체 필요
  - bf16 모델 파일이 8189 서버에 없으면 먼저 다운로드
  - `config.js`의 `FLUX2_MODEL` 상수 변경

**확인 순서:**
1. 8189 서버 ComfyUI 모델 목록에서 `flux2_dev_bf16.safetensors` (또는 동등한 이름) 존재 확인
2. `fluxAnchor.js` `weight_dtype` 수정
3. `config.js` `FLUX2_MODEL` 수정
4. 테스트 생성 1장 → 품질/시간 비교
