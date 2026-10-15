import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface StoryAttributes {
  id: number;
  userId: number;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StoryCreationAttributes
  extends Optional<StoryAttributes, 'id' | 'mediaType' | 'caption'> {}

export class Story extends Model<StoryAttributes, StoryCreationAttributes> implements StoryAttributes {
  public id!: number;
  public userId!: number;
  public mediaUrl!: string;
  public mediaType!: 'image' | 'video';
  public caption!: string | null;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const initStory = (sequelize: Sequelize) => {
  Story.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      mediaUrl: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      mediaType: {
        type: DataTypes.ENUM('image', 'video'),
        defaultValue: 'image',
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'stories',
      timestamps: true,
      indexes: [{ fields: ['userId'] }, { fields: ['expiresAt'] }],
    }
  );

  return Story;
};

export default Story;
