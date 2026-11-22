CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dedupe_key` varchar(190) NOT NULL,
	`kind` varchar(40) NOT NULL,
	`category` varchar(16) NOT NULL,
	`title` varchar(120) NOT NULL,
	`body` varchar(200) NOT NULL DEFAULT '',
	`url` varchar(250) NOT NULL,
	`entity_type` varchar(24),
	`entity_id` int,
	`actionable` boolean NOT NULL DEFAULT false,
	`state` varchar(12) NOT NULL DEFAULT 'open',
	`read_at` datetime(3),
	`resolved_at` datetime(3),
	`push_status` varchar(12) NOT NULL DEFAULT 'pending',
	`push_attempts` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `notifications_dedupe_key_unique` UNIQUE(`dedupe_key`)
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`endpoint_hash` varchar(64) NOT NULL,
	`endpoint` varchar(1000) NOT NULL,
	`p256dh` varchar(120) NOT NULL,
	`auth` varchar(40) NOT NULL,
	`device` varchar(80) NOT NULL DEFAULT '',
	`failures` int NOT NULL DEFAULT 0,
	`last_success_at` datetime(3),
	`disabled_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `push_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_subscriptions_endpoint_hash_unique` UNIQUE(`endpoint_hash`)
);
--> statement-breakpoint
ALTER TABLE `push_subscriptions` ADD CONSTRAINT `push_subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notif_state_idx` ON `notifications` (`state`,`actionable`);--> statement-breakpoint
CREATE INDEX `notif_push_idx` ON `notifications` (`push_status`);--> statement-breakpoint
CREATE INDEX `notif_created_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `push_sub_user_idx` ON `push_subscriptions` (`user_id`);
