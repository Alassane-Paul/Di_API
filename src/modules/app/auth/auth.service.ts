import { Request, Response } from 'express';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../../../data/models';
import { config } from '../../../configs/app.config';
import { responses } from '../../../data/responses';
import { successResponse, errorResponse, sanitizeUser } from '../../../utils/service.helper';

export async function registerService(req: Request, res: Response) {
  try {
    const { username, email, password, displayName } = req.validatedData || req.body;

    const publicKey = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      username,
      email,
      password,
      displayName: displayName || username,
      publicKey,
    });

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const sanitized = sanitizeUser(user);
    return res.status(responses.HTTP_CODES.CREATED).json({
      responseCode: responses.CALL_BACK_MESSAGES.REGISTRATION_SUCCESS.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.REGISTRATION_SUCCESS.MESSAGE,
      token,
      user: sanitized,
      data: [{
        token,
        user: sanitized,
      }],
    });
  } catch (error) {
    return errorResponse(res, error, 'RegisterService');
  }
}

export async function loginService(req: Request, res: Response) {
  try {
    const { username, password, deviceId } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(responses.HTTP_CODES.UNAUTHORIZED).json({
        responseCode: responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.INVALID_USER_CREDENTIALS.MESSAGE,
        data: [],
      });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    if (deviceId) user.deviceId = deviceId;
    await user.save();

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const sanitized = sanitizeUser(user);
    return res.status(responses.HTTP_CODES.RESULT_OK).json({
      responseCode: responses.CALL_BACK_MESSAGES.LOGIN_SUCCESS.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.LOGIN_SUCCESS.MESSAGE,
      token,
      user: sanitized,
      data: [{
        token,
        user: sanitized,
      }],
    });
  } catch (error) {
    return errorResponse(res, error, 'LoginService');
  }
}

export async function getProfileService(req: Request, res: Response) {
  try {
    const user = await User.findByPk(req.userId as number, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    return successResponse(res, 'SUCCESS', user);
  } catch (error) {
    return errorResponse(res, error, 'GetProfileService');
  }
}

export async function updateProfileService(req: Request, res: Response) {
  try {
    const { displayName, avatar, status } = req.body;
    const user = await User.findByPk(req.userId as number);

    if (!user) {
      return res.status(responses.HTTP_CODES.NOT_FOUND).json({
        responseCode: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.CODE,
        responseMessage: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
        error: responses.CALL_BACK_MESSAGES.USER_NOT_FOUND.MESSAGE,
        data: [],
      });
    }

    if (displayName) user.displayName = displayName;
    if (avatar) user.avatar = avatar;
    if (status !== undefined) user.status = status;
    await user.save();

    return successResponse(res, 'PROFILE_UPDATED', sanitizeUser(user));
  } catch (error) {
    return errorResponse(res, error, 'UpdateProfileService');
  }
}

export async function searchUsersService(req: Request, res: Response) {
  try {
    const { query } = req.query as { query: string };
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.userId },
        [Op.or]: [
          { username: { [Op.like]: `%${query}%` } },
          { displayName: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ['id', 'username', 'displayName', 'avatar', 'status', 'isOnline', 'lastSeen'],
      limit: 20,
    });

    return successResponse(res, 'LIST_RETRIEVED', users);
  } catch (error) {
    return errorResponse(res, error, 'SearchUsersService');
  }
}
