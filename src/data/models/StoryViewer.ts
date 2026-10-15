import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface StoryViewerAttributes {
  id: number;
  storyId: number;
  userId: number;
  viewedAt: Date;
}

export interface StoryViewerCreationAttributes extends Optional<StoryViewerAttributes, 'id' | 'viewedAt'> {}

export class StoryViewer
  extends Model<StoryViewerAttributes, StoryViewerCreationAttributes>
  implements StoryViewerAttributes {
  public id!: number;
  public storyId!: number;
  public userId!: number;
  public viewedAt!: Date;
}

export const initStoryViewer = (sequelize: Sequelize) => {
  StoryViewer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      storyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'stories',
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
      viewedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'story_viewers',
      timestamps: false,
      indexes: [{ unique: true, fields: ['storyId', 'userId'] }],
    }
  );

  return StoryViewer;
};

export default StoryViewer;
