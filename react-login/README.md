# 🔐 React Login - Sistema de Autenticação Moderno

Sistema de autenticação completo desenvolvido com **React 18+**, **CSS Modules** e **React Router**. Design moderno, responsivo e acessível seguindo princípios de **Atomic Design** e **Clean Architecture**.

![React](https://img.shields.io/badge/React-18.2.0-61dafb?logo=react)
![React Router](https://img.shields.io/badge/React_Router-6.20.0-ca4245?logo=react-router)
![CSS Modules](https://img.shields.io/badge/CSS-Modules-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📸 Preview

### Página de Login
- Design gradiente moderno com animações suaves
- Validação em tempo real
- Toggle mostrar/ocultar senha
- Loading states
- Feedback visual (alertas)
- Social login (Google/Facebook)

---

## ✨ Características

### 🎨 UI/UX
- ✅ **Design moderno** com gradientes e animações
- ✅ **Responsivo** (mobile-first)
- ✅ **Dark mode** support (prefers-color-scheme)
- ✅ **Acessível** WCAG 2.1 AA (ARIA, focus management)
- ✅ **Animations** suaves (slideUp, float, shimmer)

### ⚙️ Funcionalidades
- ✅ **Validação robusta** (client-side + API-ready)
- ✅ **Loading states** em botões
- ✅ **Feedback visual** (alertas success/error)
- ✅ **Toggle senha** (mostrar/ocultar)
- ✅ **Remember me** (localStorage vs sessionStorage)
- ✅ **Error handling** completo
- ✅ **Focus management** (foca primeiro erro)

### 🏗️ Arquitetura
- ✅ **Componentes reutilizáveis** (Input, Button, Alert)
- ✅ **Hooks customizados** (useForm, useAuth)
- ✅ **CSS Modules** (isolamento de estilos)
- ✅ **Atomic Design** pattern
- ✅ **Separation of Concerns**
- ✅ **API service abstraction**

### 🚀 Performance
- ✅ **useCallback** optimization
- ✅ **CSS Modules** code splitting
- ✅ **Zero runtime CSS** overhead
- ✅ **Lazy loading** ready

---

## 📂 Estrutura do Projeto

```
react-login/
├── public/
│   └── index.html              # HTML root
├── src/
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes atômicos
│   │   │   ├── Input/          # Campo de entrada
│   │   │   ├── Button/         # Botão
│   │   │   └── Alert/          # Notificação
│   │   └── Login/              # Página de Login
│   ├── hooks/                  # Hooks customizados
│   │   ├── useForm.js          # Gerenciamento de formulários
│   │   └── useAuth.js          # Autenticação
│   ├── services/               # Serviços de API
│   │   └── apiService.js       # HTTP client
│   ├── utils/                  # Utilitários
│   │   └── validators.js       # Validações
│   ├── App.jsx                 # Componente raiz
│   ├── App.css                 # Estilos globais
│   └── index.js                # Entry point
├── package.json
├── README.md
└── ARCHITECTURE.md             # Documentação técnica
```

---

## 🚀 Como Usar

### Pré-requisitos
- **Node.js** 16+ ([Download](https://nodejs.org))
- **npm** ou **yarn**

### 1. Instalação

```bash
# Clone ou navegue até o diretório
cd react-login

# Instale as dependências
npm install
```

### 2. Configuração

Crie um arquivo `.env` na raiz (opcional):

```env
# URL da API backend
REACT_APP_API_URL=http://localhost:5000/api
```

Se não configurar, usa o padrão `http://localhost:5000/api`.

### 3. Desenvolvimento

```bash
# Inicia servidor de desenvolvimento
npm start
```

Abre automaticamente [http://localhost:3000](http://localhost:3000)

### 4. Build para Produção

```bash
# Cria build otimizado
npm run build
```

A pasta `build/` contém os arquivos otimizados para deploy.

### 5. Deploy

```bash
# Servir build localmente
npx serve -s build

# Ou fazer deploy em:
# - Vercel: vercel deploy
# - Netlify: netlify deploy
# - GitHub Pages: npm run deploy
```

---

## 🎯 Componentes Principais

### 1. **Input** (Componente Reutilizável)

```jsx
import Input from './components/ui/Input/Input';

<Input
  label="Email"
  type="email"
  name="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={errors.email}
  icon={<EmailIcon />}
  autoComplete="email"
/>
```

**Props:**
- `label` - Label do campo
- `type` - text, email, password, etc.
- `name` - Nome do campo (required)
- `value` - Valor controlado
- `onChange` - Handler de mudança
- `onBlur` - Handler de blur (validação)
- `error` - Mensagem de erro
- `icon` - Ícone decorativo (opcional)
- `showPasswordToggle` - Toggle senha (boolean)

---

### 2. **Button** (Componente Reutilizável)

```jsx
import Button from './components/ui/Button/Button';

<Button
  variant="primary"
  size="lg"
  isLoading={isSubmitting}
  fullWidth
  type="submit"
>
  Entrar
</Button>
```

**Props:**
- `variant` - primary, secondary, outline, ghost (padrão: primary)
- `size` - sm, md, lg (padrão: md)
- `isLoading` - Mostra spinner (boolean)
- `fullWidth` - Largura 100% (boolean)
- `icon` - Ícone (opcional)

---

### 3. **Alert** (Notificação)

```jsx
import Alert from './components/ui/Alert/Alert';

<Alert
  type="error"
  message="Email ou senha incorretos"
  onClose={() => setAlert(null)}
  autoClose={true}
  duration={5000}
/>
```

**Props:**
- `type` - success, error, warning, info
- `message` - Mensagem da notificação
- `onClose` - Callback ao fechar
- `autoClose` - Auto-fechar (boolean, padrão: true)
- `duration` - Duração em ms (padrão: 5000)

---

## 🪝 Hooks Customizados

### **useForm** (Gerenciamento de Formulários)

```jsx
import useForm from './hooks/useForm';
import { validateLoginForm } from './utils/validators';

const {
  values,
  errors,
  handleChange,
  handleBlur,
  handleSubmit,
  isSubmitting,
  getFieldProps  // Helper spread props
} = useForm(
  { email: '', password: '' },  // Valores iniciais
  async (values) => {
    // Função de submit
    await authAPI.login(values);
  },
  validateLoginForm  // Validação
);

// No JSX (com helper):
<Input {...getFieldProps('email')} label="Email" />

// Ou manualmente:
<Input
  name="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={errors.email}
/>
```

**Retorna:**
- `values` - Valores dos campos
- `errors` - Erros de validação
- `touched` - Campos que receberam blur
- `isSubmitting` - Estado de loading
- `handleChange` - Handler onChange
- `handleBlur` - Handler onBlur (valida)
- `handleSubmit` - Handler onSubmit
- `getFieldProps(name)` - Helper spread props

---

### **useAuth** (Autenticação)

```jsx
import useAuth from './hooks/useAuth';

const {
  user,
  token,
  isLoading,
  error,
  isAuthenticated,
  login,
  logout,
  register,
  checkAuth
} = useAuth();

// Login
await login({ email, password });

// Logout
await logout();

// Verificar se está autenticado
const isValid = await checkAuth();
```

---

## ✅ Validadores

```jsx
import {
  validateEmail,
  validatePassword,
  validateLoginForm,
  validateRegisterForm
} from './utils/validators';

// Email
validateEmail('user@example.com');  // true

// Senha (retorna força + erros)
const { isValid, errors, strength } = validatePassword('Senha123!');
// { isValid: true, errors: [], strength: 4 }

// Formulário completo
const errors = validateLoginForm({ email, password });
// { email?: 'Email inválido', password?: 'Mínimo 8 caracteres' }
```

---

## 🔌 API Service

```jsx
import { authAPI } from './services/apiService';

// Login
const response = await authAPI.login({ email, password });
// response.data.tokens.accessToken
// response.data.user

// Registro
await authAPI.register({ name, email, password });

// Logout
await authAPI.logout();

// Verificar autenticação
await authAPI.checkAuth();

// Atualizar perfil
await authAPI.updateProfile({ name: 'Novo Nome' });
```

---

## 🎨 CSS Modules

Cada componente tem seu próprio CSS Module isolado:

```jsx
// Login.jsx
import styles from './Login.module.css';

<div className={styles.container}>
  <div className={styles.card}>
    <h1 className={styles.title}>Login</h1>
  </div>
</div>
```

**Benefícios:**
- ✅ Escopo local automático (sem conflitos)
- ✅ Zero runtime overhead
- ✅ CSS Variables para tema global
- ✅ Tree shaking automático

---

## 🌈 Variáveis CSS (Tema Global)

**Arquivo:** `src/App.css`

```css
:root {
  /* Cores Primárias */
  --primary: #6366f1;
  --secondary: #764ba2;
  --success: #10b981;
  --error: #ef4444;
  
  /* Escala de Cinza */
  --gray-900: #111827;
  --gray-400: #9ca3af;
  
  /* Tipografia */
  --font-family: 'Inter', sans-serif;
  --font-base: 1rem;
  
  /* Espaçamento */
  --spacing-md: 1rem;
  
  /* Border Radius */
  --radius-md: 0.5rem;
  
  /* Sombras */
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

---

## 📱 Responsividade

```css
/* Mobile First */
.card {
  padding: 2rem 1.5rem;
}

/* Tablet (640px+) */
@media (min-width: 640px) {
  .card {
    padding: 2.5rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card {
    max-width: 450px;
  }
}
```

---

## ♿ Acessibilidade

### ARIA Attributes

```jsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${name}-error` : undefined}
/>

{error && (
  <span id={`${name}-error`} role="alert">
    {error}
  </span>
)}
```

### Focus Management

```javascript
// Foca primeiro campo com erro após submit
const firstErrorField = Object.keys(errors)[0];
document.querySelector(`[name="${firstErrorField}"]`).focus();
```

### Keyboard Navigation

- Tab/Shift+Tab - Navegar campos
- Enter - Submit formulário
- Space - Toggle checkbox
- Esc - Fechar modal/alert

### Prefers Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 📚 Documentação Técnica

Leia a **[Documentação da Arquitetura](./ARCHITECTURE.md)** para entender:

- 🏗️ Estrutura de pastas detalhada
- 🎨 Decisões de design (CSS Modules vs Styled-Components)
- 🪝 Hooks customizados (useForm, useAuth)
- 🔌 Services e API
- ✅ Validadores e utilitários
- 🌊 Fluxo de dados
- 🚀 Boas práticas

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Descrição |
|-----------|--------|-----------|
| React | 18.2.0 | Framework UI |
| React Router DOM | 6.20.0 | Navegação SPA |
| CSS Modules | - | Isolamento de estilos |
| React Scripts | 5.0.1 | Build tools (webpack) |

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm start

# Build produção
npm run build

# Testes (futuro)
npm test

# Eject (não recomendado)
npm run eject
```

---

## 🗺️ Roadmap

### ✅ Fase 1: Componentes Base (Concluído)
- [x] Input reutilizável
- [x] Button com variantes
- [x] Alert notifications
- [x] useForm hook
- [x] useAuth hook
- [x] API service
- [x] Validadores

### 🔄 Fase 2: Páginas Adicionais (Em desenvolvimento)
- [ ] Register (cadastro)
- [ ] ForgotPassword (recuperar senha)
- [ ] Dashboard (área logada)

### 📋 Fase 3: Melhorias
- [ ] Context API (AuthContext)
- [ ] Protected Routes
- [ ] Toast notifications
- [ ] Loading skeleton
- [ ] Animations (framer-motion)

### 🧪 Fase 4: Testes
- [ ] Jest + React Testing Library
- [ ] Testes unitários
- [ ] Testes E2E (Cypress)

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por **Seu Nome**

- GitHub: [@seuusuario](https://github.com/seuusuario)
- LinkedIn: [Seu Nome](https://linkedin.com/in/seunome)
- Email: seu@email.com

---

## 🙏 Agradecimentos

- [React Team](https://react.dev)
- [Create React App](https://create-react-app.dev)
- [Google Fonts - Inter](https://fonts.google.com/specimen/Inter)
- Comunidade React Brasil

---

**⭐ Se este projeto foi útil, considere dar uma estrela no GitHub!**
