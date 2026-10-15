import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface MessageAttributes {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string | null;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'voice';
  mediaUrl?: string | null;
  mediaDuration?: number | null;
  mediaSize?: number | null;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  location?: any;
  contact?: any;
  isRead: boolean;
  isDelivered: boolean;
  isEdited: boolean;
  editedAt?: Date | null;
  replyToMessageId?: number | null;
  isDeletedForEveryone: boolean;
  deletedForEveryoneAt?: Date | null;
  deletedForUsers: number[];
  timestamp: Date;
  createdAt?: Date;
}

export interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    | 'id'
    | 'content'
    | 'messageType'
    | 'mediaUrl'
    | 'mediaDuration'
    | 'mediaSize'
    | 'thumbnailUrl'
    | 'fileName'
    | 'location'
    | 'contact'
    | 'isRead'
    | 'isDelivered'
    | 'isEdited'
    | 'editedAt'
    | 'replyToMessageId'
    | 'isDeletedForEveryone'
    | 'deletedForEveryoneAt'
    | 'deletedForUsers'
    | 'timestamp'
  > {}

export class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string | null;
  public messageType!: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'voice';
  public mediaUrl!: string | null;
  public mediaDuration!: number | null;
  public mediaSize!: number | null;
  public thumbnailUrl!: string | null;
  public fileName!: string | null;
  public location!: any;
  public contact!: any;
  public isRead!: boolean;
  public isDelivered!: boolean;
  public isEdited!: boolean;
  public editedAt!: Date | null;
  public replyToMessageId!: number | null;
  public isDeletedForEveryone!: boolean;
  public deletedForEveryoneAt!: Date | null;
  public deletedForUsers!: number[];
  public timestamp!: Date;

  public readonly createdAt!: Date;
}

export const initMessage = (sequelize: Sequelize) => {
  Message.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id',
        },
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'voice'),
        defaultValue: 'text',
      },
      mediaUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mediaDuration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mediaSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      thumbnailUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      location: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      contact: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isDelivered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      editedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      replyToMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id',
        },
      },
      isDeletedForEveryone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      deletedForEveryoneAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deletedForUsers: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'messages',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ['conversationId', 'timestamp'] },
        { fields: ['senderId'] },
      ],
    }
  );

  return Message;
};

export default Message;
