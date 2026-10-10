export const BANNER_COLUMNS={
  banners:{internalName:'internal_name',status:'status',mediaType:'media_type',mediaUrl:'media_url',mediaMobileUrl:'media_mobile_url',
    mediaPosterUrl:'media_poster_url',mediaMobilePosterUrl:'media_mobile_poster_url',mediaLinkUrl:'media_link_url',mediaFit:'media_fit',
    layout:'layout',title:'title',subtitle:'subtitle',titleColor:'title_color',actionsLayout:'actions_layout',actions:'actions',overlayOpacity:'overlay_opacity'},
  banner_placements:{code:'code',name:'name',displayType:'display_type',platform:'platform',status:'status',settings:'settings'},
  banner_placement_layouts:{placementId:'placement_id',name:'name',revision:'revision',status:'status',activeFrom:'active_from',activeTo:'active_to',note:'note'},
  banner_layout_items:{placementLayoutId:'placement_layout_id',slotKey:'slot_key',bannerId:'banner_id',isActive:'is_active',priority:'priority',displayMetadata:'display_metadata'},
} as const;
export type BannerTable=keyof typeof BANNER_COLUMNS;
export const BANNER_JSON_COLUMNS=new Set(['actions','settings','displayMetadata']);
