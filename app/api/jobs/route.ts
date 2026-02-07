import { NextResponse } from "next/server";
import { getAllJobs, addJob } from "@/lib/googleSheets";

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newJob = await addJob(body);
    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error) {
    console.error("Error adding job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add job" },
      { status: 500 }
    );
  }
}
