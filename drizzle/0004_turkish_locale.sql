ALTER TABLE `appointment_treatments` ADD `name_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `title_tr` varchar(140);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `text_tr` varchar(400);--> statement-breakpoint
ALTER TABLE `campaigns` ADD `cta_tr` varchar(60);--> statement-breakpoint
ALTER TABLE `custom_pages` ADD `slug_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `media` ADD `alt_tr` varchar(300) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `promotions` ADD `name_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `promotions` ADD `note_tr` varchar(300);--> statement-breakpoint
ALTER TABLE `service_groups` ADD `slug_tr` varchar(80);--> statement-breakpoint
ALTER TABLE `service_groups` ADD `name_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `service_sections` ADD `slug_tr` varchar(80);--> statement-breakpoint
ALTER TABLE `service_sections` ADD `name_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `treatments` ADD `name_tr` varchar(120);--> statement-breakpoint
ALTER TABLE `treatments` ADD `description_tr` text;--> statement-breakpoint
ALTER TABLE `treatments` ADD `slug_tr` varchar(120);