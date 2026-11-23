CREATE TABLE `intake_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`locale` varchar(2) NOT NULL,
	`template_version` varchar(40) NOT NULL,
	`status` varchar(12) NOT NULL DEFAULT 'sent',
	`expires_at` datetime(3) NOT NULL,
	`completed_at` datetime(3),
	`document_id` int,
	`created_by` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `intake_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `intake_requests_token_hash_unique` UNIQUE(`token_hash`)
);--> statement-breakpoint
CREATE INDEX `intake_req_customer_idx` ON `intake_requests` (`customer_id`,`status`);--> statement-breakpoint
ALTER TABLE `intake_documents` ADD `source` varchar(10) DEFAULT 'upload' NOT NULL;--> statement-breakpoint
ALTER TABLE `intake_documents` ADD `reviewed_at` datetime(3);--> statement-breakpoint
ALTER TABLE `intake_documents` ADD `reviewed_by` int;--> statement-breakpoint
ALTER TABLE `intake_documents` ADD `copy_token_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `intake_documents` ADD `copy_expires_at` datetime(3);
