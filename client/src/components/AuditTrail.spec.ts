import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuditTrail from './AuditTrail.vue'

const mockLogs = [
  {
    _id: '1',
    timestamp: '2026-04-16T12:00:00Z',
    userId: { _id: 'u1', firstName: 'John', lastName: 'Doe' },
    changes: [{ field: 'status', oldValue: 'pending', newValue: 'active' }]
  },
  {
    _id: '2',
    timestamp: '2026-04-15T12:00:00Z',
    userId: { _id: 'u2', firstName: 'Jane', lastName: 'Smith' },
    changes: [{ field: 'name', oldValue: 'Old', newValue: 'New' }]
  }
]

describe('AuditTrail', () => {
  it('renders correctly with logs', () => {
    const wrapper = mount(AuditTrail, {
      props: { auditLogs: mockLogs }
    })

    expect(wrapper.classes()).toContain('glass-card')
    expect(wrapper.find('.text-h6').text()).toBe('Audit Trail')
    expect(wrapper.findAll('.q-timeline-entry')).toHaveLength(2)
  })

  it('sorts logs by timestamp descending', () => {
    const wrapper = mount(AuditTrail, {
      props: { auditLogs: mockLogs }
    })

    const entries = wrapper.findAll('.q-timeline-entry')
    expect(entries[0].find('.q-timeline__title').text()).toContain('Update by John Doe')
    expect(entries[1].find('.q-timeline__title').text()).toContain('Update by Jane Smith')
  })

  it('shows no history message when empty', () => {
    const wrapper = mount(AuditTrail, {
      props: { auditLogs: [] }
    })

    expect(wrapper.text()).toContain('No audit history yet')
  })

  it('emits refresh on button click', async () => {
    const wrapper = mount(AuditTrail, {
      props: { auditLogs: mockLogs }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('emits user-click on avatar click', async () => {
    const wrapper = mount(AuditTrail, {
      props: { auditLogs: mockLogs }
    })

    const avatar = wrapper.findComponent({ name: 'UserAvatar' })
    await avatar.vm.$emit('click', mockLogs[0].userId)
    expect(wrapper.emitted('user-click')).toBeTruthy()
    expect(wrapper.emitted('user-click')![0]).toEqual([mockLogs[0].userId])
  })
})