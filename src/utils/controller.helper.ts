import { Request, Response } from 'express';
import { responses } from '../data/responses';

export type ValidatorFunction = (
  req: Request
) => Promise<{ error: boolean; status?: number; responseCode?: string; responseMessage?: string; data?: any }> | {
  error: boolean;
  status?: number;
  responseCode?: string;
  responseMessage?: string;
  data?: any;
};

export type ServiceFunction = (req: Request, res: Response) => Promise<any> | any;

export function createController(
  validator: ValidatorFunction | null,
  service: ServiceFunction,
  controllerName: string
) {
  return async (req: Request, res: Response) => {
    try {
      if (validator) {
        const validation = await validator(req);

        if (validation.error) {
          return res.status(validation.status || responses.HTTP_CODES.VALIDATION_ERROR).json({
            responseCode: validation.responseCode || responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
            responseMessage: validation.responseMessage || 'Erreur de validation',
            error: validation.responseMessage || 'Erreur de validation',
            data: validation.data || [],
          });
        }

        req.validatedData = validation.data;
      }

      await service(req, res);
    } catch (error: any) {
      console.error(`[${controllerName} Error]:`, error);
      return res.status(responses.HTTP_CODES.SERVER_ERROR).json({
        responseCode: responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.CODE,
        responseMessage: error?.message || responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
        error: error?.message || responses.CALL_BACK_MESSAGES.UNKNOWN_PROBLEM.MESSAGE,
        data: [],
      });
    }
  };
}

export default createController;
