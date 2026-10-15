import { User } from '../data/models/User';

declare global {
  namespace Express {
    interface Request {
      userId?: number | string;
      user?: any;
      isAdmin?: boolean;
      validatedData?: any;
      _deviceInfoCache?: {
        deviceId: string | null;
        deviceName: string;
        deviceOs: string;
        ipAddress: string;
      };
    }
  }
}

export {};
