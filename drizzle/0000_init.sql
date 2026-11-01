CREATE TABLE `appointment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appointment_id` int NOT NULL,
	`type` varchar(40) NOT NULL,
	`from_status` varchar(16),
	`to_status` varchar(16),
	`data` json,
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `appointment_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appointment_treatments` (
	`appointment_id` int NOT NULL,
	`treatment_id` varchar(60) NOT NULL,
	`name_nl` varchar(120) NOT NULL,
	`name_en` varchar(120) NOT NULL,
	`duration_minutes` smallint,
	CONSTRAINT `appointment_treatments_appointment_id_treatment_id_pk` PRIMARY KEY(`appointment_id`,`treatment_id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`status` varchar(16) NOT NULL,
	`start_at` datetime(3),
	`end_at` datetime(3),
	`blocked_until` datetime(3),
	`duration_minutes` smallint,
	`buffer_minutes` smallint NOT NULL DEFAULT 0,
	`requested_date` date,
	`requested_time_range` varchar(16),
	`requested_alternative` varchar(200),
	`source` varchar(16) NOT NULL,
	`locale` varchar(5) NOT NULL DEFAULT 'nl',
	`customer_note` text,
	`internal_note` text,
	`archived_at` datetime(3),
	`version` int NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(80) NOT NULL,
	`entity` varchar(60),
	`entity_id` varchar(80),
	`details` json,
	`ip_hash` varchar(64),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`start_at` datetime(3) NOT NULL,
	`end_at` datetime(3) NOT NULL,
	`reason` varchar(200) NOT NULL DEFAULT '',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doc_key` varchar(120) NOT NULL,
	`locale` varchar(5) NOT NULL,
	`status` varchar(12) NOT NULL,
	`data` json NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_by` int,
	CONSTRAINT `content_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_doc_locale_status` UNIQUE(`doc_key`,`locale`,`status`)
);
--> statement-breakpoint
CREATE TABLE `content_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doc_key` varchar(120) NOT NULL,
	`locale` varchar(5) NOT NULL,
	`version` int NOT NULL,
	`data` json NOT NULL,
	`note` varchar(200),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`created_by` int,
	CONSTRAINT `content_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cron_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`finished_at` datetime(3),
	`sent` int NOT NULL DEFAULT 0,
	`failed` int NOT NULL DEFAULT 0,
	`error` varchar(200),
	CONSTRAINT `cron_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug_nl` varchar(120) NOT NULL,
	`slug_en` varchar(120) NOT NULL,
	`published` boolean NOT NULL DEFAULT false,
	`noindex` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `custom_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_pages_slug_nl_unique` UNIQUE(`slug_nl`),
	CONSTRAINT `custom_pages_slug_en_unique` UNIQUE(`slug_en`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(80) NOT NULL,
	`last_name` varchar(80) NOT NULL DEFAULT '',
	`email` varchar(190),
	`phone` varchar(32),
	`locale` varchar(5) NOT NULL DEFAULT 'nl',
	`notes` text,
	`consent_at` datetime(3),
	`privacy_version` varchar(20),
	`anonymized_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `date_overrides` (
	`day` date NOT NULL,
	`closed` boolean NOT NULL DEFAULT false,
	`custom_hours` boolean NOT NULL DEFAULT false,
	`capacity` tinyint,
	`max_appointments` smallint,
	`note` varchar(200),
	CONSTRAINT `date_overrides_day` PRIMARY KEY(`day`)
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(80) NOT NULL,
	`email` varchar(190) NOT NULL,
	`phone` varchar(32),
	`topic` varchar(20) NOT NULL,
	`message` text NOT NULL,
	`locale` varchar(5) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'new',
	`consent_at` datetime(3) NOT NULL,
	`read_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(200) NOT NULL,
	`mime` varchar(60) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`bytes` int NOT NULL,
	`alt_nl` varchar(300) NOT NULL DEFAULT '',
	`alt_en` varchar(300) NOT NULL DEFAULT '',
	`focus_mobile` varchar(20) NOT NULL DEFAULT '50% 50%',
	`focus_desktop` varchar(20) NOT NULL DEFAULT '50% 50%',
	`source` varchar(300) NOT NULL DEFAULT '',
	`license` varchar(300) NOT NULL DEFAULT '',
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_variants` (
	`media_id` int NOT NULL,
	`width` int NOT NULL,
	`mime` varchar(60) NOT NULL,
	`data` longblob NOT NULL,
	CONSTRAINT `media_variants_media_id_width_pk` PRIMARY KEY(`media_id`,`width`)
);
--> statement-breakpoint
CREATE TABLE `mfa_recovery_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`code_hash` varchar(255) NOT NULL,
	`used_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `mfa_recovery_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_templates` (
	`key` varchar(60) NOT NULL,
	`locale` varchar(5) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `notification_templates_key_locale_pk` PRIMARY KEY(`key`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dedupe_key` varchar(190) NOT NULL,
	`kind` varchar(40) NOT NULL,
	`appointment_id` int,
	`to_email` varchar(190) NOT NULL,
	`reply_to` varchar(190),
	`subject` varchar(250) NOT NULL,
	`html` text NOT NULL,
	`text_body` text NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`send_after` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`locked_at` datetime(3),
	`last_error` varchar(200),
	`sent_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `outbox_id` PRIMARY KEY(`id`),
	CONSTRAINT `outbox_dedupe_key_unique` UNIQUE(`dedupe_key`)
);
--> statement-breakpoint
CREATE TABLE `override_intervals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`day` date NOT NULL,
	`kind` varchar(8) NOT NULL,
	`start_minute` smallint NOT NULL,
	`end_minute` smallint NOT NULL,
	CONSTRAINT `override_intervals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` varchar(190) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`window_start` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	CONSTRAINT `rate_limits_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `redirects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_path` varchar(255) NOT NULL,
	`to_path` varchar(255) NOT NULL,
	`permanent` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `redirects_id` PRIMARY KEY(`id`),
	CONSTRAINT `redirects_from_path_unique` UNIQUE(`from_path`)
);
--> statement-breakpoint
CREATE TABLE `schedule_locks` (
	`day` date NOT NULL,
	CONSTRAINT `schedule_locks_day` PRIMARY KEY(`day`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`mfa_passed` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`last_seen_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`expires_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	`user_agent` varchar(255),
	`ip_hash` varchar(64),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(120) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_by` int,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `treatments` (
	`id` varchar(60) NOT NULL,
	`category` varchar(30) NOT NULL,
	`name_nl` varchar(120) NOT NULL,
	`name_en` varchar(120) NOT NULL,
	`description_nl` text NOT NULL,
	`description_en` text NOT NULL,
	`price_cents` int,
	`price_from` boolean NOT NULL DEFAULT false,
	`duration_minutes` smallint,
	`buffer_minutes` smallint NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`visible` boolean NOT NULL DEFAULT true,
	`featured` boolean NOT NULL DEFAULT false,
	`bookable_online` boolean NOT NULL DEFAULT false,
	`media_id` int,
	`sort` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `treatments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(190) NOT NULL,
	`name` varchar(120) NOT NULL DEFAULT '',
	`role` varchar(20) NOT NULL DEFAULT 'owner',
	`password_hash` varchar(255),
	`password_changed_at` datetime(3),
	`mfa_secret_enc` varchar(255),
	`mfa_enabled` boolean NOT NULL DEFAULT false,
	`failed_logins` int NOT NULL DEFAULT 0,
	`locked_until` datetime(3),
	`last_login_at` datetime(3),
	`disabled` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `weekly_hours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekday` tinyint NOT NULL,
	`kind` varchar(8) NOT NULL,
	`start_minute` smallint NOT NULL,
	`end_minute` smallint NOT NULL,
	CONSTRAINT `weekly_hours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointment_events` ADD CONSTRAINT `appointment_events_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointment_treatments` ADD CONSTRAINT `appointment_treatments_appointment_id_appointments_id_fk` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media_variants` ADD CONSTRAINT `media_variants_media_id_media_id_fk` FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mfa_recovery_codes` ADD CONSTRAINT `mfa_recovery_codes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ae_appt_idx` ON `appointment_events` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `appt_start_idx` ON `appointments` (`start_at`);--> statement-breakpoint
CREATE INDEX `appt_status_idx` ON `appointments` (`status`);--> statement-breakpoint
CREATE INDEX `appt_customer_idx` ON `appointments` (`customer_id`);--> statement-breakpoint
CREATE INDEX `audit_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `blocks_range_idx` ON `blocks` (`start_at`,`end_at`);--> statement-breakpoint
CREATE INDEX `cv_doc_idx` ON `content_versions` (`doc_key`,`locale`,`version`);--> statement-breakpoint
CREATE INDEX `customers_email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customers_phone_idx` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`last_name`,`first_name`);--> statement-breakpoint
CREATE INDEX `inq_status_idx` ON `inquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `mrc_user_idx` ON `mfa_recovery_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `outbox_due_idx` ON `outbox` (`status`,`send_after`);--> statement-breakpoint
CREATE INDEX `outbox_appt_idx` ON `outbox` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `oi_day_idx` ON `override_intervals` (`day`);--> statement-breakpoint
CREATE INDEX `prt_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `wh_weekday_idx` ON `weekly_hours` (`weekday`);