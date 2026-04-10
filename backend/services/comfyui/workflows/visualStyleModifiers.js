/**
 * @file services/comfyui/workflows/visualStyleModifiers.js
 * @description 프로젝트 visual_style 및 assetType에 따라 앵커 이미지 프롬프트에 추가할 prefix/suffix 반환.
 * @usage buildFluxAnchor에서 호출.
 * @connects app/config.js의 visual_style 값 (PHOTOREALISTIC | CARTOON | ANIME | 3D_RENDER)
 * @doc docs/04-visual-factory.md
 */

const STYLE_MODIFIERS = {
  PHOTOREALISTIC: {
    CHARACTER: {
      prefix: 'raw photo, a unique and candid ID photo of ',
      suffix: ', detailed facial features, natural skin texture, masterpiece, highly detailed, centered subject, upper body visible, shoulders visible, plain white background, looking at camera, professional studio lighting, sharp focus, 8k resolution, cinematic lighting',
    },
    ITEM: {
      prefix: 'product photography style, plain white background, ',
      suffix: ', centered object, clean white background, no background details, studio lighting, sharp focus, high quality, photorealistic',
    },
    LOCATION: {
      prefix: 'wide angle photography, cinematic environment, ',
      suffix: ', high quality, photorealistic, 8k resolution, volumetric lighting, epic composition',
    },
    MONSTER: {
      prefix: 'concept art photography, cinematic creature design, ',
      suffix: ', centered creature, dramatic lighting, sharp focus, high quality, photorealistic, hyper-detailed',
    },
    DEFAULT: {
      prefix: 'photorealistic style, high quality, ',
      suffix: ', sharp focus, cinematic lighting',
    }
  },
  CARTOON: {
    CHARACTER: {
      prefix: 'cartoon illustration style, character portrait, white background, ',
      suffix: ', bold outlines, vibrant flat colors, high quality, cartoon art',
    },
    ITEM: {
      prefix: 'cartoon game asset style, object illustration, white background, ',
      suffix: ', bold outlines, vibrant colors, high quality, cartoon art',
    },
    LOCATION: {
      prefix: 'cartoon landscape illustration, ',
      suffix: ', vibrant colors, high quality, whimsical style',
    },
    DEFAULT: {
      prefix: 'cartoon style, white background, ',
      suffix: ', bold outlines, vibrant colors, high quality',
    }
  },
  ANIME: {
    CHARACTER: {
      prefix: 'anime style illustration, character portrait, ',
      suffix: ', white background, clean linework, expressive anime eyes, high quality',
    },
    ITEM: {
      prefix: 'anime game item style, object illustration, ',
      suffix: ', white background, clean linework, high quality',
    },
    LOCATION: {
      prefix: 'anime background art, ',
      suffix: ', clean linework, high quality, Ghibli style vibes',
    },
    DEFAULT: {
      prefix: 'anime style, ',
      suffix: ', white background, clean linework, high quality',
    }
  },
  '3D_RENDER': {
    CHARACTER: {
      prefix: '3D CGI rendered character, character portrait, plain white background, ',
      suffix: ', studio lighting, high quality, 3D render, Unreal Engine 5 style',
    },
    ITEM: {
      prefix: '3D CGI rendered object, product render, plain white background, ',
      suffix: ', studio lighting, high quality, 3D render, octane render',
    },
    LOCATION: {
      prefix: '3D CGI rendered environment, ',
      suffix: ', cinematic lighting, high quality, 3D render, architectural visualization',
    },
    DEFAULT: {
      prefix: '3D render style, plain white background, ',
      suffix: ', high quality, 3D render',
    }
  },
};

function wrapWithStyle(rawPrompt, visualStyle = 'PHOTOREALISTIC', assetType = 'CHARACTER') {
  const styleGroup = STYLE_MODIFIERS[visualStyle] || STYLE_MODIFIERS.PHOTOREALISTIC;
  
  // NPC는 CHARACTER와 동일한 수식어 사용
  const targetType = assetType === 'NPC' ? 'CHARACTER' : assetType;
  const mod = styleGroup[targetType] || styleGroup.DEFAULT;
  
  return `${mod.prefix}${rawPrompt}${mod.suffix}`;
}

module.exports = { wrapWithStyle };
