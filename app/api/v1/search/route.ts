import { NextRequest } from "next/server";
import { SearchService } from "@/services/search.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = (searchParams.get("type") || "all") as "all" | "users" | "communities" | "posts";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 6;

    const results = await SearchService.search(q, type, limit);
    return successResponse(results, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

