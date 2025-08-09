import prisma from "$lib/server/prisma"
import { json } from "@sveltejs/kit"
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async ({ url }) => {
  try {
    const raw = Number(url.searchParams.get("limit") ?? 200)
    const safe = Number.isFinite(raw) ? raw : 200
    const limit = Math.min(Math.max(safe, 1), 1000)
    const cursor = url.searchParams.get("cursor")

    const baseSelect = {
      id: true,
      email: true,
      fullName: true,
      createdAt: true,
      updatedAt: true,
    }

    const query: any = {
      take: limit + 1,
      orderBy: { id: "asc" },
      select: baseSelect,
    }

    if (cursor) {
      query.skip = 1
      query.cursor = { id: cursor }
    }

    const rows = await prisma.user.findMany(query)
    const hasMore = rows.length > limit
    const nextCursor = hasMore ? rows[limit].id : null
    const initialRaw = hasMore ? rows.slice(0, limit) : rows

    // normalize field name ให้มีทั้ง fullName และ fullname
    const initial = initialRaw.map((u) => ({
      ...u,
      fullname: u.fullName,
    }))

    return json({
      initial,
      nextCursor,
      limit,
      hasMore,
      total: initial.length,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
