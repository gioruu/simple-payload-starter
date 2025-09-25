'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { TextFieldClientProps } from 'payload'

import { useField, Button, TextInput, FieldLabel, useFormFields, useForm } from '@payloadcms/ui'

import { formatSlug } from './formatSlug'
import './index.scss'

type SlugComponentProps = {
  fieldToUse: string
  checkboxFieldPath: string
} & TextFieldClientProps

export const SlugComponent: React.FC<SlugComponentProps> = ({
  field,
  fieldToUse,
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,
  readOnly: readOnlyFromProps,
}) => {
  const { label } = field

  const checkboxFieldPath = path?.includes('.')
    ? `${path}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps

  const { value, setValue } = useField<string>({ path: path || field.name })

  const { dispatchFields } = useForm()

  // Track if we've seen a non-empty slug to determine if this is an existing document
  const hasSeenNonEmptySlug = useRef(false)
  const isFirstRender = useRef(true)

  // The value of the checkbox
  // We're using separate useFormFields to minimise re-renders
  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as string
  })

  // The value of the field we're listening to for the slug
  const targetFieldValue = useFormFields(([fields]) => {
    return fields[fieldToUse]?.value as string
  })

  // Track if we've encountered a non-empty slug (indicates existing document)
  useEffect(() => {
    if (value && value.trim() !== '' && !hasSeenNonEmptySlug.current) {
      hasSeenNonEmptySlug.current = true
    }
  }, [value])

  useEffect(() => {
    if (checkboxValue) {
      if (targetFieldValue) {
        const formattedSlug = formatSlug(targetFieldValue)
        
        // Only update slug if:
        // 1. We've never seen a non-empty slug (indicates new document), OR  
        // 2. Current slug is empty (user manually cleared it)
        const shouldUpdateSlug = !hasSeenNonEmptySlug.current || 
                                (!value || value.trim() === '')

        if (shouldUpdateSlug && value !== formattedSlug) {
          setValue(formattedSlug)
        }
      } else {
        // Only clear the slug if we haven't seen a non-empty slug yet (new document)
        if (!hasSeenNonEmptySlug.current && value !== '') {
          setValue('')
        }
      }
    }
    
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
  }, [targetFieldValue, checkboxValue, setValue, value])

  const handleLock = useCallback(
    (e) => {
      e.preventDefault()

      dispatchFields({
        type: 'UPDATE',
        path: checkboxFieldPath,
        value: !checkboxValue,
      })
    },
    [checkboxValue, checkboxFieldPath, dispatchFields],
  )

  const readOnly = readOnlyFromProps || checkboxValue

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />

        <Button className="lock-button" buttonStyle="none" onClick={handleLock}>
          {checkboxValue ? 'Unlock' : 'Lock'}
        </Button>
      </div>

      <TextInput
        value={value}
        onChange={setValue}
        path={path || field.name}
        readOnly={Boolean(readOnly)}
      />
    </div>
  )
}
