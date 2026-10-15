import { Router } from 'express';
import { createController } from '../../../utils/controller.helper';
import { authenticate } from '../../../middlewares/auth.middleware';
import { bodyMiddleware } from '../../../middlewares/body.middleware';
import { authLimiter } from '../../../middlewares/ratelimit.middleware';
import { registerValidator, loginValidator } from './auth.validator';
import {
  registerService,
  loginService,
  getProfileService,
  updateProfileService,
  searchUsersService,
} from './auth.service';

const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  bodyMiddleware,
  createController(registerValidator, registerService, 'RegisterController')
);

authRouter.post(
  '/login',
  authLimiter,
  bodyMiddleware,
  createController(loginValidator, loginService, 'LoginController')
);

authRouter.get('/profile', authenticate, createController(null, getProfileService, 'GetProfileController'));

authRouter.put(
  '/profile',
  authenticate,
  bodyMiddleware,
  createController(null, updateProfileService, 'UpdateProfileController')
);

authRouter.get('/search', authenticate, createController(null, searchUsersService, 'SearchUsersController'));

export { authRouter };
export default authRouter;
