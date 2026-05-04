import { NextRequest } from "next/server";
import { ReviewController } from "@/layers/controllers/ReviewController";
import { handleError } from "@/exceptions/handlerError";

const reviewController = new ReviewController();

export async function GET(req: NextRequest) {
  try {
    return await reviewController.getByProduct(req);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await reviewController.create(req);
  } catch (error) {
    return handleError(error);
  }
}
