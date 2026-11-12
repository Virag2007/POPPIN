import { NextRequest } from "next/server";
import { SearchService } from "@/services/search.service";
import { successResponse, handleRouteError } from "@/lib/http/response";

export async function GET(request: NextRequest) {
  try {
    void request;
    const data = await SearchService.getExploreData();
    return successResponse(data, 200);
  } catch (error) {
    return handleRouteError(error);
  }
}

