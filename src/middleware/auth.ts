import { Request as ExpressRequest, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { config } from "dotenv";

config();

interface Request extends ExpressRequest {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

const ENV = process.env.NODE_ENV;

export function authorize(allowedRoles?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const jwt = req.headers.authorization?.split(" ")[1];

    if (!jwt) {
      // if (ENV === "development") {
      //   req.user = {
      //     id: "666666666666666666666666",
      //     email: "test@test.com",
      //     role: "admin",
      //   };
      //   next();
      //   return;
      // }
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }

    verify(jwt, secret, (err, decoded) => {
      if (err || !decoded) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = decoded as { userId: string; email: string; role?: string };
      req.user = { id: user.userId, email: user.email, role: user.role };

      // If roles are specified, check if the user has the required role
      if (
        allowedRoles?.length &&
        (!user.role || !allowedRoles.includes(user.role))
      ) {
        res
          .status(403)
          .json({ message: "Forbidden: Insufficient permissions" });
        return;
      }

      next();
    });
  };
}
