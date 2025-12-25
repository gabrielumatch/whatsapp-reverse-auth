export enum SessionStatus {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    INITIALIZING = 'initializing'
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    ERROR = 'error',
    PENDING = 'pending'
}

export enum MessageType {
    TEXT = 'conversation',
    EXTENDED_TEXT = 'extendedTextMessage',
    IMAGE = 'imageMessage',
    VIDEO = 'videoMessage',
    AUDIO = 'audioMessage',
    DOCUMENT = 'documentMessage',
    STICKER = 'stickerMessage',
    LOCATION = 'locationMessage',
    CONTACT = 'contactMessage',
    BUTTONS = 'buttonsMessage',
    VIEW_ONCE = 'viewOnceMessage',
    VIEW_ONCE_V2 = 'viewOnceMessageV2'
}

export const API_ERRORS = {
    MISSING_FIELDS: "Missing required fields",
    NOT_FOUND: "Resource not found",
    INTERNAL_SERVER_ERROR: "Internal Server Error",
    UNAUTHORIZED: "Unauthorized",
    BAD_REQUEST: "Bad Request"
} as const;
