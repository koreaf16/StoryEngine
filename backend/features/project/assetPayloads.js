/**
 * @file features/project/assetPayloads.js
 * @description assets 조회 row를 프런트엔드 응답 payload로 변환하는 헬퍼.
 * @usage features/project/router.js에서 프로젝트 상세 응답 조립 시 사용.
 * @connects features/project/derivedImagePayloads.js
 * @doc docs/04-visual-factory.md, docs/06-database.md
 */
const { logWarn } = require('../../app/logger');

function readClob(val) {
  if (!val) return null;
  if (typeof val === 'object' && typeof val.getData === 'function') return val.getData();
  return val;
}

function parseJsonField(val) {
  if (!val) return null;
  const raw = readClob(val);
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (err) {
      logWarn('assetPayloads.parseJsonField', 'Failed to parse JSON field, returning raw value', { preview: raw.slice(0, 200) });
      return raw;
    }
  }
  return raw;
}

function buildLoraResult(triggerWord, loraPath, loraFilename) {
  if (!triggerWord && !loraPath && !loraFilename) return null;
  return {
    trigger_word: triggerWord || null,
    lora_path: loraPath || null,
    lora_filename: loraFilename || null,
  };
}

function buildAssetPayload(row) {
  const [
    assetId, assetType, displayName, appearancePrompt,
    visualStrategy, audioType, voiceHint, pipelineStatus,
    profileStatus, personality, speechStyle, backstory, behavioralRules,
    anchorImageId, anchorEmbedding, triggerWord, loraPath, loraFilename,
    outfitPrompt, outfitAnchorId, isProtagonist
  ] = row;

  const parseStr = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (err) {
        logWarn('assetPayloads.parseStr', 'Failed to parse JSON string, returning raw value', { preview: val.slice(0, 200) });
        return val;
      }
    }
    return val;
  };

  return {
    asset_id: assetId,
    asset_type: assetType,
    display_name: displayName,
    appearance_prompt: appearancePrompt || null,
    visual_strategy: visualStrategy,
    audio_type: audioType,
    voice_hint: voiceHint,
    pipeline_status: pipelineStatus,
    profile_status: profileStatus || 'NONE',
    personality: parseStr(personality),
    speech_style: parseStr(speechStyle),
    backstory: parseStr(backstory),
    behavioral_rules: parseStr(behavioralRules),
    anchor_image: anchorImageId
      ? { image_id: anchorImageId, image_url: `/api/visual/images/${anchorImageId}` }
      : null,
    anchor_embedding: parseStr(anchorEmbedding),
    trigger_word: triggerWord || null,
    lora_path: loraPath || null,
    lora_result: buildLoraResult(triggerWord, loraPath, loraFilename),
    outfit_prompt: outfitPrompt || null,
    outfit_anchor_id: outfitAnchorId || null,
    is_protagonist: isProtagonist === 1 || isProtagonist === '1' || isProtagonist === true,
    derived_images: [],
  };
}

function attachLoraTrainingSummary(asset) {
  if (!asset.lora_result) return asset;
  const trainingImages = asset.derived_images.filter(
    (img) => img.filter_result === 'PASS' || img.filter_result === 'SKIP'
  ).length;
  asset.lora_result = {
    ...asset.lora_result,
    training_images: trainingImages || null,
  };
  return asset;
}

module.exports = { buildAssetPayload, attachLoraTrainingSummary, readClob, parseJsonField };
