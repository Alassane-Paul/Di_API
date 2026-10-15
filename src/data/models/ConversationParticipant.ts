import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ConversationParticipantAttributes {
  id: number;
  conversationId: number;
  userId: number;
  role: 'admin' | 'moderator' | 'member';
  unreadCount: number;
  lastReadMessageId?: number | null;
  joinedAt: Date;
  isAdmin: boolean;
  canSendMessages: boolean;
  createdAt?: Date;
}

export interface ConversationParticipantCreationAttributes
  extends Optional<
    ConversationParticipantAttributes,
    'id' | 'role' | 'unreadCount' | 'lastReadMessageId' | 'joinedAt' | 'isAdmin' | 'canSendMessages'
  > {}

export class ConversationParticipant
  extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes>
  implements ConversationParticipantAttributes {
  public id!: number;
  public conversationId!: number;
  public userId!: number;
  public role!: 'admin' | 'moderator' | 'member';
  public unreadCount!: number;
  public lastReadMessageId!: number | null;
  public joinedAt!: Date;
  public isAdmin!: boolean;
  public canSendMessages!: boolean;

  public readonly createdAt!: Date;
}

export const initConversationParticipant = (sequelize: Sequelize) => {
  ConversationParticipant.init(
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM('admin', 'moderator', 'member'),
        defaultValue: 'member',
      },
      unreadCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canSendMessages: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'conversation_participants',
      timestamps: true,
      updatedAt: false,
      indexes: [
        { unique: true, fields: ['conversationId', 'userId'] },
        { fields: ['userId'] },
      ],
    }
  );

  return ConversationParticipant;
};

export default ConversationParticipant;
