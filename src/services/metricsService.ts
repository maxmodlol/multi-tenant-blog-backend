import { AppDataSource } from "../config/data-source";
import { Tenant } from "../models/Tenant";
import { TenantUser } from "../models/TenantUser";
import { Blog } from "../models/Blog";
import { getRepositoryForTenant } from "../utils/getRepositoryForTenant";
import { BlogStatus } from "../types/blogsType";

export interface AdminMetrics {
  totalTenants: number;
  totalUsers: number; // sum of TenantUser rows excluding ADMIN role
  totalBlogs: number;
  acceptedBlogs: number;
  pendingReapproval: number;
  readyToPublish: number;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const linkRepo = AppDataSource.getRepository(TenantUser);

  const tenants = await tenantRepo.find();
  const totalTenants = tenants.length;

  const totalUsers = await linkRepo.count();

  let totalBlogs = 0;
  let acceptedBlogs = 0;
  let pendingReapproval = 0;
  let readyToPublish = 0;

  for (const t of tenants) {
    const blogRepo = await getRepositoryForTenant(Blog, t.domain);
    const tenantTotal = await blogRepo.count();
    const tenantAccepted = await blogRepo.count({
      where: { status: BlogStatus.ACCEPTED },
    });
    const tenantPending = await blogRepo.count({
      where: { status: BlogStatus.PENDING_REAPPROVAL },
    });
    const tenantReady = await blogRepo.count({
      where: { status: BlogStatus.READY_TO_PUBLISH },
    });
    totalBlogs += tenantTotal;
    acceptedBlogs += tenantAccepted;
    pendingReapproval += tenantPending;
    readyToPublish += tenantReady;
  }

  return {
    totalTenants,
    totalUsers,
    totalBlogs,
    acceptedBlogs,
    pendingReapproval,
    readyToPublish,
  };
}

export interface PerTenantMetrics {
  tenant: string;
  users: number;
  blogsTotal: number;
  blogsAccepted: number;
  blogsPendingReapproval: number;
  blogsReadyToPublish: number;
}

export async function getPerTenantMetrics(): Promise<PerTenantMetrics[]> {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const linkRepo = AppDataSource.getRepository(TenantUser);
  const tenants = await tenantRepo.find();
  const results: PerTenantMetrics[] = [];
  for (const t of tenants) {
    const blogRepo = await getRepositoryForTenant(Blog, t.domain);
    const blogsTotal = await blogRepo.count();
    const blogsAccepted = await blogRepo.count({
      where: { status: BlogStatus.ACCEPTED },
    });
    const blogsPendingReapproval = await blogRepo.count({
      where: { status: BlogStatus.PENDING_REAPPROVAL },
    });
    const blogsReadyToPublish = await blogRepo.count({
      where: { status: BlogStatus.READY_TO_PUBLISH },
    });
    const users = await linkRepo.count({ where: { tenant: t.domain } });
    results.push({
      tenant: t.domain,
      users,
      blogsTotal,
      blogsAccepted,
      blogsPendingReapproval,
      blogsReadyToPublish,
    });
  }
  return results;
}

export interface TimeseriesPoint {
  day: string; // YYYY-MM-DD
  accepted: number;
  ready: number;
  pending: number;
  drafted: number;
  declined: number;
}

export async function getBlogStatusTimeseries(
  tenant: string, // specific slug or "all"
  days: number | "all" = 30,
): Promise<TimeseriesPoint[]> {
  const useAll = days === "all" || (typeof days === "number" && days <= 0);
  const since = useAll ? new Date(0) : new Date();
  if (!useAll) since.setDate(since.getDate() - ((days as number) - 1));

  const buckets: Record<string, TimeseriesPoint> = {};
  if (!useAll) {
    for (let i = 0; i < (days as number); i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = {
        day: key,
        accepted: 0,
        ready: 0,
        pending: 0,
        drafted: 0,
        declined: 0,
      };
    }
  }

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const slugs =
    tenant === "all"
      ? (await tenantRepo.find()).map((t) => t.domain)
      : [tenant];

  for (const slug of slugs) {
    const blogRepo = await getRepositoryForTenant(Blog, slug);
    const qb = blogRepo
      .createQueryBuilder("blog")
      .select("DATE_TRUNC('day', blog.createdAt)", "day")
      .addSelect("blog.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("blog.createdAt >= :since", { since })
      .groupBy("day, status");

    const rows = await qb.getRawMany<{
      day: string;
      status: BlogStatus;
      count: string;
    }>();
    for (const row of rows) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      if (!buckets[key]) {
        buckets[key] = {
          day: key,
          accepted: 0,
          ready: 0,
          pending: 0,
          drafted: 0,
          declined: 0,
        };
      }
      const inc = parseInt(row.count || "0", 10) || 0;
      switch (row.status) {
        case BlogStatus.ACCEPTED:
          buckets[key].accepted += inc;
          break;
        case BlogStatus.READY_TO_PUBLISH:
          buckets[key].ready += inc;
          break;
        case BlogStatus.PENDING_REAPPROVAL:
          buckets[key].pending += inc;
          break;
        case BlogStatus.DRAFTED:
          buckets[key].drafted += inc;
          break;
        case BlogStatus.DECLINED:
          buckets[key].declined += inc;
          break;
      }
    }
  }

  return Object.values(buckets).sort((a, b) => (a.day < b.day ? -1 : 1));
}
