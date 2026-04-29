import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import {prisma} from "../lib/prisma.js"

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:3000"

const getBackendUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8080}`

const getGoogleRedirectUri = () =>
    process.env.GOOGLE_OAUTH_REDIRECT_URL || `${getBackendUrl()}/api/v1/auth/google/callback`

const shouldUseSecureCookies = () => {
    if (process.env.COOKIE_SECURE) {
        return process.env.COOKIE_SECURE === "true"
    }

    return getFrontendUrl().startsWith("https://")
}

const getAuthCookieOptions = (maxAge) => ({
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    maxAge,
})

const getUserPayload = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    socials: user.socials || {},
})

const setAuthCookie = (res, userId, { rememberMe = false } = {}) => {
    const tokenExpiry = rememberMe ? "30d" : "7d"
    const cookieMaxAge = rememberMe
        ? 1000 * 60 * 60 * 24 * 30
        : 1000 * 60 * 60 * 24 * 7

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: tokenExpiry })

    res.cookie("jwt", token, getAuthCookieOptions(cookieMaxAge))
}

const redirectWithAuthError = (res, message) => {
    const redirectUrl = new URL(getFrontendUrl())
    redirectUrl.searchParams.set("authError", message)
    return res.redirect(redirectUrl.toString())
}

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

        setAuthCookie(res, newUser.id)


        res.status(200).json({
            success:true,
            message:"User created Successfully",
            user: getUserPayload(newUser)
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

        setAuthCookie(res, user.id, { rememberMe: Boolean(rememberMe) })

        res.status(200).json({
            success:true ,
            message:"Login Successfull",
            user: getUserPayload(user)
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
             secure: shouldUseSecureCookies(),
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

export const googleAuth = async (req, res) => {
    try {
        const { GOOGLE_CLIENT_ID } = process.env

        if (!GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: "Google OAuth is not configured",
            })
        }

        const state = crypto.randomBytes(24).toString("hex")
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: getGoogleRedirectUri(),
            response_type: "code",
            scope: "openid email profile",
            state,
            prompt: "select_account",
        })

        res.cookie("google_oauth_state", state, getAuthCookieOptions(1000 * 60 * 10))
        return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
    } catch (error) {
        console.error("Google auth redirect failed", error)
        return res.status(500).json({
            success: false,
            message: "Unable to start Google login",
        })
    }
}

export const googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query
        const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env

        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return redirectWithAuthError(res, "Google OAuth is not configured")
        }

        if (!code || !state || state !== req.cookies?.google_oauth_state) {
            return redirectWithAuthError(res, "Invalid Google login attempt")
        }

        res.clearCookie("google_oauth_state", {
            httpOnly: true,
            sameSite: "lax",
            secure: shouldUseSecureCookies(),
        })

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: String(code),
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: getGoogleRedirectUri(),
                grant_type: "authorization_code",
            }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.error("Google token exchange failed", tokenData)
            return redirectWithAuthError(res, "Google login failed")
        }

        const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        })

        const profile = await profileResponse.json()

        if (!profileResponse.ok || !profile.email || profile.email_verified === false) {
            console.error("Google profile fetch failed", profile)
            return redirectWithAuthError(res, "Google email could not be verified")
        }

        const email = String(profile.email).toLowerCase()
        const name = profile.name || email.split("@")[0]
        const avatar = profile.picture || null

        let user = await prisma.user.findUnique({ where: { email } })

        if (user) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: user.name || name,
                    avatar: user.avatar || avatar,
                },
            })
        } else {
            const randomPassword = crypto.randomBytes(32).toString("hex")
            const hashedPassword = await bcrypt.hash(randomPassword, 10)

            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    avatar,
                    password: hashedPassword,
                },
            })
        }

        setAuthCookie(res, user.id)
        return res.redirect(getFrontendUrl())
    } catch (error) {
        console.error("Google callback failed", error)
        return redirectWithAuthError(res, "Google login failed")
    }
}
