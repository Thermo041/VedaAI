import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { connectMongo } from "@/lib/db/mongodb";
import { GroupModel } from "@/models/Group";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const groups = await GroupModel.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("[api/groups] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, subject, studentCount, description } = body;

    if (!name || !subject) {
      return NextResponse.json(
        { error: "Name and subject are required" },
        { status: 400 }
      );
    }

    await connectMongo();
    const group = await GroupModel.create({
      name,
      subject,
      studentCount: studentCount || 0,
      description: description || "",
      userId: session.userId,
      schoolId: session.schoolId,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("[api/groups] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    await connectMongo();
    const result = await GroupModel.deleteOne({ _id: id, userId: session.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/groups] DELETE failed:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
