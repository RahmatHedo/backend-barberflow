-- =============================================
-- Hair Connect - Seed data for Docker init
-- Users verified: admin123 / barber123
-- =============================================

USE `hair_connect`;

-- Users (barbers + admin) - replicated from live DB
INSERT INTO `users` (`id`,`name`,`email`,`password_hash`,`role`,`phone`,`is_available`) VALUES
(4,'Agus Santoso','agus@barberflow.id','$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe','barber','08120000001',1),
(5,'Budi Prasetyo','budi@barberflow.id','$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe','barber','08120000002',1),
(6,'Chandra Wijaya','chandra@barberflow.id','$2b$10$ip59bMgXFq500jIeOZ2hE.nqEdoWerKokCUGuBFmkCNHJ/pYNaLXe','barber','08120000003',1),
(7,'Admin','admin@hairconnect.id','$2b$10$UkRXv1d6FYOdS0kvqX6.8e04CnA4x9BqWDZr4zbT.WjVdlMzItqZW','admin','08120000000',1);

-- Services
INSERT INTO `services` (`id`,`name`,`duration_minutes`,`price`,`display_order`,`is_active`) VALUES
(1,'Potong Rambut',30,35000,1,1),
(2,'Cukur Jenggot',15,20000,2,1),
(3,'Potong + Cukur Jenggot',40,50000,3,1),
(4,'Hair Perming',90,25000,4,1),
(5,'Hair Coloring',60,150000,5,1),
(6,'Hair Perming + Coloring',120,220000,6,1);

-- Store settings
INSERT INTO `store_settings` (`id`,`is_open`,`updated_by`) VALUES (1,1,7);

-- Queue entries (waiting test data)
INSERT INTO `queue_entries`
  (`id`,`queue_number`,`customer_name`,`customer_phone`,`service_id`,`barber_id`,`status`,`check_in_time`,`preferred_barber_id`,`lane_type`) VALUES
(1,'001','Iwan Test','08110000001',1,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(2,'002','Rina Test','08110000002',1,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(3,'003','Dedi Test','08110000003',1,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(4,'004','Sari Test','08110000004',3,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(5,'005','Tono Test','08110000005',1,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(6,'006','Mega Test','08110000006',1,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(7,'007','Joko Test','08110000007',2,NULL,'waiting','2026-09-05 15:41:50',NULL,'request'),
(8,'008','Dewi Test','08110000008',3,NULL,'waiting','2026-09-05 15:41:50',NULL,'request');