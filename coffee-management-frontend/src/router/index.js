import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'shift',
        name: 'ShiftManagement',
        component: () => import('@/views/admin/ShiftManagement.vue')
      },
      {
        path: 'tables',
        name: 'Tables',
        component: () => import('@/views/admin/Tables.vue')
      },
      {
        path: 'vip',
        name: 'VipSessions',
        component: () => import('@/views/admin/VipSessions.vue')
      },
      {
        path: 'clients',
        name: 'Clients',
        component: () => import('@/views/admin/Clients.vue')
      },
      {
        path: 'orders/:sessionId/:sessionType',
        name: 'Orders',
        component: () => import('@/views/admin/Orders.vue'),
        props: true
      }
    ]
  },
  {
    path: '/director',
    component: () => import('@/layouts/DirectorLayout.vue'),
    meta: { requiresAuth: true, role: 'director' },
    children: [
      {
        path: '',
        name: 'DirectorDashboard',
        component: () => import('@/views/director/Dashboard.vue')
      },
      {
        path: 'admins',
        name: 'AdminManagement',
        component: () => import('@/views/director/AdminManagement.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/director/Reports.vue')
      },
      {
        path: 'reports/clients',
        name: 'ClientsReport',
        component: () => import('@/views/director/ClientsReport.vue')
      },
      {
        path: 'reports/shifts',
        name: 'ShiftsReport',
        component: () => import('@/views/director/ShiftsReport.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Простая синхронная проверка маршрутов
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Проверяем токен и инициализируем пользователя если нужно
  const hasValidToken = authStore.hasValidToken()
  
  if (hasValidToken && !authStore.user) {
    // Есть валидный токен, но пользователь не загружен из localStorage
    authStore.initializeFromStorage()
  }
  
  console.log('Router:', to.path, 'Token:', hasValidToken, 'User:', !!authStore.user)
  
  // Гостевые маршруты (страница логина)
  if (to.meta.requiresGuest) {
    if (hasValidToken && authStore.user) {
      const redirectPath = authStore.user.role === 'admin' ? '/admin' : '/director'
      console.log('Redirecting authenticated user to:', redirectPath)
      return next(redirectPath)
    }
    return next()
  }
  
  // Защищенные маршруты
  if (to.meta.requiresAuth) {
    if (!hasValidToken) {
      console.log('No valid token - redirecting to login')
      return next('/login')
    }
    
    if (!authStore.user) {
      console.log('No user data - redirecting to login')
      return next('/login')
    }
    
    // Проверка роли
    if (to.meta.role && authStore.user.role !== to.meta.role) {
      const redirectPath = authStore.user.role === 'admin' ? '/admin' : '/director'
      console.log('Wrong role - redirecting to:', redirectPath)
      return next(redirectPath)
    }
  }
  
  next()
})

export default router