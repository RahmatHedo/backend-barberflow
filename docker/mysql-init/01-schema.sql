-- =============================================
-- Hair Connect - MySQL schema for Docker init
-- Copied from live DB (hair_connect) structure
-- =============================================

CREATE DATABASE IF NOT EXISTS `hair_connect`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hair_connect`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','barber') NOT NULL DEFAULT 'barber',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 30,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_services_active` (`is_active`,`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `queue_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_number` varchar(10) DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `service_id` int(11) NOT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `status` enum('waiting','serving','completed','cancelled','no_show') NOT NULL DEFAULT 'waiting',
  `check_in_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `called_time` timestamp NULL DEFAULT NULL,
  `start_time` timestamp NULL DEFAULT NULL,
  `end_time` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `preferred_barber_id` int(11) DEFAULT NULL,
  `lane_type` enum('request','free') NOT NULL DEFAULT 'free',
  PRIMARY KEY (`id`),
  KEY `fk_queue_service` (`service_id`),
  KEY `fk_queue_barber` (`barber_id`),
  KEY `idx_queue_status_position` (`status`),
  KEY `idx_queue_checkin` (`check_in_time`),
  KEY `idx_queue_date_status` (`status`),
  KEY `idx_status_preferred` (`status`,`preferred_barber_id`),
  CONSTRAINT `fk_queue_barber` FOREIGN KEY (`barber_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_queue_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_entry_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `method` enum('cash','qris','e_wallet','bank_transfer','card') NOT NULL DEFAULT 'cash',
  `status` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_queue_entry` (`queue_entry_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_payment_queue_entry` FOREIGN KEY (`queue_entry_id`) REFERENCES `queue_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `queue_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `queue_entry_id` int(11) NOT NULL,
  `action` enum('joined','called','completed','cancelled','no_show') NOT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `performed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_log_performer` (`performed_by`),
  KEY `idx_log_entry` (`queue_entry_id`),
  KEY `idx_log_action` (`action`),
  CONSTRAINT `fk_log_entry` FOREIGN KEY (`queue_entry_id`) REFERENCES `queue_entries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_performer` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `store_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `is_open` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;