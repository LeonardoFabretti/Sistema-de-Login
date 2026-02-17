import { useState, useCallback } from 'react';

/**
 * Hook customizado para gerenciamento de formulários
 * 
 * @param {object} initialValues - Valores iniciais do formulário
 * @param {function} onSubmit - Callback executado no submit
 * @param {function} validate - Função de validação (opcional)
 * @returns {object} - Estado e métodos do formulário
 */
const useForm = (initialValues = {}, onSubmit, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Atualiza valor de um campo
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Limpar erro quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  /**
   * Marca campo como touched no blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;

    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validar campo específico no blur
    if (validate && typeof validate === 'function') {
      const fieldErrors = validate({ ...values, [name]: values[name] });
      
      if (fieldErrors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: fieldErrors[name]
        }));
      }
    }
  }, [values, validate]);

  /**
   * Valida todos os campos
   */
  const validateForm = useCallback(() => {
    if (!validate || typeof validate !== 'function') {
      return {};
    }

    const validationErrors = validate(values);
    setErrors(validationErrors);
    return validationErrors;
  }, [values, validate]);

  /**
   * Submit do formulário
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Marcar todos campos como touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validar
    const validationErrors = validateForm();
    
    // Se há erros, não submeter
    if (Object.keys(validationErrors).length > 0) {
      // Focar no primeiro campo com erro
      const firstErrorField = Object.keys(validationErrors)[0];
      const fieldElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (fieldElement) {
        fieldElement.focus();
      }
      return;
    }

    // Executar callback de submit
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      // Você pode setar erros globais aqui se necessário
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  /**
   * Reseta o formulário
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Seta valor de um campo programaticamente
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Seta erro de um campo programaticamente
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  /**
   * Seta múltiplos erros
   */
  const setFormErrors = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  return {
    // Estado
    values,
    errors,
    touched,
    isSubmitting,
    
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Métodos
    resetForm,
    setFieldValue,
    setFieldError,
    setFormErrors,
    validateForm,
    
    // Helpers
    getFieldProps: (name) => ({
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] && errors[name] ? errors[name] : ''
    })
  };
};

export default useForm;
