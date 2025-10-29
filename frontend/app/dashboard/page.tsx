import { currentUser } from '@clerk/nextjs/server'
import { APIList } from "@/components/api-list"
import { UserButton } from '@clerk/nextjs'
import { getUserByClerkId, createUserWithClerkId } from '@/lib/api-client'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
        <p className="text-[#37322F]">Please sign in to view your dashboard</p>
      </div>
    )
  }

  let dbUser = null
  try {
    dbUser = await getUserByClerkId(user.id)
    
    if (!dbUser) {
      if (!user.emailAddresses || user.emailAddresses.length === 0) {
        throw new Error('No email address found for user')
      }
      
      const primaryEmail = user.emailAddresses[0].emailAddress
      
      try {
        dbUser = await createUserWithClerkId({
          clerk_id: user.id,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.username || 'User',
          email: primaryEmail,
        })
      } catch (createError) {
        dbUser = await getUserByClerkId(user.id)
        
        if (!dbUser) {
          throw new Error('Failed to create or find user')
        }
      }
    }
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center flex-col gap-4">
        <p className="text-[#37322F]">Error loading your profile. Please try refreshing the page.</p>
        <div className="text-xs text-gray-500 mb-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>
        <button 
          onClick={() => redirect('/dashboard')}
          className="px-4 py-2 bg-[#37322F] text-white rounded-md"
        >
          Refresh
        </button>
      </div>
    )
  }

  if (!dbUser) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] flex items-center justify-center">
        <p className="text-[#37322F]">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED]">
      <div className="bg-white border-b border-[#E8E3DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              <div>
                <h1 className="text-2xl font-bold text-[#37322F]">
                  Welcome back, {user.firstName || 'User'}!
                </h1>
              </div>
            </div>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-24 h-24"
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <APIList userId={dbUser.id} />
      </div>
    </div>
  )
}
