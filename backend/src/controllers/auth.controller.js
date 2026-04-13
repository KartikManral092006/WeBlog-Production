import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {prisma} from "../lib/prisma.js"


export const register = async (req, res) => {


   const {email, password, username}  = req.body
   try {
    if (!email || !password || !username) {
        return res.status(400).json({ error: "All fields are required" })
    }
        const existingUser = await prisma.user.findUnique({
            where :{
                email
            }
        })
        if(existingUser){
            return res.status(400).json({
                error: "User already exists"
            })
        }
        const hashedPassword = await bcrypt.hash(String(password),10)

        const newUser = await prisma.user.create({
            data : {
                email ,
                password: hashedPassword ,
                name :username
            }
        })

        const token = jwt.sign({
            id : newUser.id
        },process.env.JWT_SECRET,{expiresIn: '7d'})


        res.cookie("jwt" , token , {
            httpOnly : true ,
            sameSite : "lax" ,
             secure:process.env.NODE_ENV !== "development",
            maxAge:1000 * 60 * 60 * 24 * 7
        })


        res.status(200).json({
            success:true,
            message:"User created Successfully",
            user:{
                id:newUser.id,
                email:newUser.email,
                name:newUser.name,
                avatar:newUser.avatar,
                bio:newUser.bio,
                socials:newUser.socials || {}
            }
        })
   } catch (error) {
     console.error("Error in register controller", error);
        res.status(500).json({
            error:"Internal Server Error"
        })
   }
};

export const login = async (req, res) => {
    const {email, password, rememberMe} = req.body
    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            })
        }

        const user = await prisma.user.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res.status(400).json({
                message :"Invalid Credentials"
            })
        }

        const isPasswordValid = await bcrypt.compare(password ,user.password )
        if(!isPasswordValid){
            return res.status(400).json({
                message:"Invalid password"
            })
        }

                const shouldRemember = Boolean(rememberMe)
                const tokenExpiry = shouldRemember ? "30d" : "7d"
                const cookieMaxAge = shouldRemember
                    ? 1000 * 60 * 60 * 24 * 30
                    : 1000 * 60 * 60 * 24 * 7

                const token = jwt.sign({
                        id :user.id
                },process.env.JWT_SECRET,{expiresIn: tokenExpiry})




        res.cookie("jwt", token , {
            httpOnly:true,
            sameSite: "lax",
            secure:process.env.NODE_ENV !== "development",
            maxAge: cookieMaxAge
        })

        res.status(200).json({
            success:true ,
            message:"Login Successfull",
            user : {
                id :user.id ,
                email: user.email ,
                name : user.name,
                avatar:user.avatar,
                bio:user.bio,
                socials:user.socials || {}

            }
        })
    } catch (error) {
        console.log("Error in login Controller", error);
        return res.status(400).json({
            success:false,
            message: "Error logging in user "
        })
    }
};

export const logout = async (req, res) => {

   try {
     res.clearCookie("jwt" , {
           httpOnly:true,
             sameSite: "lax",
             secure:process.env.NODE_ENV !== "development",
         })
         return res.status(200).json({
            success:true ,
            message:"Logout Successfully"
         })
   } catch (error) {
        console.log("Error in Logout Controller" , error)
        return res.status(400).json({
            success:false ,
            message:"Error logging out user"
        })
   }
}
