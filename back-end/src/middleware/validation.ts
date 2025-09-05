import type { NextFunction, Request, Response } from 'express';
import Joi from 'joi'

export const validateSubmission = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    exerciseNumber: Joi.number().integer().min(1).required()
      .messages({
        'number.base': 'Exercise number must be a number',
        'number.integer': 'Exercise number must be an integer',
        'number.min': 'Exercise number must be at least 1',
        'any.required': 'Exercise number is required',
      }),
    code: Joi.string().min(1).max(10000).required()
      .messages({
        'string.empty': 'Code cannot be empty',
        'string.min': 'Code must be at least 1 character long',
        'string.max': 'Code cannot exceed 10000 characters',
        'any.required': 'Code is required',
      }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    error.isJoi = true;
    return next(error);
  }

  next();
};
