CREATE TABLE `intake_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`template_version` varchar(40) NOT NULL,
	`locale` varchar(2) NOT NULL,
	`signed_on` date NOT NULL,
	`status` varchar(12) NOT NULL,
	`mime` varchar(60) NOT NULL,
	`size` int NOT NULL,
	`sha256` varchar(64) NOT NULL,
	`original_sha256` varchar(64) NOT NULL,
	`metadata_stripped` boolean NOT NULL DEFAULT false,
	`data_enc` longblob,
	`note` varchar(300),
	`uploaded_by` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`superseded_at` datetime(3),
	`deleted_at` datetime(3),
	`deleted_by` int,
	`delete_reason` varchar(200),
	CONSTRAINT `intake_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intake_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`locale` varchar(2) NOT NULL,
	`version` varchar(40) NOT NULL,
	`status` varchar(10) NOT NULL,
	`title` varchar(200) NOT NULL,
	`source` text NOT NULL,
	`change_note` varchar(300),
	`created_by` int,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`activated_at` datetime(3),
	`retired_at` datetime(3),
	CONSTRAINT `intake_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `intake_tpl_version_idx` UNIQUE(`locale`,`version`)
);
--> statement-breakpoint
CREATE INDEX `intake_doc_customer_idx` ON `intake_documents` (`customer_id`,`status`);--> statement-breakpoint
CREATE INDEX `intake_tpl_status_idx` ON `intake_templates` (`locale`,`status`);