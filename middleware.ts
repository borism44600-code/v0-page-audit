import { auth } from "@/lib/auth"

export default auth

export const config = {
  matcher: [
    // Match all admin routes except login
    "/admin/:path*",
  ],
}
