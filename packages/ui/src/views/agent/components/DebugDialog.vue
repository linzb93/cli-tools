<template>
  <el-dialog title="调试" v-model="visible" width="500px" @close="close" @closed="closed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="接口" prop="url">
        <el-form-item>
          <el-select v-model="form.prefix" placeholder="请选择接口" style="width: 120px">
            <el-option
              v-for="rule in props.rules"
              :key="rule.from"
              :label="rule.from"
              :value="rule.from"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.url"
            placeholder="请输入调试URL"
            class="ml10"
            style="width: 257px"
          />
        </el-form-item>
      </el-form-item>
      <el-form-item label="方法" prop="method">
        <el-radio-group v-model="form.method">
          <el-radio label="GET" value="GET" name="method" />
          <el-radio label="POST" value="POST" name="method" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="请求体" prop="body">
        <el-input v-model="form.body" type="textarea" resize="none" />
      </el-form-item>
      <el-form-item label="请求头" prop="headers">
        <el-input v-model="form.headers" type="textarea" resize="none" />
      </el-form-item>
    </el-form>
    <div class="response-panel" v-if="loaded">
      <h2>响应数据</h2>
      <pre class="response-content">{{ responseData }}</pre>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="submit">调试</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import doRequest from '@/helpers/request'
import { ref } from 'vue'

const visible = defineModel('visible', {
  type: Boolean,
  default: false
})
const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  },
  itemId: {
    type: Number,
    default: 0
  }
})
const formRef = ref()

const form = ref({
  prefix: '',
  url: '',
  method: 'POST',
  body: '',
  headers: ''
})

const rules = ref({
  prefix: [{ required: true, message: '请选择接口', trigger: 'blur' }],
  url: [{ required: true, message: '请输入调试URL', trigger: 'blur' }],
  method: [{ required: true, message: '请选择方法', trigger: 'blur' }],
  body: [
    {
      validator: (rule, value, callback) => {
        if (value === '') {
          callback()
          return
        }
        try {
          JSON.parse(JSON.stringify(value))
          callback()
        } catch (error) {
          callback(new Error('请求体格式错误，请输入正确的JSON字符串'))
        }
      },
      trigger: 'blur'
    }
  ],
  headers: [
    {
      validator: (rule, value, callback) => {
        if (value === '') {
          callback()
          return
        }
        try {
          JSON.parse(JSON.stringify(value))
          callback()
        } catch (error) {
          callback(new Error('请求头格式错误，请输入正确的JSON字符串'))
        }
      },
      trigger: 'blur'
    }
  ]
})

const loaded = ref(false)
const responseData = ref('')

const submit = async () => {
  const isValid = await formRef.value.validate()
  if (!isValid) {
    return
  }
  const res = await doRequest('/agent/debug', {
    ...form.value,
    id: props.itemId
  })
  responseData.value = JSON.stringify(res, null, 2)
  loaded.value = true
}

const close = () => {
  visible.value = false
}

const closed = () => {
  responseData.value = ''
  form.value = {
    prefix: '',
    url: '',
    method: 'POST',
    body: '',
    headers: ''
  }
  formRef.value.resetFields()
  loaded.value = false
}
</script>
<style lang="scss" scoped>
.response-panel {
  h2 {
    font-weight: bold;
    font-size: 16px;
  }
}
.response-content {
  margin-top: 20px;
  word-break: break-all;
  white-space: pre-wrap;
  background: #f7f7f7;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
}
</style>
