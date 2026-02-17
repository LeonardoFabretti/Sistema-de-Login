/**
 * MIDDLEWARE: VALIDAÇÃO DE INPUT
 * 
 * Responsabilidades:
 * - Executar validação de schemas Joi
 * - Retornar erros de validação formatados
 * - Prevenir dados inválidos de chegarem aos controllers
 * - Sanitização básica de inputs
 */

/**
 * Middleware genérico para validação com Joi
 * 
 * @param {Object} schema - Schema Joi para validação
 * @param {String} property - Propriedade do request a validar (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retornar todos os erros, não apenas o primeiro
      stripUnknown: true, // Remover campos não definidos no schema
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors
      });
    }
    
    // Substituir request data com valor validado e sanitizado
    req[property] = value;
    
    next();
  };
};

module.exports = {
  validate,
};
