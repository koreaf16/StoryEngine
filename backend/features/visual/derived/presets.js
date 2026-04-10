/**
 * @file features/visual/derived/presets.js
 * @description 에셋 타입별 파생 이미지 프리셋 데이터 및 Kontext 편집 지시문.
 * @usage features/visual/derived/service.js, features/project/derivedImagePayloads.js에서 사용.
 * @doc docs/04-visual-factory.md
 */

// denoise: img2img 강도. 낮을수록 앵커에 가깝게 유지, 높을수록 프롬프트가 지배.
// pulid_weight: 얼굴 정체성 고정 강도. 0=비활성, 높을수록 앵커 얼굴과 동일하게 유지.
const PRESETS = {
  CHARACTER: [
    { key: 'face_frontal_smile',     label: '정면 미소',   category: '얼굴 클로즈업', seed_mode: 'fixed',  denoise: 0.55, pulid_weight: 0.80 },
    { key: 'face_frontal_serious',   label: '정면 진지',   category: '얼굴 클로즈업', seed_mode: 'fixed',  denoise: 0.55, pulid_weight: 0.80 },
    { key: 'face_frontal_surprised', label: '정면 놀람',   category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.60, pulid_weight: 0.80 },
    { key: 'face_45_left',           label: '45도 좌',     category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.75, pulid_weight: 0.85, skip_similarity: true },
    { key: 'face_45_right',          label: '45도 우',     category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.75, pulid_weight: 0.85, skip_similarity: true, mirror_of: 'face_45_left' },
    { key: 'face_profile_left',      label: '측면 좌',     category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.80, pulid_weight: 0.85, skip_similarity: true },
    { key: 'face_profile_right',     label: '측면 우',     category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.80, pulid_weight: 0.85, skip_similarity: true, mirror_of: 'face_profile_left' },
    { key: 'face_sad',               label: '슬픔',        category: '감정 표현',     seed_mode: 'random', denoise: 0.60, pulid_weight: 0.80, skip_similarity: true },
    { key: 'upper_frontal',          label: '상반신 정면', category: '상반신',        seed_mode: 'random', denoise: 0.80, pulid_weight: 0.80 },
    { key: 'upper_arms_crossed',     label: '팔짱',        category: '상반신',        seed_mode: 'random', denoise: 0.82, pulid_weight: 0.80 },
    { key: 'upper_waving',           label: '손 흔들기',   category: '상반신',        seed_mode: 'random', denoise: 0.82, pulid_weight: 0.80 },
    { key: 'upper_side_left',        label: '상반신 좌측', category: '상반신',        seed_mode: 'random', denoise: 0.80, pulid_weight: 0.80, skip_similarity: true },
    { key: 'upper_side_right',       label: '상반신 우측', category: '상반신',        seed_mode: 'random', denoise: 0.80, pulid_weight: 0.80, skip_similarity: true },
    { key: 'fullbody_frontal',       label: '전신 정면',   category: '전신',          seed_mode: 'random', denoise: 0.88, pulid_weight: 0.80 },
    { key: 'fullbody_walking',       label: '전신 걷기',   category: '전신',          seed_mode: 'random', denoise: 0.88, pulid_weight: 0.80 },
  ],
  NPC: [
    { key: 'npc_face_frontal',   label: '정면',        category: '얼굴 클로즈업', seed_mode: 'fixed',  denoise: 0.55, pulid_weight: 0.80 },
    { key: 'npc_face_45_left',   label: '45도 좌',     category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.75, pulid_weight: 0.85, skip_similarity: true },
    { key: 'npc_face_profile',   label: '측면',        category: '얼굴 클로즈업', seed_mode: 'random', denoise: 0.80, pulid_weight: 0.85, skip_similarity: true },
    { key: 'npc_face_talking',   label: '말하는',      category: '감정 표현',     seed_mode: 'random', denoise: 0.58, pulid_weight: 0.80 },
    { key: 'npc_face_neutral',   label: '무표정',      category: '감정 표현',     seed_mode: 'fixed',  denoise: 0.55, pulid_weight: 0.80 },
    { key: 'npc_upper_frontal',  label: '상반신 정면', category: '상반신',        seed_mode: 'random', denoise: 0.80, pulid_weight: 0.80 },
    { key: 'npc_upper_working',  label: '작업 중',     category: '상반신',        seed_mode: 'random', denoise: 0.85, pulid_weight: 0.80 },
  ],
  MONSTER: [
    { key: 'monster_frontal',      label: '정면',      category: '전신', seed_mode: 'fixed',  denoise: 0.80, pulid_weight: 0 },
    { key: 'monster_profile_left', label: '측면 좌',   category: '전신', seed_mode: 'random', denoise: 0.85, pulid_weight: 0, skip_similarity: true },
    { key: 'monster_rear',         label: '후면',      category: '전신', seed_mode: 'random', denoise: 0.85, pulid_weight: 0, skip_similarity: true },
    { key: 'monster_attacking',    label: '공격 자세', category: '액션', seed_mode: 'random', denoise: 0.88, pulid_weight: 0 },
    { key: 'monster_crouching',    label: '웅크림',    category: '액션', seed_mode: 'random', denoise: 0.88, pulid_weight: 0 },
    { key: 'monster_roaring',      label: '포효',      category: '액션', seed_mode: 'random', denoise: 0.85, pulid_weight: 0 },
    { key: 'monster_wounded',      label: '부상 상태', category: '액션', seed_mode: 'random', denoise: 0.85, pulid_weight: 0 },
    { key: 'monster_sleeping',     label: '휴식',      category: '액션', seed_mode: 'random', denoise: 0.82, pulid_weight: 0 },
  ],
  LOCATION: [
    { key: 'loc_daytime',    label: '낮',  category: '장면', seed_mode: 'random', denoise: 0.65, pulid_weight: 0 },
    { key: 'loc_nighttime',  label: '밤',  category: '장면', seed_mode: 'random', denoise: 0.65, pulid_weight: 0 },
    { key: 'loc_foggy',      label: '안개', category: '장면', seed_mode: 'random', denoise: 0.65, pulid_weight: 0 },
    { key: 'loc_rainy',      label: '비',  category: '장면', seed_mode: 'random', denoise: 0.65, pulid_weight: 0 },
    { key: 'loc_angle_wide', label: '광각', category: '장면', seed_mode: 'random', denoise: 0.75, pulid_weight: 0 },
  ],
  ITEM: [
    { key: 'item_frontal',   label: '정면',      category: '오브젝트', seed_mode: 'fixed',  denoise: 0.70, pulid_weight: 0 },
    { key: 'item_angle_45',  label: '45도',      category: '오브젝트', seed_mode: 'random', denoise: 0.75, pulid_weight: 0 },
    { key: 'item_held',      label: '들고 있는', category: '오브젝트', seed_mode: 'random', denoise: 0.80, pulid_weight: 0 },
    { key: 'item_glowing',   label: '발광 상태', category: '오브젝트', seed_mode: 'random', denoise: 0.72, pulid_weight: 0 },
  ],
};

