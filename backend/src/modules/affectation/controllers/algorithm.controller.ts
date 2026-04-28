import { Request, Response } from "express";
import * as algorithmService from "../services/algorithm.service";
import { parseIdParam, respondInvalidId, sendServiceError } from "./_helpers";

export const runAlgorithmHandler = async (req: Request, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (!id) return respondInvalidId(res, "campaignId");
  try {
    const result = await algorithmService.runAffectationAlgorithm(id);
    res.status(200).json({
      success: true,
      message: "Affectation algorithm completed successfully",
      data: result,
    });
  } catch (error) {
    sendServiceError(res, error, "Affectation algorithm failed");
  }
};
