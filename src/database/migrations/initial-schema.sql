-- Only run against the separate jewelry_commerce database. No seed business data.
CREATE TABLE accounts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  phone varchar(24), email varchar(254), name varchar(160) NOT NULL, password_hash text NOT NULL, role varchar(40) NOT NULL, status varchar(30) NOT NULL DEFAULT 'ACTIVE', UNIQUE(phone), UNIQUE(email)
);

CREATE TABLE media_assets (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  storage_key text NOT NULL UNIQUE, original_name text NOT NULL, mime_type varchar(120) NOT NULL, byte_size bigint NOT NULL CHECK (byte_size>0), public_url text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE attributes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  code varchar(100) NOT NULL, name varchar(160) NOT NULL, display_type varchar(30) NOT NULL CHECK(display_type IN ('TEXT','IMAGE')), status varchar(30) NOT NULL DEFAULT 'ACTIVE', is_variant_axis boolean NOT NULL DEFAULT true
);

CREATE TABLE attribute_values (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  attribute_id integer NOT NULL REFERENCES attributes(id), code varchar(100) NOT NULL, value varchar(255) NOT NULL, image text, sort_order integer NOT NULL DEFAULT 0, UNIQUE(attribute_id,code), UNIQUE(id,attribute_id)
);

CREATE TABLE categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  parent_id integer REFERENCES categories(id), code varchar(100) NOT NULL, slug varchar(255) NOT NULL, name varchar(160) NOT NULL, status varchar(30) NOT NULL DEFAULT 'ACTIVE', is_display boolean NOT NULL DEFAULT true, tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK(tax_rate BETWEEN 0 AND 100), logo text, image text, sort_order integer NOT NULL DEFAULT 0, seo jsonb NOT NULL DEFAULT '{}'::jsonb, CHECK(parent_id IS NULL OR parent_id<>id)
);

CREATE TABLE category_attributes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  category_id integer NOT NULL REFERENCES categories(id), attribute_id integer NOT NULL REFERENCES attributes(id), sort_order integer NOT NULL DEFAULT 0, UNIQUE(category_id,attribute_id)
);

CREATE TABLE products (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  category_id integer REFERENCES categories(id), spu_code varchar(100) NOT NULL, slug varchar(255) NOT NULL, name varchar(255) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','UNPUBLISHED','PUBLISHED','DISCONTINUED','ARCHIVED')), product_kind varchar(30) NOT NULL DEFAULT 'MERCHANDISE', unit_of_measure varchar(30) NOT NULL DEFAULT 'EACH', default_variation_id integer, description text, product_infos jsonb NOT NULL DEFAULT '[]'::jsonb, seo jsonb NOT NULL DEFAULT '{}'::jsonb, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, tax_rate_override numeric(5,2), published_at timestamptz
);

CREATE TABLE product_attributes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  product_id integer NOT NULL REFERENCES products(id), attribute_id integer NOT NULL REFERENCES attributes(id), sort_order integer NOT NULL DEFAULT 0, UNIQUE(product_id,attribute_id)
);

CREATE TABLE product_attribute_values (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  product_id integer NOT NULL REFERENCES products(id), attribute_id integer NOT NULL REFERENCES attributes(id), value_id integer NOT NULL, FOREIGN KEY(value_id,attribute_id) REFERENCES attribute_values(id,attribute_id), UNIQUE(product_id,value_id)
);

CREATE TABLE product_variations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  product_id integer NOT NULL REFERENCES products(id), sku_code varchar(100) NOT NULL, status varchar(30) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE')), selling_price_minor bigint NOT NULL CHECK(selling_price_minor>=0 AND selling_price_minor<=9007199254740991), compare_at_price_minor bigint CHECK(compare_at_price_minor>=0 AND compare_at_price_minor<=9007199254740991), cost_price_minor bigint CHECK(cost_price_minor>=0 AND cost_price_minor<=9007199254740991), on_hand integer NOT NULL DEFAULT 0 CHECK(on_hand>=0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0), weight numeric(12,3), length numeric(12,3), width numeric(12,3), height numeric(12,3), metadata jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(id,product_id)
);

