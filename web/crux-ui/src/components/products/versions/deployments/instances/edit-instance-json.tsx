import JsonEditor from '@app/components/shared/json-editor-dynamic-module'
import { IMAGE_WS_REQUEST_DELAY } from '@app/const'
import { CANCEL_THROTTLE, useThrottling } from '@app/hooks/use-throttleing'
import { CompleteContainerConfig, InstanceContainerConfig, UniqueKeyValue } from '@app/models-config'
import { fold } from '@app/utils'
import { completeContainerConfigSchema } from '@app/validation'
import clsx from 'clsx'
import { useCallback, useEffect, useReducer } from 'react'
import { v4 as uuid } from 'uuid'

interface EditInstanceJsonProps {
  disabled?: boolean
  className?: string
  config: InstanceContainerConfig
  disabledContainerNameEditing?: boolean
  onPatch: (config: Partial<InstanceContainerConfig>) => void
  onParseError?: (err: Error) => void
}

type EditImageJsonActionType = 'config-change' | 'set-content'

type EditImageJsonAction = {
  type: EditImageJsonActionType
  content?: CompleteContainerConfig
  config?: InstanceContainerConfig
}

const DEFAULT_CONFIG = completeContainerConfigSchema.getDefault() as any as CompleteContainerConfig

const keyValueArrayToJson = (envs: UniqueKeyValue[]): Record<string, string> =>
  fold(envs, {}, (prev, it) => {
    if (!prev[it.key]) {
      prev[it.key] = it.value
    }

    return prev
  })

const imageConfigToCompleteContainerConfig = (
  currentConfig: CompleteContainerConfig,
  imageConfig: InstanceContainerConfig,
): CompleteContainerConfig => {
  if (!imageConfig) {
    return currentConfig ?? DEFAULT_CONFIG
  }

  const config: CompleteContainerConfig = {
    ...(imageConfig.config ?? currentConfig ?? DEFAULT_CONFIG),
    name: imageConfig.name ?? currentConfig.name,
    environment: currentConfig?.environment ?? {},
    capabilities: currentConfig?.capabilities ?? {},
    secrets: currentConfig?.secrets ?? {},
  }

  if (imageConfig.environment) {
    config.environment = keyValueArrayToJson(imageConfig.environment)
  }

  if (imageConfig.capabilities) {
    config.capabilities = keyValueArrayToJson(imageConfig.capabilities)
  }

  return config
}

const reducer = (state: CompleteContainerConfig, action: EditImageJsonAction): CompleteContainerConfig => {
  const { type } = action

  if (type === 'config-change') {
    return imageConfigToCompleteContainerConfig(state, action.config)
  }
  if (type === 'set-content') {
    return action.content
  }

  throw Error(`Invalid EditImageJson action: ${type}`)
}

const mergeKeyValuesWithJson = (items: UniqueKeyValue[], json: Record<string, string>): UniqueKeyValue[] => {
  if (!json || Object.entries(json).length < 1) {
    return []
  }

  let modified = false
  const result = []
  Object.entries(json).forEach(entry => {
    const [key, value] = entry

    const byKey = items.find(it => it.key === key)
    if (!byKey) {
      const byValue = items.find(it => it.value === value)

      result.push({
        key,
        value,
        id: byValue?.id ?? uuid(),
      })

      modified = true
    } else {
      if (byKey.value !== value) {
        modified = true
      }

      result.push({
        key,
        value,
        id: byKey.id,
      })
    }
  })

  const jsonKeys = Object.keys(json)
  const removed = items.filter(it => !jsonKeys.includes(it.key))
  if (removed.length > 0) {
    modified = true
  }

  return modified ? result : undefined
}

const EditInstanceJson = (props: EditInstanceJsonProps) => {
  const { onPatch, onParseError: propsOnParseError, config, disabledContainerNameEditing, className, disabled } = props

  const throttle = useThrottling(IMAGE_WS_REQUEST_DELAY)

  const [state, dispatch] = useReducer(reducer, imageConfigToCompleteContainerConfig(null, null))

  const onChange = useCallback(
    (newConfig: CompleteContainerConfig) => {
      throttle(() => {
        onPatch({
          config: newConfig,
          name: newConfig.name,
          environment: mergeKeyValuesWithJson(config?.environment ?? [], newConfig?.environment),
          capabilities: mergeKeyValuesWithJson(config?.capabilities ?? [], newConfig?.capabilities),
        })

        dispatch({
          type: 'set-content',
          content: newConfig,
        })
      })
    },
    [throttle, config, onPatch],
  )

  const onParseError = useCallback(
    (err: Error) => {
      throttle(CANCEL_THROTTLE)

      propsOnParseError(err)
    },
    [throttle, propsOnParseError],
  )

  useEffect(
    () =>
      dispatch({
        type: 'config-change',
        config,
      }),
    [config],
  )

  if (disabledContainerNameEditing) {
    delete state.name
  }

  return (
    <JsonEditor
      className={clsx('h-128 overflow-y-auto', className)}
      disabled={disabled}
      value={state}
      onChange={onChange}
      onParseError={onParseError}
    />
  )
}

export default EditInstanceJson