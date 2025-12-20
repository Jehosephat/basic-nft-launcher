import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import components
import WalletConnect from './components/WalletConnect.vue'
import ClaimCollection from './components/ClaimCollection.vue'
import MyCollections from './components/MyCollections.vue'
import CreateTokenClass from './components/CreateTokenClass.vue'
import MyTokenClasses from './components/MyTokenClasses.vue'
import MintTokens from './components/MintTokens.vue'

// Define routes
const routes = [
  { path: '/', component: WalletConnect },
  { path: '/claim-collection', component: ClaimCollection },
  { path: '/my-collections', component: MyCollections },
  { path: '/create-token-class', component: CreateTokenClass },
  { path: '/my-token-classes', component: MyTokenClasses },
  { path: '/mint', component: MintTokens }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
