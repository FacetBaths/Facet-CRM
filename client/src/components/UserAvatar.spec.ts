import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UserAvatar from './UserAvatar.vue'

const mockUser = {
  _id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

describe('UserAvatar', () => {
  it('renders with image when avatar is provided', () => {
    const wrapper = mount(UserAvatar, {
      props: { user: mockUser }
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(mockUser.avatar)
  })

  it('renders initials when no avatar', () => {
    const noAvatarUser = { ...mockUser, avatar: undefined }
    const wrapper = mount(UserAvatar, {
      props: { user: noAvatarUser }
    })

    expect(wrapper.text()).toContain('JD')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('emits click event when clickable', async () => {
    const wrapper = mount(UserAvatar, {
      props: { user: mockUser, clickable: true }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([mockUser])
  })

  it('does not emit click when not clickable', async () => {
    const wrapper = mount(UserAvatar, {
      props: { user: mockUser, clickable: false }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('shows tooltip with full name', () => {
    const wrapper = mount(UserAvatar, {
      props: { user: mockUser, showTooltip: true }
    })

    const tooltip = wrapper.findComponent({ name: 'QTooltip' })
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('John Doe')
  })

  it('applies correct size', () => {
    const wrapper = mount(UserAvatar, {
      props: { user: mockUser, size: 'lg' }
    })

    expect(wrapper.attributes('size')).toBe('48px')
  })
})