
import {prisma} from "../lib/prisma.js"
import { createNotification } from "../services/notificationService.js";


export const likePost = async (req, res) => {
       try {
         const { postid } = req.params;
           const userId = req.user.id;

         const post = await prisma.post.findUnique({
             where: { id: parseInt(postid) },
         });

         if(!post){
             return res.status(404).json({
                 success:false,
                 message:"Post not found",
             })
         }
         const existingLike = await prisma.like.findUnique({
             where:{
                 postid_userid: {
          postid: parseInt(postid),
          userid: userId,
        },
             }
         })
         if(existingLike){
             return res.status(400).json({
                 success:false,
                 message:"You have already liked this post",
             })
         }

         const newLike = await prisma.like.create({
             data:{
                 userid: userId,
                 postid: parseInt(postid),
             }
         })
         await createNotification({
            type: "like",
            senderid: userId,
            recieverid: post.userid, // post owner
            postid: post.id,
        });

        return res.status(201).json({
            success: true,
            data: newLike,
        });

       } catch (error) {
        console.error("likePost failed ",error);
        return res.status(500).json({
            success: false,
             message: "Internal server error"
        });
       }
}

export const unlikePost = async (req,res) => {
    try {
        const {postid} = req.params
        const userId = req.user.id;

        const existingLike = await prisma.like.findUnique({
            where: {
                postid_userid: {
                    postid: parseInt(postid),
                    userid: userId,
                }
            }
        });

        if (!existingLike) {
            return res.status(400).json({
                success: false,
                message: "You have not liked this post"
            });
        }

        await prisma.like.delete({
            where: {
                postid_userid: {
                    postid: parseInt(postid),
                    userid: userId,
                }
            }
        });

        res.status(200).json({
            success: true,
            message: "Post unliked successfully"
        });
    } catch (error) {
        console.error("unlikePost failed ", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
