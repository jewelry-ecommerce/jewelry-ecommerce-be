export const BANNER_DEMO_BLOCKED_URI=/^(?:javascript|data|vbscript):/i;
export const BANNER_DEFAULTS={
  columns:4,rows:2,gap:16,platform:'ALL',placementStatus:'ACTIVE',bannerStatus:'ACTIVE',
  layout:'CENTER',mediaType:'IMAGE',mediaFit:'cover',actionsLayout:'STACK',overlayOpacity:0,
  ctaBackground:'#FFFFFF',ctaColor:'#111827',codePrefix:'BANNER',
} as const;
