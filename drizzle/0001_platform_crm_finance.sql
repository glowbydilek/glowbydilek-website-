CREATE TABLE `consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`data_enc` text NOT NULL,
	`form_version` varchar(20) NOT NULL,
	`consent_at` datetime(3) NOT NULL,
	`consent_method` varchar(20) NOT NULL,
	`consent_text_version` varchar(20) NOT NULL,
	`reviewed_at` datetime(3) NOT NULL,
	`next_review_at` datetime(3) NOT NULL,
	`withdrawn_at` datetime(3),
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `consultations_id` PRIMARY KEY(`id`),
	CONSTRAINT `consult_customer_idx` UNIQUE(`customer_id`)
);
--> statement-breakpoint
CREATE TABLE `customer_merges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`from_customer_id` int NOT NULL,
	`into_customer_id` int NOT NULL,
	`snapshot` json NOT NULL,
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `customer_merges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoice_counters` (
	`year` int NOT NULL,
	`last` int NOT NULL,
	CONSTRAINT `invoice_counters_year` PRIMARY KEY(`year`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(32),
	`kind` varchar(10) NOT NULL DEFAULT 'invoice',
	`status` varchar(10) NOT NULL DEFAULT 'draft',
	`corrects_invoice_id` int,
	`customer_id` int NOT NULL,
	`appointment_id` int,
	`issue_date` date,
	`due_date` date,
	`supply_date` date,
	`seller` json,
	`buyer` json NOT NULL,
	`lines` json NOT NULL,
	`vat_mode` varchar(12),
	`subtotal_cents` int NOT NULL DEFAULT 0,
	`vat_cents` int NOT NULL DEFAULT 0,
	`total_cents` int NOT NULL DEFAULT 0,
	`note` varchar(500),
	`locale` varchar(5) NOT NULL DEFAULT 'nl',
	`pdf` longblob,
	`pdf_sha256` varchar(64),
	`issued_at` datetime(3),
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`appointment_id` int,
	`invoice_id` int,
	`amount_cents` int NOT NULL,
	`method` varchar(16) NOT NULL,
	`kind` varchar(10) NOT NULL DEFAULT 'payment',
	`paid_on` date NOT NULL,
	`note` varchar(300),
	`voided_at` datetime(3),
	`void_reason` varchar(200),
	`user_id` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`appointment_id` int NOT NULL,
	`customer_id` int NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `review_invites_id` PRIMARY KEY(`id`),
	CONSTRAINT `review_invites_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rating` tinyint NOT NULL,
	`body` text NOT NULL,
	`display_name` varchar(60) NOT NULL,
	`display_mode` varchar(12) NOT NULL DEFAULT 'name',
	`treatment_id` varchar(60),
	`locale` varchar(5) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'pending',
	`verified` boolean NOT NULL DEFAULT false,
	`customer_id` int,
	`appointment_id` int,
	`owner_reply` text,
	`moderation_note` varchar(300),
	`report_count` int NOT NULL DEFAULT 0,
	`email_hash` varchar(64),
	`published_at` datetime(3),
	`moderated_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointment_treatments` ADD `price_cents` int;--> statement-breakpoint
ALTER TABLE `appointments` ADD `price_cents` int;--> statement-breakpoint
ALTER TABLE `customers` ADD `email_norm` varchar(190);--> statement-breakpoint
ALTER TABLE `customers` ADD `phone_norm` varchar(20);--> statement-breakpoint
ALTER TABLE `customers` ADD `merged_into_id` int;--> statement-breakpoint
ALTER TABLE `outbox` ADD `attachment_kind` varchar(20);--> statement-breakpoint
ALTER TABLE `outbox` ADD `attachment_ref` int;--> statement-breakpoint
ALTER TABLE `outbox` ADD `customer_id` int;--> statement-breakpoint
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `inv_customer_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `inv_issue_idx` ON `invoices` (`issue_date`);--> statement-breakpoint
CREATE INDEX `inv_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `pay_customer_idx` ON `payments` (`customer_id`);--> statement-breakpoint
CREATE INDEX `pay_date_idx` ON `payments` (`paid_on`);--> statement-breakpoint
CREATE INDEX `pay_invoice_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `pay_appt_idx` ON `payments` (`appointment_id`);--> statement-breakpoint
CREATE INDEX `rev_status_idx` ON `reviews` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `customers_email_norm_idx` ON `customers` (`email_norm`);--> statement-breakpoint
CREATE INDEX `customers_phone_norm_idx` ON `customers` (`phone_norm`);