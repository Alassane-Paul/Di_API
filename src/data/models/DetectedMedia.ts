import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface DetectedMediaAttributes {
  id: number;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: 'image' | 'video' | 'audio';
  uploadedAt: Date;
  processed: boolean;
  userId?: number | null;
  createdAt?: Date;
}

export interface DetectedMediaCreationAttributes
  extends Optional<DetectedMediaAttributes, 'id' | 'uploadedAt' | 'processed' | 'userId'> {}

export class DetectedMedia
  extends Model<DetectedMediaAttributes, DetectedMediaCreationAttributes>
  implements DetectedMediaAttributes {
  public id!: number;
  public filePath!: string;
  public fileName!: string;
  public fileSize!: number;
  public fileType!: 'image' | 'video' | 'audio';
  public uploadedAt!: Date;
  public processed!: boolean;
  public userId!: number | null;

  public readonly createdAt!: Date;
}

export const initDetectedMedia = (sequelize: Sequelize) => {
  DetectedMedia.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      filePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      fileName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fileSize: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      fileType: {
        type: DataTypes.ENUM('image', 'video', 'audio'),
        allowNull: false,
      },
      uploadedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      processed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      tableName: 'detected_media',
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ['uploadedAt'] }, { fields: ['userId'] }],
    }
  );

  return DetectedMedia;
};

export default DetectedMedia;
