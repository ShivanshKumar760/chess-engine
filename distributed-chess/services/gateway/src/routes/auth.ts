import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "shared/models/User";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: "username, email, and password are required" });
      return;
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: "Username must be 3-20 characters" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? "Username" : "Email";
      res.status(409).json({ error: `${field} already taken` });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString(), user.username);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user._id.toString(), user.username);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me (protected)
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        gamesPlayed: user.gamesPlayed,
      },
    });
  } catch (err: any) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
