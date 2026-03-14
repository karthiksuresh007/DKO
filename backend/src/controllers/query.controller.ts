import type { Request, Response } from "express";
import { responsesRepository } from "../repositories/responses.repository.js";
import { queriesRepository } from "../repositories/queries.repository.js";
import { processTextQuery } from "../services/ai/text-query.service.js";
import { sendError, sendSuccess } from "../utils/http.js";

function isAllowedToView(requestUserId: string, requestRole: string, ownerId: string) {
  return requestRole === "officer" || requestRole === "admin" || requestUserId === ownerId;
}

export async function createQuery(request: Request, response: Response) {
  if (!request.authUser) {
    return sendError(response, 401, "UNAUTHORIZED", "Authentication required.");
  }

  const { type, content, audioUrl, imageUrl, description } = request.body as {
    type?: "text" | "voice" | "image";
    content?: string;
    audioUrl?: string;
    imageUrl?: string;
    description?: string;
  };

  if (!type || !["text", "voice", "image"].includes(type)) {
    return sendError(response, 400, "VALIDATION_ERROR", "Query type must be text, voice, or image.");
  }

  if (type === "text" && !content?.trim()) {
    return sendError(response, 400, "VALIDATION_ERROR", "Text query content is required.");
  }

  if (type === "voice" && !audioUrl?.trim()) {
    return sendError(response, 400, "VALIDATION_ERROR", "audioUrl is required for voice queries.");
  }

  if (type === "image" && !imageUrl?.trim()) {
    return sendError(response, 400, "VALIDATION_ERROR", "imageUrl is required for image queries.");
  }

  const query = await queriesRepository.create({
    userId: request.authUser.uid,
    type,
    content: content?.trim(),
    audioUrl,
    imageUrl,
    description: description?.trim(),
    status: "pending"
  });

  if (type === "text" && content) {
    const textResult = await processTextQuery(content.trim());
    const savedResponse = await responsesRepository.createAiResponse({
      queryId: query.queryId,
      content: textResult.content,
      generatedBy: textResult.modelUsed,
      confidence: textResult.confidence,
      audioUrl: null
    });

    const updatedQuery = await queriesRepository.markAnswered(query.queryId, {
      latestResponse: textResult.content,
      confidence: textResult.confidence,
      aiResponseAudioUrl: null
    });

    return sendSuccess(
      response,
      {
        query: updatedQuery,
        response: savedResponse
      },
      201
    );
  }

  const acknowledgement = await responsesRepository.createPendingAcknowledgement(query.queryId);

  return sendSuccess(
    response,
    {
      query,
      response: acknowledgement
    },
    201
  );
}

export async function getQueryById(request: Request, response: Response) {
  if (!request.authUser) {
    return sendError(response, 401, "UNAUTHORIZED", "Authentication required.");
  }

  const queryId = request.params.id;
  if (typeof queryId !== "string") {
    return sendError(response, 400, "VALIDATION_ERROR", "Query ID is required.");
  }

  const query = await queriesRepository.findById(queryId);
  if (!query) {
    return sendError(response, 404, "NOT_FOUND", "Query not found.");
  }

  if (!isAllowedToView(request.authUser.uid, request.authUser.role, query.userId)) {
    return sendError(response, 403, "FORBIDDEN", "You do not have access to this query.");
  }

  const responses = await responsesRepository.listByQueryId(query.queryId);
  return sendSuccess(response, { query, responses });
}

export async function listQueriesByUser(request: Request, response: Response) {
  if (!request.authUser) {
    return sendError(response, 401, "UNAUTHORIZED", "Authentication required.");
  }

  const userId = request.params.userId;
  if (typeof userId !== "string") {
    return sendError(response, 400, "VALIDATION_ERROR", "User ID is required.");
  }

  if (!isAllowedToView(request.authUser.uid, request.authUser.role, userId)) {
    return sendError(response, 403, "FORBIDDEN", "You do not have access to these queries.");
  }

  const limit = Math.min(Number(request.query.limit ?? 20) || 20, 50);
  const cursor = typeof request.query.cursor === "string" ? request.query.cursor : undefined;
  const result = await queriesRepository.listByUserId(userId, limit, cursor);

  return sendSuccess(response, result);
}
