# 07. 에셋 생명주기 및 오토 바인딩

## 에셋 생명주기

모든 에셋은 동일한 생애를 따른다.

```
최초 등장 → 프롬프트 등록 (자동, 음성 즉시 배정)
  ↓ 반복 등장
승격 제안 (시스템, 3회 이상 등장) 또는 사용자 직접 선택
  ↓
3단계 진입: 앵커 → 파생 → 필터 → LoRA
  ↓
LORA 상태로 전환, 이후 자동 바인딩
```

## 에셋 등록 시점

### 1단계 (대본 입력)
- LLM이 추출한 JSON에서 일괄 등록
- 전부 `visual_strategy: PROMPT`
- 음성 즉시 배정

### 4단계 (에피소드 생성 중)
- 골격 생성 시 LLM이 만든 신규 asset_id 자동 감지
- 사용자 확인 후 즉석 등록
- `visual_strategy: PROMPT` + 음성 즉시 배정

## 에셋 상태 머신 (pipeline_status)

```
REGISTERED
  ↓
ANCHOR_SET (앵커 이미지 확정)
  ↓
DERIVATIVES_DONE (파생 이미지 생성 완료)
  ↓  ← 실패 시: 파생 재생성
FILTERED (얼굴 필터 통과)
  ↓  ← 실패 시: 재생성 + 재필터
LORA_TRAINED (LoRA 학습 완료)
  ↓  ← 실패 시: 재학습
AUDIO_MAPPED (음성/SFX 확정)
```

- 각 단계에서 실패하면 이전 성공 단계에서 재시도
- 음성 배정(AUDIO_MAPPED)은 등록 시점에 이미 완료되므로, 실질적으로 REGISTERED 직후에 AUDIO_MAPPED와 동시에 진행됨

## 시각 전략 (visual_strategy)

| 전략 | 의미 | 렌더링 시 |
|------|------|-----------|
| PROMPT | LoRA 미학습. 텍스트 묘사만 있음 | appearance_prompt를 render_prompt에 합침 |
| LORA | LoRA 학습 완료 | trigger_word + lora_path를 lora_requirements에 주입 |

## 오토 바인딩

에피소드의 샷이 생성된 후, 각 샷의 `referenced_assets`를 DB에서 조회하여 실행 가능한 지시서로 변환하는 과정.

### 시각 바인딩

```
for each asset in shot.referenced_assets:
  asset = DB.lookup(asset_id)
  
  if asset.visual_strategy == 'LORA':
    shot.lora_requirements.push({
      trigger_word: asset.trigger_word,
      path: asset.lora_path,
      weight: 0.8,
      fallback_prompt: asset.appearance_prompt
    })
    // render_prompt에 trigger_word 삽입
    
  else if asset.visual_strategy == 'PROMPT':
    // render_prompt에 appearance_prompt 텍스트 보강 삽입
```

### 오디오 바인딩

```
for each dialogue in shot.dialogues:
  asset = DB.lookup(dialogue.speaker_asset)
  dialogue.tts_voice_id = asset.audio_identifier
  dialogue.apply_lipsync = true

for each asset in shot.referenced_assets:
  if asset.audio_type == 'SFX' and asset.audio_identifier:
    shot.sfx.push(asset.audio_identifier)
```

### fallback_prompt

lora_requirements의 각 항목에 `fallback_prompt`가 포함된다. Video Factory에서 LoRA 파일 로드에 실패하면 이 텍스트로 렌더링을 이어갈 수 있다. 유니버설 폴백 철학의 연장.

## 승격 제안 로직

```
에셋의 appearance_count >= 3 
AND visual_strategy == 'PROMPT'
→ "이 에셋을 LoRA로 고정하시겠습니까?" 알림
```

- 에피소드 확정 시 등장 에셋의 appearance_count를 +1
- 알림은 에피소드 확정 후 표시
- 결정은 사용자 몫. 무시해도 됨
