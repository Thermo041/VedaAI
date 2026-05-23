import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { getSession } from "@/lib/auth/getSession";
import { SchoolModel } from "@/models/School";
import { UserModel } from "@/models/User";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    await connectMongo();
    const user = await UserModel.findById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const school = await SchoolModel.findById(user.schoolId);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        school: school
          ? { name: school.name, location: school.location }
          : null,
      },
    });
  } catch (error) {
    console.error("[auth/me]", error);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}
