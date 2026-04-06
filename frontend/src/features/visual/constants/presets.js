/**
 * @file presets.js
 * @description 에셋 타입별 파생 이미지 생성 프리셋 목록.
 * @usage useDerivedGeneration, DerivedImagesPage에서 프리셋 그룹핑에 사용.
 * @connects features/visual/hooks/useDerivedGeneration.js
 * @doc docs/04-visual-factory.md (파생 이미지 프리셋)
 */

/** 에셋 타입별 파생 프리셋 카테고리 레이블 */
export const PRESET_CATEGORY_LABELS = {
  CHARACTER: ['얼굴 클로즈업', '상반신', '전신', '감정 표현', '액션'],
  NPC: ['얼굴 클로즈업', '상반신', '전신'],
  MONSTER: ['전신', '공격 자세', '클로즈업'],
  LOCATION: ['전경', '내부', '디테일'],
  ITEM: ['정면', '측면'],
}

/** 에셋 타입별 예상 생성 이미지 수 (백엔드 서비스와 동기화) */
export const PRESET_COUNTS = {
  CHARACTER: 15,
  NPC: 7,
  MONSTER: 8,
  LOCATION: 5,
  ITEM: 4,
}
