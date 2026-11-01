CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title_nl` varchar(140) NOT NULL,
	`title_en` varchar(140) NOT NULL,
	`text_nl` varchar(400) NOT NULL DEFAULT '',
	`text_en` varchar(400) NOT NULL DEFAULT '',
	`cta_nl` varchar(60) NOT NULL DEFAULT '',
	`cta_en` varchar(60) NOT NULL DEFAULT '',
	`href` varchar(200) NOT NULL DEFAULT '',
	`media_id` int,
	`starts_at` datetime(3),
	`ends_at` datetime(3),
	`status` varchar(10) NOT NULL DEFAULT 'draft',
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expense_receipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expense_id` int NOT NULL,
	`filename` varchar(160) NOT NULL,
	`mime` varchar(60) NOT NULL,
	`size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`data` longblob NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `expense_receipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spent_on` date NOT NULL,
	`category` varchar(40) NOT NULL,
	`vendor` varchar(160) NOT NULL DEFAULT '',
	`description` varchar(300) NOT NULL DEFAULT '',
	`amount_cents` int NOT NULL,
	`vat_rate_bp` int,
	`vat_cents` int,
	`status` varchar(10) NOT NULL DEFAULT 'paid',
	`notes` text,
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `package_items` (
	`package_id` varchar(60) NOT NULL,
	`treatment_id` varchar(60) NOT NULL,
	`quantity` smallint NOT NULL DEFAULT 1,
	`sort` int NOT NULL DEFAULT 0,
	CONSTRAINT `package_items_package_id_treatment_id_pk` PRIMARY KEY(`package_id`,`treatment_id`)
);
--> statement-breakpoint
CREATE TABLE `price_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_id` varchar(60) NOT NULL,
	`pricing_mode` varchar(12) NOT NULL,
	`price_cents` int,
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `price_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointment_id` int NOT NULL,
	`amount_cents` int NOT NULL,
	`message` text,
	`token_hash` varchar(64) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'sent',
	`expires_at` datetime(3) NOT NULL,
	`responded_at` datetime(3),
	`response_ip_hash` varchar(64),
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `price_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `price_quotes_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`brand` varchar(80) NOT NULL DEFAULT '',
	`variant` varchar(120) NOT NULL DEFAULT '',
	`category` varchar(40) NOT NULL DEFAULT 'other',
	`media_id` int,
	`description` text,
	`usage` text,
	`notes` text,
	`professional_only` boolean NOT NULL DEFAULT false,
	`supplier` varchar(160) NOT NULL DEFAULT '',
	`cost_cents` int,
	`stock_qty` int,
	`reorder_level` int,
	`batch` varchar(60) NOT NULL DEFAULT '',
	`expires_on` date,
	`status` varchar(10) NOT NULL DEFAULT 'active',
	`show_public` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promotion_redemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promotion_id` int NOT NULL,
	`appointment_id` int NOT NULL,
	`discount_cents` int NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `promotion_redemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `redeem_appt_idx` UNIQUE(`appointment_id`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name_nl` varchar(120) NOT NULL,
	`name_en` varchar(120) NOT NULL,
	`kind` varchar(10) NOT NULL,
	`value` int NOT NULL,
	`scope` varchar(10) NOT NULL DEFAULT 'all',
	`scope_ids` json,
	`code` varchar(40),
	`starts_at` datetime(3),
	`ends_at` datetime(3),
	`max_uses` int,
	`used_count` int NOT NULL DEFAULT 0,
	`min_spend_cents` int,
	`status` varchar(10) NOT NULL DEFAULT 'draft',
	`show_public` boolean NOT NULL DEFAULT false,
	`note_nl` varchar(300),
	`note_en` varchar(300),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `protocols` (
	`treatment_id` varchar(60) NOT NULL,
	`steps` json NOT NULL,
	`notes` text,
	`user_id` int,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `protocols_treatment_id` PRIMARY KEY(`treatment_id`)
);
--> statement-breakpoint
CREATE TABLE `service_groups` (
	`id` varchar(60) NOT NULL,
	`section_id` varchar(60) NOT NULL,
	`slug_nl` varchar(80) NOT NULL,
	`slug_en` varchar(80) NOT NULL,
	`name_nl` varchar(120) NOT NULL,
	`name_en` varchar(120) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'draft',
	`media_id` int,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `service_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `group_slug_nl_idx` UNIQUE(`section_id`,`slug_nl`),
	CONSTRAINT `group_slug_en_idx` UNIQUE(`section_id`,`slug_en`)
);
--> statement-breakpoint
CREATE TABLE `service_sections` (
	`id` varchar(60) NOT NULL,
	`kind` varchar(12) NOT NULL DEFAULT 'treatments',
	`slug_nl` varchar(80) NOT NULL,
	`slug_en` varchar(80) NOT NULL,
	`name_nl` varchar(120) NOT NULL,
	`name_en` varchar(120) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'draft',
	`media_id` int,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `service_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_sections_slug_nl_unique` UNIQUE(`slug_nl`),
	CONSTRAINT `service_sections_slug_en_unique` UNIQUE(`slug_en`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(20) NOT NULL,
	`appointment_id` int,
	`note` varchar(300),
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `discount_cents` int;--> statement-breakpoint
ALTER TABLE `appointments` ADD `promotion_id` int;--> statement-breakpoint
ALTER TABLE `appointments` ADD `invoice_mode` varchar(12);--> statement-breakpoint
ALTER TABLE `treatments` ADD `kind` varchar(12) DEFAULT 'treatment' NOT NULL;--> statement-breakpoint
ALTER TABLE `treatments` ADD `section_id` varchar(60);--> statement-breakpoint
ALTER TABLE `treatments` ADD `group_id` varchar(60);--> statement-breakpoint
ALTER TABLE `treatments` ADD `slug_nl` varchar(120);--> statement-breakpoint
ALTER TABLE `treatments` ADD `slug_en` varchar(120);--> statement-breakpoint
ALTER TABLE `treatments` ADD `status` varchar(12) DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `treatments` ADD `pricing_mode` varchar(12);--> statement-breakpoint
ALTER TABLE `treatments` ADD `vat_category` varchar(12) DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `treatments` ADD `related` json;--> statement-breakpoint
ALTER TABLE `treatments` ADD `gallery` json;--> statement-breakpoint
CREATE INDEX `receipt_exp_idx` ON `expense_receipts` (`expense_id`);--> statement-breakpoint
CREATE INDEX `exp_date_idx` ON `expenses` (`spent_on`);--> statement-breakpoint
CREATE INDEX `ph_item_idx` ON `price_history` (`item_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `quote_appt_idx` ON `price_quotes` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `redeem_promo_idx` ON `promotion_redemptions` (`promotion_id`);--> statement-breakpoint
CREATE INDEX `stock_product_idx` ON `stock_movements` (`product_id`,`created_at`);