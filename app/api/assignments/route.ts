import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { createAssignment, listAssignments } from "@/lib/server/assignments";
import { createAssignmentSchema } from "@/lib/validation";
import { connectMongo } from "@/lib/db/mongodb";
import { AssignmentModel } from "@/models/Assignment";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await listAssignments(session.userId);
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("[api/assignments] GET failed:", error);
    return NextResponse.json(
      {
        error: "Failed to load assignments",
        message: error instanceof Error ? error.message : "Unknown error",
      },
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
    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid assignment payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const assignment = await createAssignment(
      session.userId,
      session.schoolId,
      parsed.data
    );

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("[api/assignments] POST failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create assignment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
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
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    await connectMongo();
    const result = await AssignmentModel.deleteOne({ _id: id, userId: session.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/assignments] DELETE failed:", error);
    return NextResponse.json(
      {
        error: "Failed to delete assignment",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
