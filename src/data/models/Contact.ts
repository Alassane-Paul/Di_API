import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface ContactAttributes {
  id: number;
  userId: number;
  contactUserId: number;
  displayName?: string | null;
  isBlocked: boolean;
  isFavorite: boolean;
  addedAt: Date;
  createdAt?: Date;
}

export interface ContactCreationAttributes
  extends Optional<ContactAttributes, 'id' | 'displayName' | 'isBlocked' | 'isFavorite' | 'addedAt'> {}

export class Contact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public userId!: number;
  public contactUserId!: number;
  public displayName!: string | null;
  public isBlocked!: boolean;
  public isFavorite!: boolean;
  public addedAt!: Date;

  public readonly createdAt!: Date;
}

export const initContact = (sequelize: Sequelize) => {
  Contact.init(
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
      contactUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isFavorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'contacts',
      timestamps: true,
      updatedAt: false,
      indexes: [{ unique: true, fields: ['userId', 'contactUserId'] }],
    }
  );

  return Contact;
};

export default Contact;
