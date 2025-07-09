type Choice<Value> = {
  value: Value
  name?: string
  description?: string
  short?: string
  disabled?: boolean | string
  checked?: boolean
  type?: never
}

export { type Choice }
