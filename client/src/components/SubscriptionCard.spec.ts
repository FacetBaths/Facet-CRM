import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriptionCard from './SubscriptionCard.vue'

const mockSubscription = {
  _id: '1',
  customerId: { _id: 'c1', firstName: 'John', lastName: 'Doe' },
  plan: 'apex',
  status: 'active',
  billingFrequency: 'monthly',
  monthlyAmount: 99.99,
  annualAmount: 999.99,
  nextBillDate: new Date('2026-05-01'),
  services: [
    { type: 'cleaning', season: 'spring', scheduledDate: new Date('2026-04-01'), status: 'scheduled' }
  ],
  payments: []
}

describe('SubscriptionCard', () => {
  it('renders correctly with given props', () => {
    const wrapper = mount(SubscriptionCard, {
      props: { subscription: mockSubscription }
    })

    expect(wrapper.find('.text-h6').text()).toBe('APEX Plan')
    expect(wrapper.text()).toContain('Customer: John Doe')
    expect(wrapper.text()).toContain('Status: active')
    expect(wrapper.text()).toContain('Billing: monthly - $99.99')
    expect(wrapper.text()).toContain('Next Bill: May 1, 2026')
    expect(wrapper.classes()).toContain('glass-card')
  })

  it('displays services in expansion item', async () => {
    const wrapper = mount(SubscriptionCard, {
      props: { subscription: mockSubscription }
    })

    const expansion = wrapper.findComponent({ name: 'QExpansionItem' })
    expect(expansion.exists()).toBe(true)
    expect(expansion.text()).toContain('1 services')

    await expansion.trigger('click')
    expect(wrapper.text()).toContain('cleaning (spring)')
    expect(wrapper.text()).toContain('Scheduled: Apr 1, 2026')
    expect(wrapper.text()).toContain('Status: scheduled')
  })

  it('handles annual billing', () => {
    const annualSub = { ...mockSubscription, billingFrequency: 'annual' }
    const wrapper = mount(SubscriptionCard, {
      props: { subscription: annualSub }
    })

    expect(wrapper.text()).toContain('Billing: annual - $999.99')
  })
})