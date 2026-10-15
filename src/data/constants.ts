export const constants = {
  ACCESS_TOKEN_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 days
  ACCESS_TOKEN_NAME: 'accessToken',
  REFRESH_TOKEN_EXPIRY: 60 * 24 * 60 * 60 * 1000, // 60 days
  REFRESH_TOKEN_NAME: 'refreshToken',

  USER_ROLES: {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    MEMBER: 'member',
  },

  CONVERSATION_TYPES: {
    DIRECT: 'direct',
    GROUP: 'group',
  },

  MESSAGE_TYPES: {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
    LOCATION: 'location',
    CONTACT: 'contact',
    VOICE: 'voice',
  },

  CALL_TYPES: {
    AUDIO: 'audio',
    VIDEO: 'video',
  },

  CALL_STATUSES: {
    INITIATED: 'initiated',
    RINGING: 'ringing',
    CONNECTED: 'connected',
    ENDED: 'ended',
    REJECTED: 'rejected',
    MISSED: 'missed',
  },

  STORY_TYPES: {
    IMAGE: 'image',
    VIDEO: 'video',
  },

  LENGTHS: {
    STRING: { MIN: 2, MAX: 255 },
    TEXTES: { MIN: 1, MAX: 5000 },
    NAMES: { MIN: 2, MAX: 50 },
    USERNAME: { MIN: 3, MAX: 30 },
    PASSWORD: { MIN: 6, MAX: 64 },
  },

  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
};

export default constants;
