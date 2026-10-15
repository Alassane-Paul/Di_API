import { Request } from 'express';
import { constants } from '../../../data/constants';
import { responses } from '../../../data/responses';
import { User } from '../../../data/models';
import { Op } from 'sequelize';

export async function registerValidator(req: Request) {
  const { username, email, password, displayName } = req.body;

  if (!username || typeof username !== 'string') {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.MESSAGE,
    };
  }

  if (username.length < constants.LENGTHS.USERNAME.MIN || username.length > constants.LENGTHS.USERNAME.MAX) {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.INVALID_USERNAME.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.INVALID_USERNAME.MESSAGE,
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.INVALID_EMAIL.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.INVALID_EMAIL.MESSAGE,
    };
  }

  if (!password || password.length < constants.LENGTHS.PASSWORD.MIN || password.length > constants.LENGTHS.PASSWORD.MAX) {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.MESSAGE,
    };
  }

  const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
  if (existing) {
    return {
      error: true,
      status: responses.HTTP_CODES.CONFLICT,
      responseCode: responses.CALL_BACK_MESSAGES.USER_ALREADY_EXISTS.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.USER_ALREADY_EXISTS.MESSAGE,
    };
  }

  return { error: false, data: { username: username.trim(), email: email.trim().toLowerCase(), password, displayName: displayName || username } };
}

export async function loginValidator(req: Request) {
  const { username, password } = req.body;

  if (!username) {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.USERNAME_REQUIRED.MESSAGE,
    };
  }

  if (!password) {
    return {
      error: true,
      status: responses.HTTP_CODES.VALIDATION_ERROR,
      responseCode: responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.CODE,
      responseMessage: responses.CALL_BACK_MESSAGES.INVALID_PASSWORD.MESSAGE,
    };
  }

  return { error: false };
}
