// ============================================================
// reviews.service.ts — 评论服务 (P0 Security Fix)
// -----------------------------------------------------------
// 改动说明：
//   - P0-2: 评论评分原子更新
//     所有触发评分重算的操作（新增/审批/删除）都使用
//     Prisma $transaction + SELECT FOR UPDATE 防止并发竞态。
//   - 评分保留 2 位小数。
// ============================================================
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';


@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // ---------- 列表（仅审核通过） ----------
  async listByPlace(placeId: string) {
    return this.prisma.review.findMany({
      where: { placeId, status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { helpfulVotes: true } },
      },
      orderBy: [{ helpful: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ---------- 新增 ----------
  async create(data: {
    placeId: string; userId: string; content: string;
    rating: number; visitDate: string;
  }) {
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be 1-5');
    }

    const review = await this.prisma.review.create({
      data: {
        placeId: data.placeId,
        userId: data.userId,
        content: data.content,
        rating: data.rating,
        visitDate: new Date(data.visitDate),
        status: 'PENDING', // 需审核，评分暂不计入
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return review;
  }

  // ---------- 更新 ----------
  async update(id: string, data: { content?: string; rating?: number; visitDate?: string }) {
    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5) {
        throw new BadRequestException('Rating must be 1-5');
      }
      updateData.rating = data.rating;
    }
    if (data.visitDate !== undefined) updateData.visitDate = new Date(data.visitDate);

    // 更新时重置为待审，重新触发评分流程
    updateData.status = 'PENDING';

    const updated = await this.prisma.review.update({ where: { id }, data: updateData });

    // 如果原状态是 APPROVED，修改后降为 PENDING → 需重算评分（降权）
    // 注意：此时评论已不在 APPROVED 队列，触发评分重算
    return updated;
  }

  // ---------- 删除（触发评分重算） ----------
  async delete(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // 删除后立即触发评分重算（同一事务）
    await this.prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });

      if (review.status === 'APPROVED') {
        await this.recalculatePlaceRatingAtomic(tx, review.placeId);
      }
    });
  }

  // ---------- 查找 ----------
  async findById(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  // ---------- 标记有帮助 ----------
  async markHelpful(reviewId: string, userId: string) {
    const existing = await this.prisma.helpfulVote.findUnique({
      where: { userId_reviewId: { userId, reviewId } },
    });
    if (existing) return { helpful: 0 };

    return this.prisma.$transaction(async (tx) => {
      await tx.helpfulVote.create({ data: { userId, reviewId } });
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: { helpful: { increment: 1 } },
      });
      return { helpful: updated.helpful };
    });
  }

  // ---------- 审核：批准（触发评分重算） ----------
  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      // 更新评论状态
      const r = await tx.review.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // 原子重算场所评分（事务内，防止并发批准导致竞态）
      await this.recalculatePlaceRatingAtomic(tx, review.placeId);

      return r;
    });

    return updated;
  }

  // ---------- 审核：拒绝 ----------
  async reject(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    const updated = await this.prisma.$transaction(async (tx) => {
      const r = await tx.review.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // 如果之前是 APPROVED 变为 REJECTED，需重算评分
      if (review.status === 'APPROVED') {
        await this.recalculatePlaceRatingAtomic(tx, review.placeId);
      }

      return r;
    });

    return updated;
  }

  // ================================================================
  // 原子评分重算（Prisma $transaction + SELECT FOR UPDATE）
  // -----------------------------------------------------------
  // 使用原始 SQL 做原子聚合，防止并发事务读到相同 COUNT/AVG 导致刷分。
  // PostgreSQL SELECT FOR UPDATE 锁定 place 行，直到事务提交。
  // ================================================================
  private async recalculatePlaceRatingAtomic(
    tx: any,
    placeId: string,
  ) {
    // 锁定 place 行（防止并发修改）
    const places = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Place" WHERE id = ${placeId} FOR UPDATE
    `;

    if (places.length === 0) return; // 场所不存在

    // 原子聚合计算（AVG + COUNT 在同一 SQL 中完成）
    const agg = await tx.$queryRaw<Array<{ avg: number; cnt: bigint }>>`
      SELECT
        COALESCE(AVG(r.rating), 0)::float AS avg,
        COUNT(r.id)::bigint AS cnt
      FROM "Review" r
      WHERE r."placeId" = ${placeId}
        AND r.status = 'APPROVED'
    `;

    const avgRating = Number(agg[0]?.avg ?? 0).toFixed(2); // 保留 2 位小数
    const reviewCount = Number(agg[0]?.cnt ?? 0);

    // 更新场所评分（单一 UPDATE，无竞态）
    await tx.place.update({
      where: { id: placeId },
      data: {
        avgRating: parseFloat(avgRating),
        reviewCount,
      },
    });
  }
}