CREATE TABLE variation_values (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  variation_id integer NOT NULL REFERENCES product_variations(id), attribute_id integer NOT NULL REFERENCES attributes(id), value_id integer NOT NULL, FOREIGN KEY(value_id,attribute_id) REFERENCES attribute_values(id,attribute_id), UNIQUE(variation_id,attribute_id)
);

CREATE TABLE variation_media (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  variation_id integer NOT NULL REFERENCES product_variations(id), asset_id integer REFERENCES media_assets(id), url text NOT NULL, sort_order integer NOT NULL CHECK(sort_order>=0), UNIQUE(variation_id,sort_order)
);

CREATE TABLE collections (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  name varchar(160) NOT NULL, slug varchar(255) NOT NULL, description text, image text, status varchar(30) NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE product_collections (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  product_id integer NOT NULL REFERENCES products(id), collection_id integer NOT NULL REFERENCES collections(id), sort_order integer NOT NULL DEFAULT 0, UNIQUE(product_id,collection_id)
);

CREATE TABLE product_sets (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  code varchar(100) NOT NULL, slug varchar(255) NOT NULL, name varchar(255) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT', images jsonb NOT NULL DEFAULT '[]'::jsonb, description text, short_descriptions jsonb NOT NULL DEFAULT '[]'::jsonb, note text, metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE product_set_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  set_id integer NOT NULL REFERENCES product_sets(id), product_id integer NOT NULL REFERENCES products(id), quantity integer NOT NULL CHECK(quantity>0), is_required boolean NOT NULL DEFAULT true, is_key boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, UNIQUE(id,product_id), UNIQUE(set_id,product_id)
);

CREATE TABLE set_item_variations (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  set_item_id integer NOT NULL, product_id integer NOT NULL, variation_id integer NOT NULL, FOREIGN KEY(set_item_id,product_id) REFERENCES product_set_items(id,product_id), FOREIGN KEY(variation_id,product_id) REFERENCES product_variations(id,product_id), UNIQUE(set_item_id,variation_id)
);

CREATE TABLE reviews (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  product_id integer NOT NULL REFERENCES products(id), account_id integer REFERENCES accounts(id), author_name varchar(160) NOT NULL, rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), content text NOT NULL, status varchar(30) NOT NULL, media jsonb NOT NULL DEFAULT '[]'::jsonb, admin_reply text, replied_at timestamptz
);

CREATE TABLE cms_pages (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  name varchar(160) NOT NULL, slug varchar(255) NOT NULL, locale varchar(20) NOT NULL DEFAULT 'vi-VN', status varchar(30) NOT NULL DEFAULT 'DRAFT', is_active boolean NOT NULL DEFAULT true, revision integer NOT NULL DEFAULT 1 CHECK(revision>0), seo jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(slug,locale)
);

CREATE TABLE cms_blocks (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  page_id integer NOT NULL REFERENCES cms_pages(id), block_type_code varchar(80) NOT NULL, sort_order integer NOT NULL CHECK(sort_order>=0), is_visible boolean NOT NULL DEFAULT true, config jsonb NOT NULL CHECK(jsonb_typeof(config)='object')
);

CREATE TABLE banners (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  internal_name varchar(160) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT', media_type varchar(30) NOT NULL DEFAULT 'IMAGE', media_url text, media_mobile_url text, media_poster_url text, media_mobile_poster_url text, media_link_url text, media_fit varchar(30) NOT NULL DEFAULT 'cover', layout varchar(40) NOT NULL DEFAULT 'CENTER', title text, subtitle text, title_color varchar(30), actions_layout varchar(30) NOT NULL DEFAULT 'STACK', actions jsonb NOT NULL DEFAULT '[]'::jsonb, overlay_opacity numeric(4,3) NOT NULL DEFAULT 0 CHECK(overlay_opacity BETWEEN 0 AND 1)
);

CREATE TABLE banner_placements (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  code varchar(100) NOT NULL, name varchar(160) NOT NULL, display_type varchar(30) NOT NULL CHECK(display_type IN ('GRID','SLIDER','DOUBLE_BANNER')), platform varchar(30) NOT NULL DEFAULT 'ALL', status varchar(30) NOT NULL DEFAULT 'ACTIVE', settings jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE banner_placement_layouts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  placement_id integer NOT NULL REFERENCES banner_placements(id), name varchar(160) NOT NULL, revision integer NOT NULL CHECK(revision>0), status varchar(30) NOT NULL DEFAULT 'DRAFT', active_from timestamptz, active_to timestamptz, note text, UNIQUE(placement_id,revision), CHECK(active_to IS NULL OR active_from IS NULL OR active_to>active_from)
);

