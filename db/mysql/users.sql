-- EduFlow auth store (MySQL).
--
-- This is the same DDL the app runs automatically on first use
-- (src/lib/auth-store.ts). It's provided here for DBAs who prefer to provision
-- the schema manually or review it before deploy. Safe to run repeatedly.
--
--   mysql -h <host> -u <user> -p <database> < db/mysql/users.sql

CREATE TABLE IF NOT EXISTS users (
  id                VARCHAR(36)   NOT NULL,
  email             VARCHAR(320)  NOT NULL,
  name              VARCHAR(255)  NOT NULL,
  role              ENUM('STUDENT','LECTURER','TA','ADMIN') NOT NULL DEFAULT 'STUDENT',
  password_hash     VARCHAR(255)  NULL,               -- scrypt$<salt>$<hash>
  email_verified_at DATETIME      NULL,
  avatar_url        VARCHAR(1024) NULL,
  bio               TEXT          NULL,
  institution       VARCHAR(255)  NULL,
  is_active         TINYINT(1)    NOT NULL DEFAULT 1,
  social_links      JSON          NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_key (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
