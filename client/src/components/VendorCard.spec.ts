import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VendorCard from './VendorCard.vue'

const mockVendor = {
  _id: '1',
  name: 'Test Vendor',
  contactName: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
  notes: 'Test notes',
  isActive: true
}

describe('VendorCard', () => {
  it('renders correctly with given props', () => {
    const wrapper = mount(VendorCard, {
      props: { vendor: mockVendor }
    })

    expect(wrapper.find('.text-h6').text()).toBe(mockVendor.name)
    expect(wrapper.find('.text-subtitle2').text()).toBe(mockVendor.contactName)
    expect(wrapper.text()).toContain(`Email: ${mockVendor.email}`)
    expect(wrapper.text()).toContain(`Phone: ${mockVendor.phone}`)
    expect(wrapper.text()).toContain('Address: 123 Main St, Anytown, CA 12345')
    expect(wrapper.text()).toContain(`Notes: ${mockVendor.notes}`)
    expect(wrapper.text()).toContain('Active: Yes')
    expect(wrapper.classes()).toContain('glass-card')
  })

  it('renders inactive status correctly', () => {
    const inactiveVendor = { ...mockVendor, isActive: false }
    const wrapper = mount(VendorCard, {
      props: { vendor: inactiveVendor }
    })

    expect(wrapper.text()).toContain('Active: No')
  })

  it('renders N/A for missing notes', () => {
    const noNotesVendor = { ...mockVendor, notes: '' }
    const wrapper = mount(VendorCard, {
      props: { vendor: noNotesVendor }
    })

    expect(wrapper.text()).toContain('Notes: N/A')
  })
})