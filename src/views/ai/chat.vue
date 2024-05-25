<template>
  <div class="chat-container">
    <!-- 消息显示区域 -->
    <div class="messages" v-html="formattedMessages"></div>
    <div>
      <!-- 输入框区域 -->
      <input v-model="inputMessage" @keyup.enter="sendMessage" placeholder="输入消息" />
      <button class="custom-button" @click="sendMessage">发送</button>
      <button class="custom-button red" @click="clearMessage">清空</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, computed } from 'vue'
import { useWebStore } from '@/store'
import { Marked } from 'marked'
import hljs from 'highlight.js'
import { markedHighlight } from 'marked-highlight'
import 'highlight.js/styles/atom-one-dark.css'

// 配置Marked与highlight.js
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'shell'
      return hljs.highlight(code, { language }).value
    }
  })
)

interface MessageEvent {
  data: string;
}

const webStore = useWebStore()
const inputMessage = ref<string>('')
const messages = ref<string>('')
let eventSource: EventSource | null = null

function sendMessage() {
  if (eventSource) {
    eventSource.close()
  }

  eventSource = new EventSource(`http://localhost:8081/chat-stream?message=${encodeURIComponent(inputMessage.value)}`)

  eventSource.onmessage = (event: MessageEvent) => {
    //如果是标点，且messages.value最后为空格，则删除空格
    if (event.data.match(/^[.!?]$/) && messages.value.endsWith(' ')) {
      messages.value = messages.value.slice(0, -1)
      messages.value += `${event.data} `
    } else if (event.data.match(/^[a-zA-Z]+$/)) {
      messages.value += `${event.data} `
    } else {
      messages.value += `${event.data}`
    }
  }

  eventSource.onopen = (event: Event) => {
    console.log('Connection to chat stream opened.')
  }

  eventSource.onerror = (event: Event) => {
    if (eventSource) {
      eventSource.close()
    }
    messages.value += '<br>'
  }

  messages.value += `daniu: ${inputMessage.value}<br><br>`
  inputMessage.value = ''
}

function clearMessage() {
  messages.value = ''
}

// 使用computed属性来格式化messages为HTML
const formattedMessages = computed(() => {
  return marked.parse(messages.value)
})

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close()
  }
})
</script>


<style scoped>
/* 添加您的样式 */
.chat-container {
  max-width: 100%;
  margin: 5% 10%;
  padding: 20px;
  background-color: #f9f9f9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  height: 50%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.custom-button {
  background-color: #4CAF50; /* Green */
  border: none;
  color: white;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin-right: 20px;
  margin-left: 5px;
  margin-top: 5px;
  cursor: pointer;
  border-radius: 20px;
}

.custom-button.red {
  background-color: #f44336; /* Red */
}

.messages {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  height: 90%;
}

.messages li {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 20px;
  background-color: #e0e0e0;
  max-width: 80%;
}

input {
  padding: 10px;
  border: none;
  border-radius: 20px;
  width: calc(100% - 20px);
}

input:focus {
  outline: none;
  box-shadow: 0 0 3px rgba(0, 123, 255, 0.25);
}
</style>