CREATE TABLE banner_layout_items (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  placement_layout_id integer NOT NULL REFERENCES banner_placement_layouts(id), slot_key varchar(100) NOT NULL, banner_id integer REFERENCES banners(id), is_active boolean NOT NULL DEFAULT true, priority integer NOT NULL DEFAULT 0, display_metadata jsonb NOT NULL CHECK(jsonb_typeof(display_metadata)='object'), UNIQUE(placement_layout_id,slot_key)
);

CREATE TABLE badge_templates (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  code varchar(100) NOT NULL, name varchar(160) NOT NULL, type varchar(30) NOT NULL, badge_type varchar(40) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT', display_text varchar(120), default_position varchar(40) NOT NULL, style_config jsonb NOT NULL DEFAULT '{}'::jsonb, icon text, image text, icon_mobile text, image_mobile text, asset_meta jsonb NOT NULL DEFAULT '{}'::jsonb, default_priority_weight integer NOT NULL DEFAULT 0, description text
);

CREATE TABLE badge_flows (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  name varchar(160) NOT NULL, description text, rule_type varchar(40) NOT NULL, rule_config jsonb NOT NULL DEFAULT '{}'::jsonb, channel varchar(30) NOT NULL DEFAULT 'WEB', status varchar(30) NOT NULL DEFAULT 'DRAFT', active_from timestamptz, active_to timestamptz
);

CREATE TABLE badge_flow_templates (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  flow_id integer NOT NULL REFERENCES badge_flows(id), template_id integer NOT NULL REFERENCES badge_templates(id), priority_weight integer NOT NULL DEFAULT 0, is_pinned boolean NOT NULL DEFAULT false, UNIQUE(flow_id,template_id)
);

CREATE TABLE site_logos (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  name varchar(160) NOT NULL, type varchar(30) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT', logo_url text NOT NULL, logo_theme text, logo_target_url text
);

CREATE TABLE site_headers (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  banner_name varchar(160) NOT NULL, status varchar(30) NOT NULL DEFAULT 'DRAFT', banner_display_style varchar(30) NOT NULL, banner_content text, banner_bg_color varchar(30), banner_text_color varchar(30), banner_target_url text, banner_animation_style varchar(40), banner_loop_interval_sec integer, banner_start_time timestamptz NOT NULL, banner_end_time timestamptz, CHECK(banner_end_time IS NULL OR banner_end_time>banner_start_time)
);

CREATE TABLE site_footer (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz,
  copyright_text text, footer_logo_url text, certification_image_url text, certification_url text, social_links jsonb NOT NULL DEFAULT '[]'::jsonb, menu_columns jsonb NOT NULL DEFAULT '[]'::jsonb
);

ALTER TABLE products ADD CONSTRAINT default_variation_belongs_to_product FOREIGN KEY(default_variation_id,id) REFERENCES product_variations(id,product_id) DEFERRABLE INITIALLY DEFERRED;
CREATE UNIQUE INDEX attributes_code_live ON attributes(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX categories_code_live ON categories(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX categories_slug_live ON categories(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX products_code_live ON products(spu_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX products_slug_live ON products(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX variations_code_live ON product_variations(sku_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX collections_slug_live ON collections(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX sets_code_live ON product_sets(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX sets_slug_live ON product_sets(slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX placements_code_live ON banner_placements(code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX placement_one_active_layout ON banner_placement_layouts(placement_id) WHERE status='ACTIVE' AND deleted_at IS NULL;
CREATE UNIQUE INDEX badge_template_code_live ON badge_templates(code) WHERE deleted_at IS NULL;
CREATE INDEX products_category_status ON products(category_id,status) WHERE deleted_at IS NULL;
CREATE INDEX cms_blocks_page_order ON cms_blocks(page_id,sort_order) WHERE deleted_at IS NULL;
CREATE INDEX variations_product_status ON product_variations(product_id,status) WHERE deleted_at IS NULL;
CREATE INDEX collections_membership ON product_collections(collection_id,product_id);
