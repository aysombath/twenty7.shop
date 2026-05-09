"use client"

import * as React from "react"

export function useSessionUser() {
  const [user, setUser] = React.useState<{
    username?: string
    name?: string
    email?: string
    role?: string
    type?: string
  } | null>(null)

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('atelier_user')
      if (raw) {
        setUser(JSON.parse(raw))
      }
    } catch {
      setUser(null)
    }
  }, [])

  return user
}

export function usePermissions() {
  const sessionUser = useSessionUser()
  const [permissions, setPermissions] = React.useState<string[]>([])
  const [isPermissionsLoading, setIsPermissionsLoading] = React.useState<boolean>(true)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    async function loadPermissions() {
      if (!sessionUser) return
      
      // Admin has all implicit powers
      if (sessionUser.type === 'admin') {
        setPermissions(['*'])
        setIsPermissionsLoading(false)
        return
      }
      
      try {
        const token = sessionStorage.getItem('atelier_access_token')
        const rolesRes = await fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } })
        const rolesData = await rolesRes.json()
        const userRole = rolesData.data?.find((r: any) => r.name === sessionUser.role)
        
        if (userRole) {
          const permRes = await fetch(`/api/permissions?role_id=${userRole.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
          const permData = await permRes.json()
          if (permData.success) {
            setPermissions(permData.data.map((p: any) => p.permission_key))
          }
        }
      } catch (error) {
        console.error("Could not load permissions from matrix", error)
      } finally {
        setIsPermissionsLoading(false)
      }
    }
    
    if (sessionUser !== null) {
      loadPermissions()
    }
  }, [sessionUser])

  const isAdmin = sessionUser?.type === 'admin' || !sessionUser

  const hasPermission = (requiredKeys?: string | string[]) => {
    if (isAdmin || permissions.includes('*')) return true
    if (!requiredKeys) return true
    
    if (Array.isArray(requiredKeys)) {
       return requiredKeys.some(k => permissions.includes(k))
    }
    return permissions.includes(requiredKeys)
  }

  return { permissions, isPermissionsLoading, isMounted, hasPermission, sessionUser, isAdmin }
}
