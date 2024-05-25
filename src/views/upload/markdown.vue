<template>
  <CommonPage>
    <n-upload
      class="mx-auto w-[75%] p-20 text-center"
      :custom-request="handleUpload"
      :show-file-list="false"
      accept=".md"
      @before-upload="onBeforeUpload"
    >
      <n-upload-dragger>
        <div class="h-150 f-c-c flex-col">
          <i class="i-mdi:upload mb-12 text-68 color-primary" />
          <n-text class="text-14 color-gray">点击或者拖动 Markdown 文件到该区域来上传</n-text>
        </div>
      </n-upload-dragger>
    </n-upload>

    <n-space vertical :size="12">
      <n-data-table
        ref="table"
        :columns="columns"
        :data="fileList"
        :pagination="pagination"
        :row-props="rowProps"
      />
      <n-dropdown
        placement="bottom-start"
        trigger="manual"
        :x="xRef"
        :y="yRef"
        :options="options"
        :show="showDropdownRef"
        :on-clickoutside="onClickoutside"
        @select="handleSelect"
      />
    </n-space>

  </CommonPage>
</template>

<script setup>
import axios from 'axios'
import { useWebStore } from '@/store'
import { CommonPage } from '@/components/index.js'
import { defineOptions, onMounted, ref } from 'vue'

const webStore = useWebStore()

defineOptions({ name: 'MarkdownUpload' })

let fileList = ref([])

const columns = [
  {
    title: 'ID',
    key: 'id',
    defaultSortOrder: 'ascend',
    sorter: 'default'
  },
  {
    title: 'Name',
    key: 'name',
    sorter: 'default'
  },
  {
    title: 'Path',
    key: 'path',
    sorter: 'default'

  },
  {
    title: 'Size',
    key: 'size',
    sorter: 'default'
  },
  {
    title: 'LastEditTime',
    key: 'lastedittime',
    sorter: 'default'
  }
]

const pagination = {
  pageSize: 5
}

onMounted(() => {
  getFileList()
})

function getFileList() {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: webStore.base_url + '/maps/selectAll'
  }

  axios.request(config)
    .then((response) => {
      fileList.value = response.data.data
    })
    .catch((error) => {
      console.log(error)
    })
}

function onBeforeUpload({ file }) {
  if (!file.file?.name.endsWith('.md')) { // 检查文件后缀是否为 .md
    $message.error('只能上传 Markdown 文件')
    return false
  }
  return true
}

async function handleUpload({ file, onFinish }) {
  if (!file || !file.name) {
    $message.error('请选择文件')
    return
  }

  const formData = new FormData()
  formData.append('file', file.file)
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: webStore.base_url + '/docs/insertOne',
    data: formData
  }

  try {
    axios.request(config)
      .then((response) => {
        //判断上传是否成功
        if (response.data.code === 0) {
          $message.success(response.data.message)
          getFileList()
        } else {
          $message.error(response.data.message)
        }
      })
      .catch(() => {
        $message.error('上传失败')
      })
  } catch (error) {
    $message.error('上传出错')
    console.error('上传出错:', error)
  } finally {
    onFinish() // 完成上传逻辑，通知前端组件处理完成
  }
}


let selectRow = ref('')
const showDropdownRef = ref(false)
const xRef = ref(0)
const yRef = ref(0)
const options = [
  {
    label: () => h('span', { style: { color: 'red' } }, '删除'),
    key: 'delete'
  }
]

function handleSelect(key) {
  if (key === 'edit') {
    $message.info(key)
  }
  if (key === 'delete') {
    let config = {
      method: 'delete',
      maxBodyLength: Infinity,
      url: webStore.base_url + '/docs/deleteOne?id=' + selectRow.value.id
    }

    axios.request(config)
      .then((response) => {
        $message.info(response.data.message)
        if (response.data.code === 0) {
          getFileList()
        }
      })
      .catch((error) => {
        $message.info('删除失败')
        console.log(error)
      })
  }
  onClickoutside()
}

function onClickoutside() {
  showDropdownRef.value = false
  clearSelectRow()
}

function clearSelectRow() {
  selectRow.value = ''
}

function rowProps(row) {
  return {
    onContextmenu: (e) => {
      selectRow.value = JSON.parse(JSON.stringify(row))
      e.preventDefault()
      showDropdownRef.value = false
      nextTick().then(() => {
        showDropdownRef.value = true
        xRef.value = e.clientX
        yRef.value = e.clientY
      })
    }
  }
}

</script>

