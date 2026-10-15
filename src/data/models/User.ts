import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password?: string;
  displayName: string;
  avatar?: string | null;
  status?: string | null;
  isOnline?: boolean;
  lastSeen?: Date;
  publicKey?: string | null;
  deviceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isOnline' | 'lastSeen' | 'avatar' | 'status' | 'publicKey' | 'deviceId'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public declare id: number;
  public declare username: string;
  public declare email: string;
  public declare password?: string;
  public declare displayName: string;
  public declare avatar: string | null;
  public declare status: string | null;
  public declare isOnline: boolean;
  public declare lastSeen: Date;
  public declare publicKey: string | null;
  public declare deviceId: string | null;

  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    const hash = this.getDataValue('password') || this.password;
    if (!hash || !candidatePassword) return false;
    return bcrypt.compare(candidatePassword, hash);
  }
}

export const initUser = (sequelize: Sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(150),
        allowNull: true,
        defaultValue: null,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      publicKey: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      deviceId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user: User) => {
          const rawPassword = user.getDataValue('password') || user.password;
          if (rawPassword) {
            const hashed = await bcrypt.hash(rawPassword, 10);
            user.setDataValue('password', hashed);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            const rawPassword = user.getDataValue('password') || user.password;
            if (rawPassword) {
              const hashed = await bcrypt.hash(rawPassword, 10);
              user.setDataValue('password', hashed);
            }
          }
        },
      },
    }
  );

  return User;
};

export default User;
