/**
 * @file features/visual/derived/presets.js
 * @description 에셋 타입별 파생 이미지 프리셋 데이터 및 Kontext 편집 지시문.
 * @usage features/visual/derived/service.js, features/project/derivedImagePayloads.js에서 사용.
 * @doc docs/04-visual-factory.md
 */

const PRESETS = {
  CHARACTER: [
    { key: 'face_frontal_smile',     label: '정면 미소',   category: '얼굴 클로즈업', seed_mode: 'fixed' },
    { key: 'face_frontal_serious',   label: '정면 진지',   category: '얼굴 클로즈업', seed_mode: 'fixed' },
    { key: 'face_frontal_surprised', label: '정면 놀람',   category: '얼굴 클로즈업', seed_mode: 'random' },
    { key: 'face_45_left',           label: '45도 좌',     category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true },
    { key: 'face_45_right',          label: '45도 우',     category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true, mirror_of: 'face_45_left' },
    { key: 'face_profile_left',      label: '측면 좌',     category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true },
    { key: 'face_profile_right',     label: '측면 우',     category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true, mirror_of: 'face_profile_left' },
    { key: 'face_sad',               label: '슬픔',        category: '감정 표현',     seed_mode: 'random' },
    { key: 'upper_frontal',          label: '상반신 정면', category: '상반신',        seed_mode: 'random' },
    { key: 'upper_arms_crossed',     label: '팔짱',        category: '상반신',        seed_mode: 'random' },
    { key: 'upper_waving',           label: '손 흔들기',   category: '상반신',        seed_mode: 'random' },
    { key: 'upper_side_left',        label: '상반신 좌측', category: '상반신',        seed_mode: 'random', skip_similarity: true },
    { key: 'upper_side_right',       label: '상반신 우측', category: '상반신',        seed_mode: 'random', skip_similarity: true },
    { key: 'fullbody_frontal',       label: '전신 정면',   category: '전신',          seed_mode: 'random' },
    { key: 'fullbody_walking',       label: '전신 걷기',   category: '전신',          seed_mode: 'random' },
  ],
  NPC: [
    { key: 'npc_face_frontal',   label: '정면',        category: '얼굴 클로즈업', seed_mode: 'fixed' },
    { key: 'npc_face_45_left',   label: '45도 좌',     category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true },
    { key: 'npc_face_profile',   label: '측면',        category: '얼굴 클로즈업', seed_mode: 'random', skip_similarity: true },
    { key: 'npc_face_talking',   label: '말하는',      category: '감정 표현',     seed_mode: 'random' },
    { key: 'npc_face_neutral',   label: '무표정',      category: '감정 표현',     seed_mode: 'fixed' },
    { key: 'npc_upper_frontal',  label: '상반신 정면', category: '상반신',        seed_mode: 'random' },
    { key: 'npc_upper_working',  label: '작업 중',     category: '상반신',        seed_mode: 'random' },
  ],
  MONSTER: [
    { key: 'monster_frontal',      label: '정면',      category: '전신', seed_mode: 'fixed' },
    { key: 'monster_profile_left', label: '측면 좌',   category: '전신', seed_mode: 'random', skip_similarity: true },
    { key: 'monster_rear',         label: '후면',      category: '전신', seed_mode: 'random', skip_similarity: true },
    { key: 'monster_attacking',    label: '공격 자세', category: '액션', seed_mode: 'random' },
    { key: 'monster_crouching',    label: '웅크림',    category: '액션', seed_mode: 'random' },
    { key: 'monster_roaring',      label: '포효',      category: '액션', seed_mode: 'random' },
    { key: 'monster_wounded',      label: '부상 상태', category: '액션', seed_mode: 'random' },
    { key: 'monster_sleeping',     label: '휴식',      category: '액션', seed_mode: 'random' },
  ],
  LOCATION: [
    { key: 'loc_daytime',    label: '낮',  category: '장면', seed_mode: 'random' },
    { key: 'loc_nighttime',  label: '밤',  category: '장면', seed_mode: 'random' },
    { key: 'loc_foggy',      label: '안개', category: '장면', seed_mode: 'random' },
    { key: 'loc_rainy',      label: '비',  category: '장면', seed_mode: 'random' },
    { key: 'loc_angle_wide', label: '광각', category: '장면', seed_mode: 'random' },
  ],
  ITEM: [
    { key: 'item_frontal',   label: '정면',      category: '오브젝트', seed_mode: 'fixed' },
    { key: 'item_angle_45',  label: '45도',      category: '오브젝트', seed_mode: 'random' },
    { key: 'item_held',      label: '들고 있는', category: '오브젝트', seed_mode: 'random' },
    { key: 'item_glowing',   label: '발광 상태', category: '오브젝트', seed_mode: 'random' },
  ],
};

const PRESET_PROMPTS = {
  face_frontal_smile:     'Change the expression to a gentle smile, close-up face portrait, looking directly at camera',
  face_frontal_serious:   'Change the expression to a serious and focused look, close-up face portrait, looking directly at camera',
  face_frontal_surprised: 'Change the expression to a surprised and wide-eyed look, close-up face portrait',
  face_45_left:           'Turn the face to a three-quarter view facing the left side of the frame. The nose tip points toward the left margin. The viewer sees mostly the right cheek and the right ear is partially visible. The left ear is hidden behind the head. 45 degree angle, face portrait',
  face_45_right:          'Turn the face to a three-quarter view facing the right side of the frame. The nose tip points toward the right margin. The viewer sees mostly the left cheek and the left ear is partially visible. The right ear is hidden behind the head. 45 degree angle, face portrait',
  face_profile_left:      'Turn the head into a complete side profile facing the left edge of the frame. The nose silhouette points to the left. Only the right ear is visible to the viewer. The entire left side of the face is hidden. Side view face portrait',
  face_profile_right:     'Turn the head into a complete side profile facing the right edge of the frame. The nose silhouette points to the right. Only the left ear is visible to the viewer. The entire right side of the face is hidden. Side view face portrait',
  face_sad:               'Change the expression to a sad and sorrowful look with downcast eyes, close-up face portrait',
  upper_frontal:          'Show the upper body from the waist up, arms at sides, facing directly toward camera{outfitPrompt}',
  upper_arms_crossed:     'Show the upper body with arms crossed over the chest, facing camera{outfitPrompt}',
  upper_waving:           'Show the upper body with one hand raised and waving at the camera{outfitPrompt}',
  upper_side_left:        'Show the upper body from the waist up, turned to face the left side of the frame, three-quarter view{outfitPrompt}',
  upper_side_right:       'Show the upper body from the waist up, turned to face the right side of the frame, three-quarter view{outfitPrompt}',
  fullbody_frontal:       'Show the full body from head to toe, standing upright, facing directly toward camera, full outfit visible{outfitPrompt}',
  fullbody_walking:       'Show the full body in a natural walking pose, mid-stride, facing slightly toward the camera, full outfit visible{outfitPrompt}',

  // NPC
  npc_face_frontal:       'Show a neutral close-up face portrait, looking directly at camera',
  npc_face_45_left:       'Turn the face to a three-quarter view facing the left side of the frame, 45 degree angle',
  npc_face_profile:       'Turn the face to a full side profile view',
  npc_face_talking:       'Change the expression to show the character talking with mouth slightly open',
  npc_face_neutral:       'Change the expression to a completely neutral and calm look, close-up face portrait',
  npc_upper_frontal:      'Show the upper body from the waist up, arms at sides, facing directly toward camera',
  npc_upper_working:      'Show the upper body engaged in a work activity, hands in motion',

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
