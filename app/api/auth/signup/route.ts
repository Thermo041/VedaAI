import { NextRequest, NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/auth/validation";
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
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid signup data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectMongo();

    const existing = await UserModel.findOne({ email: parsed.data.email });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered. Please sign in." },
        { status: 409 }
      );
    }

    const school = await SchoolModel.create({
      name: parsed.data.schoolName,
      location: parsed.data.schoolLocation,
    });

    const user = await UserModel.create({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "teacher",
      schoolId: school._id,
    });

    const token = await signSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      schoolId: school._id.toString(),
    });

    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        school: { name: school.name, location: school.location },
      },
    });

    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[auth/signup]", error);
    return NextResponse.json(
      {
        error: "Signup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
