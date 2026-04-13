import {prisma} from "../lib/prisma.js";
import { createNotification } from "../services/notificationService.js";

export const followUser = async(req,res)=>{
    try {
        const {userid} = req.params;
        const currentUserId = req.user.id;

        if(currentUserId === parseInt(userid)){
            return res.status(400).json({
                success:false,
                message:"You cannot follow yourself",
            })
        }
        const userToFollow = await prisma.user.findUnique({
            where:{
                id: parseInt(userid)
            }
        })
        if(!userToFollow){
            return res.status(404).json({
                success:false,
                message:"User not found",
            })
        }
        const existingFollow = await prisma.follow.findUnique({
            where:{
                followerid_followingid: {
                    followerid: currentUserId,
                    followingid: parseInt(userid),
                }
            }
        })
        if(existingFollow){
            return res.status(400).json({
                success:false,
                message:"You are already following this user",
            })
        }

        const newFollow = await prisma.follow.create({
            data:{
                followerid: currentUserId,
                followingid: parseInt(userid),
            }
        })
   await createNotification({
      type: "follow",
      senderid: currentUserId,
      recieverid: parseInt(userid),
    });

    res.status(201).json({
      success: true,
      data: newFollow,
    });
    } catch (error) {
        console.error("Follow user failed" ,error)
        return res.status(500).json({
            success:false ,
            message:"Internal Server Error"
        })
    }
}


export const unfollowUser = async(req,res)=>{
    const {userid} = req.params;
    const currentUserId = req.user.id;
    try {
        const existingFollow = await prisma.follow.findUnique({
            where:{
                followerid_followingid: {
                    followerid: currentUserId,
                    followingid: parseInt(userid),
                }
            }
        })
        if(!existingFollow){
            return res.status(400).json({
                success:false,
                message:"You are not following this user",
            })
        }

        await prisma.follow.delete({
            where:{
                id: existingFollow.id,
            }
        })

        res.status(200).json({
            success:true,
            message:"Unfollowed successfully",
        })

    } catch (error) {
        console.error("Unfollow user failed" ,error)
        return res.status(500).json({
            success:false ,
            message:"Internal Server Error"
        })
    }
}
