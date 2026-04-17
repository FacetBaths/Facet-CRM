import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginPage from '../src/pages/LoginPage.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useRouter } from 'vue-router'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}))

describe('LoginPage', () => {
  let wrapper
  let pinia
  let authStore
  let router

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    authStore = {
      login: vi.fn().mockResolvedValue({}),
      isLoading: false,
      error: ''
    }
    vi.mock('../src/stores/auth', () => ({
      useAuthStore: () => authStore
    }))
    router = useRouter()
    wrapper = mount(LoginPage, {
      global: {
        plugins: [pinia]
      }
    })
  }

  it('renders the form', () => {
    expect(wrapper.find('q-form').exists()).toBe(true)
    expect(wrapper.findAll('q-input').length).toBe(2)
    expect(wrapper.find('q-btn').exists()).toBe(true)
  })

  it('calls login on submit', async () => {
    const emailInput = wrapper.findAll('q-input')[0]
    const passwordInput = wrapper.findAll('q-input')[1]
    await emailInput.setValue('test@example.com')
    await passwordInput.setValue('password')
    await wrapper.find('q-form').trigger('submit')

    expect(authStore.login).toHaveBeenCalledWith('test@example.com', 'password')
    expect(router.push).toHaveBeenCalledWith('/')
  })

  it('shows error if present', async () => {
    authStore.error = 'Invalid credentials'
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Invalid credentials')
  })
})