import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from './ProductCard.vue'

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  description: 'Test Description',
  category: 'materials',
  type: 'physical',
  variants: [
    {
      sku: 'SKU001',
      size: 'Large',
      color: 'Red',
      costPrice: 10.99,
      retailPrice: 19.99,
      isActive: true
    }
  ],
  isActive: true
}

describe('ProductCard', () => {
  it('renders correctly with given props', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    expect(wrapper.find('.text-h6').text()).toBe(mockProduct.name)
    expect(wrapper.find('.text-subtitle2').text()).toBe(mockProduct.description)
    expect(wrapper.classes()).toContain('glass-card')
  })

  it('displays variants in expansion item', async () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    const expansion = wrapper.findComponent({ name: 'QExpansionItem' })
    expect(expansion.exists()).toBe(true)
    expect(expansion.text()).toContain(`${mockProduct.variants.length} variants`)

    await expansion.trigger('click')
    expect(wrapper.text()).toContain('SKU: SKU001')
    expect(wrapper.text()).toContain('Size: Large')
    expect(wrapper.text()).toContain('Color: Red')
    expect(wrapper.text()).toContain('Cost: $10.99')
    expect(wrapper.text()).toContain('Retail: $19.99')
    expect(wrapper.text()).toContain('Active: Yes')
  })

  it('renders active status correctly', () => {
    const inactiveProduct = { ...mockProduct, isActive: false }
    const wrapper = mount(ProductCard, {
      props: { product: inactiveProduct }
    })

    expect(wrapper.text()).toContain('Active: No')
  })
})