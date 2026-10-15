import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface CallAttributes {
  id: number;
  conversationId: number;
  callerId: number;
  type: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  startedAt?: Date | null;
  endedAt?: Date | null;
  duration?: number | null;
  createdAt?: Date;
}

export interface CallCreationAttributes
  extends Optional<CallAttributes, 'id' | 'status' | 'startedAt' | 'endedAt' | 'duration'> {}

export class Call extends Model<CallAttributes, CallCreationAttributes> implements CallAttributes {
  public id!: number;
  public conversationId!: number;
  public callerId!: number;
  public type!: 'audio' | 'video';
  public status!: 'initiated' | 'ringing' | 'connected' | 'ended' | 'rejected' | 'missed';
  public startedAt!: Date | null;
  public endedAt!: Date | null;
  public duration!: number | null;

  public readonly createdAt!: Date;
}

export const initCall = (sequelize: Sequelize) => {
  Call.init(
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
      callerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.ENUM('audio', 'video'),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('initiated', 'ringing', 'connected', 'ended', 'rejected', 'missed'),
        defaultValue: 'initiated',
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'calls',
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['conversationId'] }, { fields: ['callerId'] }],
    }
  );

  return Call;
};

export default Call;
