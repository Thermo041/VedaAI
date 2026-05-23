import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/getSession";
import { connectMongo } from "@/lib/db/mongodb";
import { RubricModel } from "@/models/Rubric";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const rubrics = await RubricModel.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ rubrics });
  } catch (error) {
    console.error("[api/rubrics] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load rubrics" },
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
    const { title, subject, criteria, totalPoints } = body;

    if (!title || !subject || !criteria || !criteria.length) {
      return NextResponse.json(
        { error: "Title, subject, and criteria are required" },
        { status: 400 }
      );
    }

    const invalidCriterion = criteria.find((criterion: Record<string, unknown>) => {
      const name = String(criterion.name || "").trim();
      const excellent = String(criterion.excellent || "").trim();
      const good = String(criterion.good || "").trim();
      const satisfactory = String(criterion.satisfactory || "").trim();
      const needsImprovement = String(criterion.needsImprovement || "").trim();
      const points = Number(criterion.points || 0);
      return (
        !name ||
        !excellent ||
        !good ||
        !satisfactory ||
        !needsImprovement ||
        !Number.isFinite(points) ||
        points <= 0
      );
    });

    if (invalidCriterion) {
      return NextResponse.json(
        { error: "All criteria fields must be filled with valid points" },
        { status: 400 }
      );
    }

    await connectMongo();
    const rubric = await RubricModel.create({
      title,
      subject,
      criteria,
      totalPoints: Number(totalPoints),
      userId: session.userId,
      schoolId: session.schoolId,
    });

    return NextResponse.json({ rubric }, { status: 201 });
  } catch (error) {
    console.error("[api/rubrics] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create rubric" },
      { status: 500 }
    );
  }
}
