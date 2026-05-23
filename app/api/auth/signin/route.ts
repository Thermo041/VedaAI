import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { verifyPassword } from "@/lib/auth/password";
import { signinSchema } from "@/lib/auth/validation";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { SchoolModel } from "@/models/School";
import { UserModel } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid signin data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectMongo();

    const user = await UserModel.findOne({ email: parsed.data.email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const school = await SchoolModel.findById(user.schoolId);
    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolId: user.schoolId.toString(),
    });

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        school: school
          ? { name: school.name, location: school.location }
          : null,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[auth/signin]", error);
    return NextResponse.json(
      {
        error: "Sign in failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
