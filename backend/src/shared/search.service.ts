import prisma from "../config/database";
import logger from "../utils/logger";

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const paginate = <T,>(
  data: T[],
  skip: number,
  take: number,
  total: number
): PaginationResult<T> => {
  const page = Math.floor(skip / take) + 1;
  const pages = Math.ceil(total / take);

  return {
    data,
    pagination: {
      page,
      limit: take,
      total,
      pages,
    },
  };
};

export const getPaginationParams = (input?: PaginationInput) => {
  const page = Math.max(1, input?.page ?? 1);
  const limit = Math.min(100, Math.max(1, input?.limit ?? 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export interface SearchFilters {
  [key: string]: unknown;
}

export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

export const buildWhereClause = (filters: SearchFilters) => {
  const where: SearchFilters = {};

  Object.entries(filters)
    .filter(([_key, value]) => value !== undefined && value !== null && value !== "")
    .forEach(([key, value]) => {
      if (typeof value === "string" && value.includes("%")) {
        where[key] = { contains: value.replace(/%/g, ""), mode: "insensitive" };
      } else {
        where[key] = value;
      }
    });

  return where;
};

export const buildOrderBy = (options?: SortOptions) => {
  if (!options) {
    return undefined;
  }

  return {
    [options.field]: options.order,
  };
};

export const searchEntities = async <T,>(
  model: keyof typeof prisma,
  filters: SearchFilters,
  sort?: SortOptions,
  pagination?: PaginationInput
): Promise<PaginationResult<T>> => {
  const { limit, skip } = getPaginationParams(pagination);
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(sort);

  try {
    const data = await (prisma[model] as any).findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    const total = await (prisma[model] as any).count({ where });

    return paginate(data, skip, limit, total);
  } catch (error) {
    logger.error(`Error searching ${String(model)}:`, error);
    throw new Error(`Failed to search ${String(model)}`);
  }
};

export const countEntities = async (
  model: keyof typeof prisma,
  filters: SearchFilters
): Promise<number> => {
  const where = buildWhereClause(filters);

  try {
    return await (prisma[model] as any).count({ where });
  } catch (error) {
    logger.error(`Error counting ${String(model)}:`, error);
    throw new Error(`Failed to count ${String(model)}`);
  }
};
