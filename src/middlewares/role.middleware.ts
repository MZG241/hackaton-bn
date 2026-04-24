import { Request, Response, NextFunction } from "express";

const authorizeRole = (...args: string[] | [string[]]) => {
  // Accept both authorizeRole('a','b') and authorizeRole(['a','b'])
  const roles: string[] = Array.isArray(args[0]) ? args[0] : (args as string[]);

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).send("Forbidden");
    }

    next();
  };
};

export default authorizeRole;
