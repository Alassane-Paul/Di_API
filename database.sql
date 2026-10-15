-- Di Database Schema
-- MySQL Database

CREATE DATABASE IF NOT EXISTS di_app;
USE di_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    displayName VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    status VARCHAR(150),
    isOnline BOOLEAN DEFAULT FALSE,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
    publicKey TEXT,
    deviceId VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_displayName (displayName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('direct', 'group') DEFAULT 'direct',
    name VARCHAR(100),
    avatar VARCHAR(255),
    description TEXT,
    createdBy INT,
    lastMessageId INT,
    lastMessageAt DATETIME,
    isArchived BOOLEAN DEFAULT FALSE,
    archivedBy JSON,
    isPinned BOOLEAN DEFAULT FALSE,
    pinnedBy JSON,
    mutedUntil JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (lastMessageId) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_lastMessageAt (lastMessageAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversationId INT NOT NULL,
    senderId INT NOT NULL,
    content TEXT,
    messageType ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'voice') DEFAULT 'text',
    mediaUrl VARCHAR(255),
    mediaDuration INT,
    mediaSize INT,
    thumbnailUrl VARCHAR(255),
    fileName VARCHAR(255),
    location JSON,
    contact JSON,
    isRead BOOLEAN DEFAULT FALSE,
    isDelivered BOOLEAN DEFAULT FALSE,
    isEdited BOOLEAN DEFAULT FALSE,
    editedAt DATETIME,
    replyToMessageId INT,
    isDeletedForEveryone BOOLEAN DEFAULT FALSE,
    deletedForEveryoneAt DATETIME,
    deletedForUsers JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (replyToMessageId) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_conversation_timestamp (conversationId, timestamp),
    INDEX idx_senderId (senderId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation Participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversationId INT NOT NULL,
    userId INT NOT NULL,
    role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
    unreadCount INT DEFAULT 0,
    lastReadMessageId INT,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    isAdmin BOOLEAN DEFAULT FALSE,
    canSendMessages BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversationId, userId),
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    messageId INT NOT NULL,
    userId INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reaction (messageId, userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    contactUserId INT NOT NULL,
    displayName VARCHAR(100),
    isBlocked BOOLEAN DEFAULT FALSE,
    isFavorite BOOLEAN DEFAULT FALSE,
    addedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contactUserId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_contact (userId, contactUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversationId INT NOT NULL,
    callerId INT NOT NULL,
    type ENUM('audio', 'video') NOT NULL,
    status ENUM('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed') DEFAULT 'initiated',
    startedAt DATETIME,
    endedAt DATETIME,
    duration INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (callerId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversationId (conversationId),
    INDEX idx_callerId (callerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Detected Media table (for surveillance)
CREATE TABLE IF NOT EXISTS detected_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filePath VARCHAR(500) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    fileSize BIGINT NOT NULL,
    fileType ENUM('image', 'video', 'audio') NOT NULL,
    uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE,
    userId INT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_uploadedAt (uploadedAt),
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stories table (Statuts / Vues uniques 24h)
CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    mediaUrl VARCHAR(500) NOT NULL,
    mediaType ENUM('image', 'video') DEFAULT 'image',
    caption TEXT,
    expiresAt DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Story Viewers table
CREATE TABLE IF NOT EXISTS story_viewers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    storyId INT NOT NULL,
    userId INT NOT NULL,
    viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (storyId) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_story_viewer (storyId, userId),
    INDEX idx_storyId (storyId),
    INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

