import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ConversationAttributes {
  id: number;
  type: 'direct' | 'group';
  name?: string | null;
  avatar?: string | null;
  description?: string | null;
  createdBy?: number | null;
  lastMessageId?: number | null;
  lastMessageAt?: Date | null;
  isArchived?: boolean;
  archivedBy?: number[];
  isPinned?: boolean;
  pinnedBy?: number[];
  mutedUntil?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ConversationCreationAttributes
  extends Optional<
    ConversationAttributes,
    'id' | 'type' | 'name' | 'avatar' | 'description' | 'createdBy' | 'lastMessageId' | 'lastMessageAt' | 'isArchived' | 'archivedBy' | 'isPinned' | 'pinnedBy' | 'mutedUntil'
  > {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: number;
  public type!: 'direct' | 'group';
  public name!: string | null;
  public avatar!: string | null;
  public description!: string | null;
  public createdBy!: number | null;
  public lastMessageId!: number | null;
  public lastMessageAt!: Date | null;
  public isArchived!: boolean;
  public archivedBy!: number[];
  public isPinned!: boolean;
  public pinnedBy!: number[];
  public mutedUntil!: Record<string, string>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initConversation = (sequelize: Sequelize) => {
  Conversation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM('direct', 'group'),
        defaultValue: 'direct',
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      lastMessageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isArchived: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      archivedBy: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      isPinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      pinnedBy: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      mutedUntil: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
    },
    {
      sequelize,
      tableName: 'conversations',
      timestamps: true,
      indexes: [
        { fields: ['type'] },
        { fields: ['lastMessageAt'] },
      ],
    }
  );

  return Conversation;
};

export default Conversation;
