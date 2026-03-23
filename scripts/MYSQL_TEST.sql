select 1;
select database();
show databases;

CREATE DATABASE IF NOT EXISTS fourjo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE fourjo;

DROP DATABASE IF EXISTS fourjo;
CREATE DATABASE fourjo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
