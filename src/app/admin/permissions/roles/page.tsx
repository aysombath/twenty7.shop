import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { RolePermissions } from "@/components/dashboard/role-permissions"
import { validateSession } from "@/lib/auth"

import { redirect } from "next/navigation"

export const metadata = {
  title: "Precision Atelier - Role Permissions",
  description: "Define boundaries and map capabilities to System Roles in Precision Atelier.",
}

export default async function RolePermissionsPage() {
  const isValid = await validateSession()

  if (!isValid) {
    redirect("/login")
  }

  return (
    <DashboardLayout>
      <div className="w-full h-full pb-10">
        <RolePermissions />
      </div>
    </DashboardLayout>
  )
}
