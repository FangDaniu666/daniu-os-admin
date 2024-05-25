import { defineStore } from 'pinia'

export const useWebStore = defineStore('web', {
  state: () => ({
    base_url: 'http://localhost:8085/api'
  }),
  actions: {},
  persist: {}
})
