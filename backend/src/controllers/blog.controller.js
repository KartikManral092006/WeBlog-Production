
import { prisma } from "../lib/prisma.js";
import { detectBlogCategory, EXPLORE_TOPICS } from "../services/blogCategorizationService.js";
import { notifyFollowersOfNewPost } from "../services/notificationService.js";

function isLivePublicPublishedPost({ status, visibility, publishAt }) {
    return (
        status === "PUBLISHED" &&
        visibility === "PUBLIC" &&
        new Date(publishAt).getTime() <= Date.now()
    );
}

function normalizeTags(tags) {
    if (!Array.isArray(tags)) {
        return [];
    }

    const cleaned = tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
        .slice(0, 12);

    return [...new Set(cleaned)];
}

function normalizeVisibility(visibility, fallback = "PUBLIC") {
    if (visibility === undefined || visibility === null || visibility === "") {
        return fallback;
    }

    const normalized = String(visibility).trim().toUpperCase();
    if (normalized === "PUBLIC" || normalized === "PRIVATE") {
        return normalized;
    }

    return null;
}

function normalizePublishAt(value, fallback = new Date()) {
    if (value === undefined) {
        return fallback;
    }

    if (value === null || value === "") {
        return new Date();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function normalizeStatus(status, fallback = "PUBLISHED") {
    if (status === undefined || status === null || status === "") {
        return fallback;
    }

    const normalized = String(status).trim().toUpperCase();
    if (normalized === "DRAFT" || normalized === "PUBLISHED") {
        return normalized;
    }

    return null;
}

const TRUST_FOLLOWER_SELECT = {
    id: true,
    name: true,
    email: true,
    avatar: true,
};

const USER_WITH_TRUST_SELECT = {
    id: true,
    name: true,
    email: true,
    avatar: true,
    following: {
        orderBy: {
            createdAt: "desc",
        },
        take: 4,
        select: {
            follower: {
                select: TRUST_FOLLOWER_SELECT,
            },
        },
    },
    _count: {
        select: {
            following: true,
        },
    },
};

function normalizePostUserTrust(post) {
    if (!post?.user) {
        return post;
    }

    const { _count, postLikes = [], bookmarkItems = [], ...restPost } = post;
    const { following = [], _count: userCount, ...user } = post.user;
    const trustFollowers = following
        .map((entry) => entry?.follower)
        .filter(Boolean);

    return {
        ...restPost,
        user: {
            ...user,
            trustFollowers,
            followerCount: userCount?.following ?? trustFollowers.length,
        },
        stats: {
            likes: _count?.postLikes ?? 0,
            comments: _count?.postComments ?? 0,
            saves: _count?.bookmarkItems ?? 0,
        },
        likedByMe: postLikes.length > 0,
        savedByMe: bookmarkItems.length > 0,
    };
}

function buildPostInclude(currentUserId) {
    const include = {
        user: {
            select: USER_WITH_TRUST_SELECT,
        },
        _count: {
            select: {
                postLikes: true,
                postComments: true,
                bookmarkItems: true,
            },
        },
    };

    if (currentUserId) {
        include.postLikes = {
            where: {
                userid: currentUserId,
            },
            select: {
                id: true,
            },
            take: 1,
        };
        include.bookmarkItems = {
            where: {
                userid: currentUserId,
            },
            select: {
                id: true,
            },
            take: 1,
        };
    }

    return include;
}

function getPostPopularityScore(post) {
    const likes = post?._count?.postLikes ?? 0;
    const comments = post?._count?.postComments ?? 0;
    const saves = post?._count?.bookmarkItems ?? 0;

    // Engagement-weighted score for stable "popular" ranking.
    return likes * 3 + comments * 2 + saves * 2;
}

function getPostSortTime(post) {
    const publishMs = new Date(post?.publishAt).getTime();
    if (!Number.isNaN(publishMs)) {
        return publishMs;
    }
    return new Date(post?.createdAt).getTime() || 0;
}

export const createBlog  = async (req,res)=>{
    try {
        const { title, content, previewImage, tags, visibility, publishAt, status } = req.body;
        const userId = req.user.id;
        const normalizedStatus = normalizeStatus(status, "PUBLISHED");
        const isDraft = normalizedStatus === "DRAFT";
        const normalizedTitle = String(title || "").trim();
        const normalizedContent = String(content || "").trim();
        const finalTitle = normalizedTitle || (isDraft ? `Untitled Draft ${Date.now()}` : "");
        const finalContent = normalizedContent;
        const category = detectBlogCategory(finalTitle, finalContent);
        const normalizedTags = normalizeTags(tags);
        const normalizedVisibility = normalizeVisibility(visibility, "PUBLIC");
        const normalizedPublishAt = normalizePublishAt(publishAt, new Date());

        if (!isDraft && (!normalizedTitle || !normalizedContent)) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }

        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message: "Status must be DRAFT or PUBLISHED",
            });
        }

        if (!normalizedVisibility) {
            return res.status(400).json({
                success: false,
                message: "Visibility must be PUBLIC or PRIVATE",
            });
        }

        if (!normalizedPublishAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid publish date",
            });
        }

        const existingSameTitle = normalizedTitle
            ? await prisma.post.findFirst({
                where: {
                    userid: userId,
                    title: normalizedTitle,
                },
            })
            : null;

        if (existingSameTitle && !isDraft && existingSameTitle.status === "DRAFT") {
            const updatedFromDraft = await prisma.post.update({
                where: { id: existingSameTitle.id },
                data: {
                    content: finalContent,
                    previewImage:
                        typeof previewImage === "string" && previewImage.trim()
                            ? previewImage.trim()
                            : null,
                    category,
                    tags: normalizedTags,
                    status: normalizedStatus,
                    visibility: normalizedVisibility,
                    publishAt: normalizedPublishAt,
                },
            });

            if (isLivePublicPublishedPost(updatedFromDraft)) {
                await notifyFollowersOfNewPost({
                    senderid: userId,
                    postid: updatedFromDraft.id,
                });
            }

            return res.status(200).json({
                success: true,
                data: updatedFromDraft,
            });
        }

        const newBlog  = await prisma.post.create({
            data:{
                title: finalTitle,
                content: finalContent,
                previewImage:
                    typeof previewImage === "string" && previewImage.trim()
                        ? previewImage.trim()
                        : null,
                category,
                tags: normalizedTags,
                status: normalizedStatus,
                visibility: normalizedVisibility,
                publishAt: normalizedPublishAt,
                userid:userId,
            }
        });

        if (isLivePublicPublishedPost(newBlog)) {
            await notifyFollowersOfNewPost({
                senderid: userId,
                postid: newBlog.id,
            });
        }

        res.status(201).json({
            success:true ,
            data :newBlog,
        })

    } catch (error) {
        console.error("create blog fails", error);
          if (error.code === "P2002") {
            return res.status(400).json({
            success: false,
            message: "A blog with this title already exists",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
export const getAllBlogs  = async (req,res)=>{
   try {
    // Pagination logic
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const visibilityFilter = req.user?.id
        ? {
            OR: [
                { visibility: "PUBLIC" },
                { userid: req.user.id },
            ],
        }
        : {
            visibility: "PUBLIC",
        };

    const publishFilter = {
        publishAt: { lte: new Date() },
    };

    const statusFilter = {
        status: "PUBLISHED",
    };

    const blogs = await prisma.post.findMany({
        where: {
            AND: [visibilityFilter, publishFilter, statusFilter],
        },
        skip,
        take: limit,
        orderBy:{
            createdAt:"desc"
        },
        include: buildPostInclude(req.user?.id),
    })
    res.status(200).json({
        success:true,
        page,
        data:blogs.map(normalizePostUserTrust),
    })
   } catch (error) {
    console.log("get all blogs fails");
    res.status(500).json({
        success:false,
        message:"Internal Server Error",
    })
   }

}

export const getExploreTopics = async (req, res) => {
    try {
        const grouped = await prisma.post.groupBy({
            by: ["category"],
            where: {
                visibility: "PUBLIC",
                status: "PUBLISHED",
                publishAt: {
                    lte: new Date(),
                },
            },
            _count: {
                category: true,
            },
        });

        const map = new Map(grouped.map((row) => [row.category, row._count.category]));
        const data = EXPLORE_TOPICS.map((topic) => ({
            name: topic,
            count: map.get(topic) || 0,
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("getExploreTopics failed", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

async function getPreferredTopicWeights(userId) {
    const [history, bookmarks] = await Promise.all([
        prisma.readHistory.findMany({
            where: { userid: userId },
            include: { post: { select: { category: true } } },
        }),
        prisma.bookmarkItem.findMany({
            where: { userid: userId },
            include: { post: { select: { category: true } } },
        }),
    ]);

    const weights = {};

    for (const entry of history) {
        const cat = entry.post?.category || "World";
        weights[cat] = (weights[cat] || 0) + 2;
    }

    for (const entry of bookmarks) {
        const cat = entry.post?.category || "World";
        weights[cat] = (weights[cat] || 0) + 3;
    }

    return weights;
}

export const searchExploreBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const query = (req.query.query || "").toString().trim();
        const topic = (req.query.topic || "").toString().trim();
        const sort = (req.query.sort || "latest").toString().trim().toLowerCase();

        const baseConditions = [
            req.user?.id
                ? {
                    OR: [
                        { visibility: "PUBLIC" },
                        { userid: req.user.id },
                    ],
                }
                : { visibility: "PUBLIC" },
            { publishAt: { lte: new Date() } },
            { status: "PUBLISHED" },
            ...(topic && topic !== "All"
                ? [
                    {
                        category: topic,
                    },
                ]
                : []),
        ];

        const baseWhere = { AND: baseConditions };

        let blogs = [];

        if (query) {
            const terms = query
                .split(/[\s,]+/)
                .map((term) => term.trim().toLowerCase())
                .filter((term) => term.length >= 2);

            if (terms.length === 0) {
                return res.status(200).json({
                    success: true,
                    page,
                    data: [],
                });
            }

            const uniqueTerms = [...new Set(terms)];
            const termConditions = uniqueTerms.map((term) => ({
                OR: [
                    { title: { contains: term, mode: "insensitive" } },
                    { content: { contains: term, mode: "insensitive" } },
                    { category: { contains: term, mode: "insensitive" } },
                    { tags: { has: term } },
                ],
            }));

            const searchWhere = {
                AND: [...baseConditions, ...termConditions],
            };

            if (sort === "popular") {
                const candidates = await prisma.post.findMany({
                    where: searchWhere,
                    include: buildPostInclude(req.user?.id),
                });

                const sortedByPopularity = candidates.sort((a, b) => {
                    const scoreA = getPostPopularityScore(a);
                    const scoreB = getPostPopularityScore(b);

                    if (scoreB !== scoreA) {
                        return scoreB - scoreA;
                    }

                    return getPostSortTime(b) - getPostSortTime(a);
                });

                blogs = sortedByPopularity.slice(skip, skip + limit);
            } else {
                blogs = await prisma.post.findMany({
                    where: searchWhere,
                    include: buildPostInclude(req.user?.id),
                    orderBy: {
                        publishAt: sort === "oldest" ? "asc" : "desc",
                    },
                    skip,
                    take: limit,
                });
            }
        } else {
            if (sort === "popular") {
                const candidates = await prisma.post.findMany({
                    where: baseWhere,
                    include: buildPostInclude(req.user?.id),
                });

                const sortedByPopularity = candidates.sort((a, b) => {
                    const scoreA = getPostPopularityScore(a);
                    const scoreB = getPostPopularityScore(b);

                    if (scoreB !== scoreA) {
                        return scoreB - scoreA;
                    }

                    return getPostSortTime(b) - getPostSortTime(a);
                });

                blogs = sortedByPopularity.slice(skip, skip + limit);
            } else {
            blogs = await prisma.post.findMany({
                where: baseWhere,
                include: buildPostInclude(req.user?.id),
                orderBy: {
                    publishAt: sort === "oldest" ? "asc" : "desc",
                },
                skip,
                take: limit,
            });
            }
        }

        const normalizedBlogs = blogs.map(normalizePostUserTrust);

        return res.status(200).json({
            success: true,
            page,
            data: normalizedBlogs,
        });
    } catch (error) {
        console.error("searchExploreBlogs failed", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getForYouBlogs = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(200).json({
                success: true,
                page: 1,
                data: [],
            });
        }

        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const query = (req.query.query || "").toString().trim().toLowerCase();

        const [likes, comments, bookmarks, follows] = await Promise.all([
            prisma.like.findMany({
                where: { userid: userId },
                select: { postid: true },
            }),
            prisma.comment.findMany({
                where: { userid: userId },
                select: { postid: true },
            }),
            prisma.bookmarkItem.findMany({
                where: { userid: userId },
                select: { postid: true },
            }),
            prisma.follow.findMany({
                where: { followerid: userId },
                select: { followingid: true },
            }),
        ]);

        const interactedPostIds = new Set([
            ...likes.map((entry) => entry.postid),
            ...comments.map((entry) => entry.postid),
            ...bookmarks.map((entry) => entry.postid),
        ]);

        const interactedPostIdList = [...interactedPostIds];
        const interactedAuthorsFromPosts = interactedPostIdList.length > 0
            ? await prisma.post.findMany({
                where: {
                    id: { in: interactedPostIdList },
                },
                select: {
                    userid: true,
                },
            })
            : [];

        const interactedAuthorIds = new Set([
            ...follows.map((entry) => entry.followingid),
            ...interactedAuthorsFromPosts.map((entry) => entry.userid),
        ]);

        if (interactedPostIds.size === 0 && interactedAuthorIds.size === 0) {
            return res.status(200).json({
                success: true,
                page,
                data: [],
            });
        }

        const forYouCandidates = await prisma.post.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { visibility: "PUBLIC" },
                            { userid: userId },
                        ],
                    },
                    {
                        publishAt: { lte: new Date() },
                    },
                    {
                        status: "PUBLISHED",
                    },
                    {
                        OR: [
                            ...(interactedPostIds.size > 0
                                ? [{ id: { in: [...interactedPostIds] } }]
                                : []),
                            ...(interactedAuthorIds.size > 0
                                ? [{ userid: { in: [...interactedAuthorIds] } }]
                                : []),
                        ],
                    },
                ],
            },
            include: buildPostInclude(userId),
            orderBy: {
                createdAt: "desc",
            },
        });

        const filteredCandidates = query
            ? forYouCandidates.filter((post) => {
                const haystack = `${post.title} ${(post.tags || []).join(" ")} ${post.category}`.toLowerCase();
                return haystack.includes(query);
            })
            : forYouCandidates;

        const rankedCandidates = filteredCandidates
            .map((post) => {
                const reasons = [];
                if (interactedPostIds.has(post.id)) {
                    reasons.push("You interacted with this post");
                }
                if (interactedAuthorIds.has(post.userid)) {
                    reasons.push("From a writer you engage with");
                }

                return {
                    post,
                    reasons,
                    score:
                        (interactedPostIds.has(post.id) ? 4 : 0) +
                        (interactedAuthorIds.has(post.userid) ? 2 : 0),
                };
            })
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime();
            });

        const paged = rankedCandidates.slice(skip, skip + limit);

        return res.status(200).json({
            success: true,
            page,
            data: paged.map((entry) => ({
                ...normalizePostUserTrust(entry.post),
                recommendationReasons:
                    entry.reasons.length > 0 ? entry.reasons : ["Picked for your interests"],
            })),
        });
    } catch (error) {
        console.error("getForYouBlogs failed", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getMyScheduledBlogs = async (req, res) => {
    try {
        const userId = req.user.id;

        const blogs = await prisma.post.findMany({
            where: {
                userid: userId,
                status: "PUBLISHED",
                publishAt: {
                    gt: new Date(),
                },
            },
            include: buildPostInclude(req.user?.id),
            orderBy: {
                publishAt: "asc",
            },
        });

        return res.status(200).json({
            success: true,
            data: blogs.map(normalizePostUserTrust),
        });
    } catch (error) {
        console.error("getMyScheduledBlogs failed", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getMyDraftBlogs = async (req, res) => {
    try {
        const userId = req.user.id;

        const blogs = await prisma.post.findMany({
            where: {
                userid: userId,
                status: "DRAFT",
            },
            include: buildPostInclude(req.user?.id),
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            data: blogs.map(normalizePostUserTrust),
        });
    } catch (error) {
        console.error("getMyDraftBlogs failed", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const getBlogById  = async (req,res)=>{
        try {
            const { id } = req.params;
            const blog = await prisma.post.findUnique({
                where: {
                    id: parseInt(id),
                },
                include:{
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                            bio: true,
                            socials: true,
                            following: {
                                orderBy: {
                                    createdAt: "desc",
                                },
                                take: 4,
                                include: {
                                    follower: {
                                        select: TRUST_FOLLOWER_SELECT,
                                    },
                                },
                            },
                            _count: {
                                select: {
                                    following: true,
                                },
                            },
                        },
                    },
                }
            });
            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: "Blog not found",
                });
            }

            if (blog.visibility === "PRIVATE" && blog.userid !== req.user?.id) {
                return res.status(403).json({
                    success: false,
                    message: "This post is private",
                });
            }

            if (blog.status === "DRAFT" && blog.userid !== req.user?.id) {
                return res.status(403).json({
                    success: false,
                    message: "This post is a draft",
                });
            }

            if (blog.publishAt > new Date() && blog.userid !== req.user?.id) {
                return res.status(403).json({
                    success: false,
                    message: "This post is scheduled for future publishing",
                });
            }

            const trustFollowers = (blog.user?.following || [])
                .map((entry) => entry.follower)
                .filter(Boolean);

            const normalizedBlog = {
                ...blog,
                user: {
                    id: blog.user.id,
                    name: blog.user.name,
                    email: blog.user.email,
                    avatar: blog.user.avatar,
                    bio: blog.user.bio,
                    socials: blog.user.socials,
                    trustFollowers,
                    followerCount: blog.user._count?.following ?? trustFollowers.length,
                },
            };

            res.status(200).json({
                success: true,
                data: normalizedBlog,
            });
        } catch (error) {
            console.log("get blog by id fails");
            res.status(500).json({
                success:false,
                message:"Internal Server Error",
            })
        }
}
export const updateBlog  = async (req,res)=>{
    try {
        const { id } = req.params;
        const { title, content, previewImage, tags, visibility, publishAt, status } = req.body;
        const userId = req.user.id;

        const blog = await prisma.post.findUnique({
            where: {
                id: parseInt(id),
            },
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        if (blog.userid !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this blog",
            });
        }

        const updatedTitle = title ?? blog.title;
        const updatedContent = content ?? blog.content;
        const category = detectBlogCategory(updatedTitle, updatedContent);
        const normalizedStatus = normalizeStatus(status, blog.status);
        const normalizedVisibility = normalizeVisibility(visibility, blog.visibility);
        const normalizedPublishAt = normalizePublishAt(publishAt, blog.publishAt);

        if (!normalizedStatus) {
            return res.status(400).json({
                success: false,
                message: "Status must be DRAFT or PUBLISHED",
            });
        }

        if (!normalizedVisibility) {
            return res.status(400).json({
                success: false,
                message: "Visibility must be PUBLIC or PRIVATE",
            });
        }

        if (!normalizedPublishAt) {
            return res.status(400).json({
                success: false,
                message: "Invalid publish date",
            });
        }

        const updatedBlog = await prisma.post.update({
            where: {
                id: parseInt(id),
            },
            data: {
                title,
                content,
                category,
                tags: tags === undefined ? blog.tags : normalizeTags(tags),
                status: normalizedStatus,
                visibility: normalizedVisibility,
                publishAt: normalizedPublishAt,
                previewImage:
                    previewImage === undefined
                        ? blog.previewImage
                        : typeof previewImage === "string" && previewImage.trim()
                            ? previewImage.trim()
                            : null,
            },
        });

        const wasLivePublicPublished = isLivePublicPublishedPost(blog);
        const isNowLivePublicPublished = isLivePublicPublishedPost(updatedBlog);

        if (!wasLivePublicPublished && isNowLivePublicPublished) {
            await notifyFollowersOfNewPost({
                senderid: userId,
                postid: updatedBlog.id,
            });
        }

        res.status(200).json({
            success: true,
            data: updatedBlog,
        });

    } catch (error) {
        console.error("update blog fails", error);
            if (error.code === "P2002") {
            return res.status(400).json({
            success: false,
            message: "A blog with this title already exists",
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
export const deleteBlog = async (req,res)=>{
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const blog = await prisma.post.findUnique({
            where: {
                id: parseInt(id),
            },
        });

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }
        if (blog.userid !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this blog",
            });
        }

        await prisma.post.delete({
            where: {
                id: parseInt(id),
            },
        });

        res.status(200).json({
            success: true,
            message: "Blog deleted successfully",
        });
    } catch (error) {
        console.error("delete blog fails");
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}
