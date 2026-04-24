// Extend Express Request to support req.user globally
// This avoids the AuthRequest incompatibility with RequestHandler
import { IUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
