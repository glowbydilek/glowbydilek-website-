ALTER TABLE `customers` ADD `blocked_at` datetime(3);--> statement-breakpoint
ALTER TABLE `customers` ADD `block_reason` varchar(300);
