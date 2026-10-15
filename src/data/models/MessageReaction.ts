import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface MessageReactionAttributes {
  id: number;
  messageId: number;
  userId: number;
  emoji: string;
  createdAt?: Date;
}

export interface MessageReactionCreationAttributes extends Optional<MessageReactionAttributes, 'id'> {}

export class MessageReaction
  extends Model<MessageReactionAttributes, MessageReactionCreationAttributes>
  implements MessageReactionAttributes {
  public id!: number;
  public messageId!: number;
  public userId!: number;
  public emoji!: string;

  public readonly createdAt!: Date;
}

export const initMessageReaction = (sequelize: Sequelize) => {
  MessageReaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      messageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'messages',
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
      emoji: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'message_reactions',
      timestamps: true,
      updatedAt: false,
      indexes: [{ unique: true, fields: ['messageId', 'userId'] }],
    }
  );

  return MessageReaction;
};

export default MessageReaction;
