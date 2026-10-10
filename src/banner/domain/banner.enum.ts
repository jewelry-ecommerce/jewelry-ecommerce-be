export enum BannerMediaFit {
  COVER = "cover",
  CONTAIN = "contain",
  FILL = "fill",
  NONE = "none",
}

export enum BannerMediaType {
  GIF = "GIF",
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  VIRTUAL = "VIRTUAL",
}

export enum BannerActionType {
  URL = "URL",
  NEWS = "NEWS",
  POPUP = "POPUP",
  PRODUCT = "PRODUCT",
  CATEGORY = "CATEGORY",
  COLLECTION = "COLLECTION",
}

export enum BannerActionsLayout {
  STACK = "STACK",
  INLINE = "INLINE",
}

export enum BannerLayout {
  RIGHT_TOP = "RIGHT_TOP",
  CENTER_TOP = "CENTER_TOP",
  LEFT_TOP = "LEFT_TOP",

  RIGHT_CENTER = "RIGHT_CENTER",
  CENTER = "CENTER",
  LEFT_CENTER = "LEFT_CENTER",

  RIGHT_BOTTOM = "RIGHT_BOTTOM",
  CENTER_BOTTOM = "CENTER_BOTTOM",
  LEFT_BOTTOM = "LEFT_BOTTOM",
}

export enum BannerStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum PlacementPlatform {
  WEB = "WEB",
  APP = "APP",
  ALL = "ALL",
}

export enum PlacementDisplayType {
  DOUBLE_BANNER = "DOUBLE_BANNER",
  CAROUSEL = "CAROUSEL",
  SLIDER = "SLIDER",
  POPUP = "POPUP",
  GRID = "GRID",
}

/** GRID mobile: ảnh full-width khi số slot lẻ. Missing = LAST. */
export enum MobileOddFullWidthItem {
  FIRST = "FIRST",
  LAST = "LAST",
}

export enum PlacementStatus {
  INACTIVE = "INACTIVE",
  ACTIVE = "ACTIVE",
}

export enum PlacementLayoutStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum ProductListBannerConditionType {
  CATEGORY = "CATEGORY",
  CMS_STOREFRONT = "CMS_STOREFRONT",
}

export enum ProductListBannerActionType {
  LINK_URL = "LINK_URL",
  MIX_MATCH = "MIX_MATCH",
}
