import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import axios from 'axios'
import POSCart from './POSCart.vue'

const mockCart = [
  { name: 'Item1', price: 10, quantity: 2 },
  { name: 'Item2', price: 20, quantity: 1 }
]

vi.mock('@/stores/posStore', () => ({
  usePosStore: () => ({
    cart: mockCart,
    total: 40,
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    resetCart: vi.fn()
  })
}))

vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: {} }))
  }
}))

describe('POSCart', () => {
  it('renders cart items', () => {
    const wrapper = mount(POSCart, {
      props: { canProcess: true }
    })

    const items = wrapper.findAll('.q-item')
    expect(items).toHaveLength(2)
    expect(wrapper.text()).toContain('Item1')
    expect(wrapper.text()).toContain('$10.00 x 2 = $20.00')
    expect(wrapper.text()).toContain('Total: $40.00')
  })

  it('updates quantity on button click', async () => {
    const wrapper = mount(POSCart, {
      props: { canProcess: true }
    })

    const addBtn = wrapper.findAll('.q-btn')[2]
    await addBtn.trigger('click')
    expect(wrapper.vm.posStore.updateQuantity).toHaveBeenCalledWith(0, 3)
  })

  it('removes item on delete click', async () => {
    const wrapper = mount(POSCart, {
      props: { canProcess: true }
    })

    const deleteBtn = wrapper.findAll('.q-btn')[3]
    await deleteBtn.trigger('click')
    expect(wrapper.vm.posStore.removeItem).toHaveBeenCalledWith(0)
  })

  it('processes payment on submit', async () => {
    const wrapper = mount(POSCart, {
      props: { canProcess: true }
    })

    await wrapper.find('form').trigger('submit')
    expect(axios.post).toHaveBeenCalled()
    expect(wrapper.vm.posStore.resetCart).toHaveBeenCalled()
  })

  it('shows view-only message when cannot process', () => {
    const wrapper = mount(POSCart, {
      props: { canProcess: false }
    })

    expect(wrapper.text()).toContain('View-only mode. You cannot process payments.')
  })
})