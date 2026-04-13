import { prisma } from "../lib/prisma.js";
import { createNotification } from "../services/notificationService.js";

export const createComment = async (req, res) => {
    try {
        const { postid, content } = req.body;

        if (!postid || !content) {
            return res.status(400).json({
                 success: false,
                  message: "Post ID and content are required"
             });
        }

        const post = await prisma.post.findUnique({
            where: { id: parseInt(postid) },
        });

        if (!post) {
            return res.status(404).json({
                success: false, message: "Post not found"
            });
        }
        const newComment = await prisma.comment.create({
            data: {
                content,
                postid: parseInt(postid),
                userid: req.user.id,
            },
        });

    await createNotification({
      type: "comment",
      senderid: req.user.id,
      recieverid: post.userid, // post owner
      postid: post.id,
      commentid: newComment.id,
    });


        res.status(201).json({
            success: true,
            data: newComment,
        });
    } catch (error) {
        console.error("createComment failed ",error);
        return res.status(500).json({
            success: false,
             message: "Internal server error"
        });

    }
}


export const getCommentsByPostId = async (req, res) => {
    try {
        const { postid } = req.params;

        const comment = await prisma.comment.findMany({
            where :{
                postid :parseInt(postid),
            }
        })
        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error("getCommentByPostId failes" , error)
        return res.status(500).json({
            success:false,
            message:"Internal Server error",

        })

    }
}



export const deleteComment = async (req, res) => {
    try {
        const { commentid } = req.params;

        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentid) },
        });
        if(!comment){
            return res.status(404).json({
                success: false,
                message: "Comment not found"
            });
        }
        if(comment.userid !==req.user.id){
            return res.status(403).json({
                success: false,
                message: "Forbidden - You can only delete your own comments"
            });
        }
        await prisma.comment.delete({
            where:{
                id :parseInt(commentid),
            }
        })
        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("deleteComment failed", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
}
