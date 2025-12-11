<template>
  <el-dialog title="调试" v-model="visible" width="500px" @close="close" @closed="closed">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="接口" prop="url">
        <el-select v-model="form.url" placeholder="请选择接口">
          <el-option
            v-for="rule in props.rules"
            :key="rule.from"
            :label="rule.from"
            :value="rule.from"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="方法" prop="method">
        <el-select v-model="form.method" placeholder="请选择方法">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
        </el-select>
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
import Js from '@/components/icons/Js.vue'
import { ref } from 'vue'

const visible = defineModel('visible', {
  type: Boolean,
  default: false
})
const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  }
})
const formRef = ref()

const form = ref({
  url: '',
  method: 'POST',
  body: '',
  headers: ''
})

const rules = ref({
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
          JSON.parse(value)
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
          JSON.parse(value)
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
  await formRef.value.validate()
  if (!loaded.value) {
    loaded.value = true
  }
}

const close = () => {
  visible.value = false
}

const closed = () => {
  responseData.value = ''
  form.value = {
    url: '',
    method: 'POST',
    body: '',
    headers: ''
  }
  formRef.value.resetFields()
  loaded.value = false
}
</script>
<style lang="scss" scoped></style>
