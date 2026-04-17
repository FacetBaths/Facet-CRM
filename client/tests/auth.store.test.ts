import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore, type User } from '../src/stores/auth'
import axios from 'axios'

vi.mock('axios')
vi.mock('@/boot/socket', () => ({\n  connectSocket: vi.fn(),\n  disconnectSocket: vi.fn(),\n  joinUserRoom: vi.fn()\n}))\n\ntype UserRole = 'admin' | 'bdc' | 'sales' | 'warehouse' | 'production' | 'contractor' | 'manager' | 'installer' | 'design_consultant';\n\ninterface User {\n  _id: string;\n  email: string;\n  firstName: string;\n  lastName: string;\n  roles: UserRole[];\n  avatar?: string;\n  phone?: string;\n  phoneExtension?: string;\n  bio?: string;\n  employeeId?: string;\n  employmentType?: string;\n  department?: string;\n  marketId?: string | { _id: string; name?: string; code?: string };\n  teamIds?: string[];\n  commissionTier?: number;\n  status?: string;\n  preferences?: {\n    theme?: 'light' | 'dark' | 'auto';\n    timezone?: string;\n    language?: string;\n    dateFormat?: string;\n    timeFormat?: '12h' | '24h';\n    notifications?: {\n      email?: boolean;\n      sms?: boolean;\n      push?: boolean;\n      desktop?: boolean;\n    };\n  };\n}

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useAuthStore()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initializes with no user and no token', () => {
    expect(store.user).toBeNull()
    expect(store.token).toBe('')
    expect(store.isAuthenticated).toBe(false)
  })

  it('logs in successfully', async () => {
    const mockUser = { _id: '123', email: 'test@example.com', roles: ['admin'] }
    const mockToken: string = 'fake.token'
    (axios.post as Mock).mockResolvedValue({ data: { user: mockUser, token: mockToken } })

    await store.login('test@example.com', 'password')

    expect(store.user).toEqual(mockUser)
    expect(store.token).toBe(mockToken)
    expect(localStorage.getItem('token')).toBe(mockToken)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(store.isAuthenticated).toBe(true)
  })

  it('handles login failure', async () => {
    (axios.post as Mock).mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } })

    await expect(store.login('wrong@email.com', 'wrongpass')).rejects.toThrow()
    expect(store.user).toBeNull()
    expect(store.token).toBe('')
    expect(store.error).toBe('Invalid credentials')
  })

  it('logs out correctly', () => {
    store.token = 'fake.token'
    store.user = { _id: '123' } as any
    localStorage.setItem('token', 'fake.token')
    localStorage.setItem('user', JSON.stringify({ _id: '123' }))

    store.logout()

    expect(store.user).toBeNull()
    expect(store.token).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('initializes from localStorage', () => {
    const mockUser = { _id: '123', email: 'test@example.com' }
    const mockToken: string = 'fake.token'
    localStorage.setItem('token', mockToken)
    localStorage.setItem('user', JSON.stringify(mockUser))

    store.init()

    expect(store.user).toEqual(mockUser)
    expect(store.token).toBe(mockToken)
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears auth on invalid stored data', () => {
    localStorage.setItem('token', 'fake.token')
    localStorage.setItem('user', 'invalid json')

    store.init()

    expect(store.user).toBeNull()
    expect(store.token).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('checks roles correctly', () => {
    store.user = { roles: ['admin', 'sales'] } as any

    expect(store.hasRole('admin')).toBe(true)
    expect(store.hasRole('manager')).toBe(false)
    expect(store.hasAnyRole(['manager', 'sales'])).toBe(true)
    expect(store.hasAnyRole(['manager'])).toBe(false)
  })
})