/**
 * MODEL: REFRESH TOKEN
 * 
 * Responsabilidades:
 * - Armazenar refresh tokens emitidos
 * - Possibilitar revogação de tokens
 * - Associar tokens a usuários
 * - Implementar expiração automática
 * - Permitir rotação de tokens
 */

// const mongoose = require('mongoose');

/**
 * Schema do Refresh Token
 */
// const refreshTokenSchema = new mongoose.Schema({
//   token: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   
//   expiresAt: {
//     type: Date,
//     required: true
//   },
//   
//   createdByIp: {
//     type: String
//   },
//   
//   revokedAt: {
//     type: Date
//   },
//   
//   revokedByIp: {
//     type: String
//   },
//   
//   replacedByToken: {
//     type: String
//   },
//   
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// 
// }, {
//   timestamps: true
// });

/**
 * VIRTUAL: Verificar se token está expirado
 */
// refreshTokenSchema.virtual('isExpired').get(function() {
//   return Date.now() >= this.expiresAt;
// });

/**
 * VIRTUAL: Verificar se token é válido (ativo e não expirado)
 */
// refreshTokenSchema.virtual('isValid').get(function() {
//   return this.isActive && !this.isExpired && !this.revokedAt;
// });

/**
 * ÍNDICES
 */
// refreshTokenSchema.index({ user: 1 });
// refreshTokenSchema.index({ token: 1 });
// refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * MÉTODOS ESTÁTICOS
 */

// Revogar token
// refreshTokenSchema.statics.revokeToken = async function(token, ipAddress) {
//   const refreshToken = await this.findOne({ token });
//   
//   if (!refreshToken) return null;
//   
//   refreshToken.revokedAt = Date.now();
//   refreshToken.revokedByIp = ipAddress;
//   refreshToken.isActive = false;
//   
//   await refreshToken.save();
//   return refreshToken;
// };

// Revogar todos os tokens de um usuário
// refreshTokenSchema.statics.revokeAllUserTokens = async function(userId, ipAddress) {
//   return await this.updateMany(
//     { user: userId, isActive: true },
//     { 
//       revokedAt: Date.now(),
//       revokedByIp: ipAddress,
//       isActive: false
//     }
//   );
// };

// const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

// module.exports = RefreshToken;

module.exports = {
  // Exportar quando implementado
};