const PRESET_PROMPTS = {
  // CHARACTER — 얼굴 클로즈업 (Kontext 편집 지시형)
  face_frontal_smile:     'Make the person smile gently while looking at the camera. Close-up face portrait.',
  face_frontal_serious:   'Change the expression to serious and focused while looking at the camera. Close-up face portrait.',
  face_frontal_surprised: 'Change the expression to surprised with wide eyes. Close-up face portrait.',
  face_45_left:           'Turn the head to a three-quarter view facing left. Close-up face portrait, same person.',
  face_45_right:          'Turn the head to a three-quarter view facing right. Close-up face portrait, same person.',
  face_profile_left:      'Turn the head to a full side profile facing left. Close-up face portrait, same person.',
  face_profile_right:     'Turn the head to a full side profile facing right. Close-up face portrait, same person.',
  face_sad:               'Change the expression to sad with downcast eyes. Close-up face portrait.',

  // CHARACTER — 상반신 (의상 유지 명시)
  upper_frontal:          'Zoom out to show the upper body from waist up, arms relaxed at sides, facing camera. Keep the same clothing{outfitPrompt}.',
  upper_arms_crossed:     'Change the pose to arms crossed over the chest, upper body visible. Keep the same clothing{outfitPrompt}.',
  upper_waving:           'Change the pose to one hand raised waving at the camera. Keep the same clothing{outfitPrompt}.',
  upper_side_left:        'Turn the upper body to face the left side, three-quarter view. Keep the same clothing{outfitPrompt}.',
  upper_side_right:       'Turn the upper body to face the right side, three-quarter view. Keep the same clothing{outfitPrompt}.',

  // CHARACTER — 전신 (의상 유지 명시)
  fullbody_frontal:       'Zoom out to show the full body from head to toe, standing upright, facing camera. Keep the same clothing fully visible{outfitPrompt}.',
  fullbody_walking:       'Change the pose to a natural walking mid-stride, full body visible. Keep the same clothing{outfitPrompt}.',

  // NPC
  npc_face_frontal:       'Show the person looking directly at camera with a neutral expression. Close-up face portrait.',
  npc_face_45_left:       'Turn the head to a three-quarter view facing left. Close-up face portrait, same person.',
  npc_face_profile:       'Turn the head to a full side profile. Close-up face portrait, same person.',
  npc_face_talking:       'Change the expression to talking with mouth slightly open. Same person.',
  npc_face_neutral:       'Change the expression to completely neutral and calm. Close-up face portrait.',
  npc_upper_frontal:      'Zoom out to show the upper body, arms at sides, facing camera. Keep the same clothing.',
  npc_upper_working:      'Change the pose to working with hands in motion. Keep the same clothing.',

  // Monster
  monster_frontal:        'Show the full body of the creature facing directly toward camera in a neutral standing pose',
  monster_profile_left:   'Rotate the full body to face the left edge of the frame. The head and torso point to the left. Side profile view',
  monster_rear:           'Show the full body from behind in a rear view',
  monster_attacking:      'Transform the pose into an aggressive attack stance with body lunging forward',
  monster_crouching:      'Transform the pose into a low crouching position, body coiled and ready',
  monster_roaring:        'Change the expression to a roaring pose with mouth wide open, aggressive stance',
  monster_wounded:        'Transform the pose to show injury, body slightly hunched and weakened',
  monster_sleeping:       'Transform the pose to a resting or sleeping position, body relaxed and still',

  // Location
  loc_daytime:            'Change the lighting to bright daytime with a clear blue sky and warm sunlight',
  loc_nighttime:          'Change the lighting to nighttime with a dark sky and moonlight',
  loc_foggy:              'Add a thick foggy atmosphere with mist obscuring the background',
  loc_rainy:              'Change the weather to heavy rain with wet ground and rain falling',
  loc_angle_wide:         'Change to a wide angle panoramic view showing more of the surrounding area',

  // Item
  item_frontal:           'Show the object from a straight-on front view, centered in the frame, no people',
  item_angle_45:          'Rotate the object to show it at a 45 degree angle, no people',
  item_held:              'Show the object being held in hands, with a focus on the object detail',
  item_glowing:           'Add a magical glowing light effect radiating from the object',
};

const FIXED_SEED = 42;

module.exports = { PRESETS, PRESET_PROMPTS, FIXED_SEED };
