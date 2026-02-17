# 📐 Arquitetura React - Sistema de Login

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Componentes](#componentes)
4. [Hooks Customizados](#hooks-customizados)
5. [Services](#services)
6. [Validadores](#validadores)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Decisões de Design](#decisões-de-design)
9. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Este projeto implementa um **sistema de autenticação moderno** usando React 18+ com uma arquitetura **escalável, modular e reutilizável**. A estrutura segue princípios de **Atomic Design**, **Separation of Concerns** e **DRY (Don't Repeat Yourself)**.

### Principais Tecnologias

- **React 18+** - Framework UI com Hooks
- **React Router DOM** - Navegação SPA
- **CSS Modules** - Isolamento de estilos
- **Fetch API** - Requisições HTTP

### Características

✅ **Componentes reutilizáveis** (Input, Button, Alert)  
✅ **Estado controlado** (Controlled Components)  
✅ **Validação robusta** (client-side + API-ready)  
✅ **Acessibilidade WCAG** (ARIA, focus management)  
✅ **Performance otimizada** (useCallback, CSS Modules)  
✅ **API-ready** (async/await, loading states)  
✅ **Dark mode support** (prefers-color-scheme)  
✅ **Mobile responsive** (design adaptativo)  

---

## 📂 Estrutura de Pastas

```
react-login/
├── public/
│   └── index.html              # HTML root
├── src/
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes atômicos (reutilizáveis)
│   │   │   ├── Input/          # Campo de entrada
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Input.module.css
│   │   │   ├── Button/         # Botão
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.module.css
│   │   │   └── Alert/          # Notificação
│   │   │       ├── Alert.jsx
│   │   │       └── Alert.module.css
│   │   └── Login/              # Página de Login
│   │       ├── Login.jsx
│   │       └── Login.module.css
│   ├── hooks/                  # Hooks customizados
│   │   ├── useForm.js          # Gerenciamento de formulários
│   │   └── useAuth.js          # Autenticação
│   ├── services/               # Serviços de API
│   │   └── apiService.js       # HTTP client
│   ├── utils/                  # Utilitários
│   │   └── validators.js       # Funções de validação
│   ├── App.jsx                 # Componente raiz
│   ├── App.css                 # Estilos globais
│   └── index.js                # Entry point
└── package.json                # Dependências
```

---

## 🎨 Componentes

### 1. **Input** (Componente Atômico)

**Localização:** `src/components/ui/Input/`

**Responsabilidade:** Campo de entrada reutilizável com validação visual

**Props:**
```javascript
{
  label: string,              // Label do campo
  type: string,               // text, email, password, etc.
  name: string,               // Nome do campo (required)
  value: string,              // Valor controlado
  onChange: function,         // Handler de mudança
  onBlur: function,           // Handler de blur (validação)
  error: string,              // Mensagem de erro
  icon: ReactNode,            // Ícone decorativo
  placeholder: string,        // Texto placeholder
  required: boolean,          // Campo obrigatório
  disabled: boolean,          // Campo desabilitado
  autoComplete: string,       // Autocomplete HTML5
  showPasswordToggle: boolean // Toggle mostrar/ocultar senha
}
```

**Features:**
- ✅ **Controlled input** (valor gerenciado por React)
- ✅ **Toggle de senha** (botão olho para mostrar/ocultar)
- ✅ **Estados visuais** (normal, hover, focus, error, disabled)
- ✅ **Validação visual** (shake animation em erro)
- ✅ **ARIA attributes** (aria-invalid, aria-describedby)
- ✅ **forwardRef** (compatível com refs externas)

**Exemplo de Uso:**
```jsx
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

---

### 2. **Button** (Componente Atômico)

**Localização:** `src/components/ui/Button/`

**Responsabilidade:** Botão reutilizável com variantes e estados de loading

**Props:**
```javascript
{
  children: ReactNode,        // Conteúdo do botão
  variant: string,            // primary, secondary, outline, ghost
  size: string,               // sm, md, lg
  isLoading: boolean,         // Estado de carregamento
  disabled: boolean,          // Botão desabilitado
  fullWidth: boolean,         // Largura 100%
  type: string,               // button, submit, reset
  onClick: function,          // Handler de clique
  icon: ReactNode,            // Ícone
  iconPosition: string        // left, right
}
```

**Variantes:**
- **primary**: Gradiente roxo com shimmer effect
- **secondary**: Cinza sólido
- **outline**: Borda roxa, preenchimento no hover
- **ghost**: Transparente, fundo no hover

**Tamanhos:**
- **sm**: 36px altura
- **md**: 48px altura (padrão)
- **lg**: 56px altura

**Features:**
- ✅ **Loading spinner** (SVG animado)
- ✅ **Shimmer effect** (gradiente animado no hover)
- ✅ **Disabled state** (automático durante loading)
- ✅ **Ícones posicionados** (antes ou depois do texto)

**Exemplo de Uso:**
```jsx
<Button
  variant="primary"
  size="lg"
  isLoading={isSubmitting}
  fullWidth
  type="submit"
>
  {isSubmitting ? 'Entrando...' : 'Entrar'}
</Button>
```

---

### 3. **Alert** (Componente Atômico)

**Localização:** `src/components/ui/Alert/`

**Responsabilidade:** Notificações de feedback (sucesso, erro, aviso, info)

**Props:**
```javascript
{
  type: string,               // success, error, warning, info
  message: string,            // Mensagem da notificação
  onClose: function,          // Callback ao fechar
  autoClose: boolean,         // Auto-fechar após duração
  duration: number            // Duração em ms (padrão: 5000)
}
```

**Tipos:**
- **success**: Verde (✓ checkmark)
- **error**: Vermelho (✗ X)
- **warning**: Laranja (⚠ triângulo)
- **info**: Azul (ℹ info)

**Features:**
- ✅ **Auto-close** (useEffect com setTimeout)
- ✅ **Ícones SVG** (diferentes por tipo)
- ✅ **slideDown animation** (entrada suave)
- ✅ **role="alert"** (screen readers)

**Exemplo de Uso:**
```jsx
{alert && (
  <Alert
    type="error"
    message="Email ou senha incorretos"
    onClose={() => setAlert(null)}
    autoClose={true}
    duration={5000}
  />
)}
```

---

### 4. **Login** (Página Completa)

**Localização:** `src/components/Login/`

**Responsabilidade:** Página de autenticação que compõe todos componentes

**Estrutura:**
```jsx
<Container>
  <Background animado />
  <Card>
    <Header>
      <Logo />
      <Title />
      <Subtitle />
    </Header>
    
    <Alert (condicional) />
    
    <Form>
      <Input email />
      <Input senha />
      <Checkbox Lembrar-me />
      <Link Esqueceu senha? />
      <Button Submit />
    </Form>
    
    <Footer>
      <Link Cadastre-se />
    </Footer>
    
    <Divider />
    
    <SocialButtons>
      <Button Google />
      <Button Facebook />
    </SocialButtons>
  </Card>
</Container>
```

**Features:**
- ✅ **Background gradiente animado** (shapes flutuantes)
- ✅ **Card com slideUp animation** (entrada da página)
- ✅ **Validação completa** (useForm + validateLoginForm)
- ✅ **Integração API** (authAPI.login)
- ✅ **Loading states** (isSubmitting)
- ✅ **Feedback visual** (Alert success/error)
- ✅ **Redirecionamento** (useNavigate após login)
- ✅ **Remember me** (localStorage vs sessionStorage)

---

## 🪝 Hooks Customizados

### 1. **useForm**

**Localização:** `src/hooks/useForm.js`

**Responsabilidade:** Gerenciamento completo de formulários React

**Assinatura:**
```javascript
const {
  values,         // Valores dos campos: { fieldName: value }
  errors,         // Erros: { fieldName: errorMessage }
  touched,        // Campos tocados: { fieldName: boolean }
  isSubmitting,   // Estado de submit: boolean
  
  handleChange,   // Handler onChange
  handleBlur,     // Handler onBlur (validação)
  handleSubmit,   // Handler onSubmit
  
  resetForm,      // Reseta formulário
  setFieldValue,  // Seta valor de campo
  setFieldError,  // Seta erro de campo
  setFormErrors,  // Seta múltiplos erros
  validateForm,   // Valida formulário completo
  
  getFieldProps   // Helper: retorna { name, value, onChange, onBlur, error }
} = useForm(initialValues, onSubmit, validate);
```

**Parâmetros:**
- **initialValues**: `object` - Valores iniciais `{ email: '', password: '' }`
- **onSubmit**: `async function(values)` - Callback executado após validação
- **validate**: `function(values)` - Função de validação, retorna `{ fieldName: error }`

**Fluxo:**

1. **onChange** → Atualiza `values[name]` + limpa `errors[name]`
2. **onBlur** → Marca `touched[name]` + valida campo individual
3. **onSubmit** → Valida tudo + foca primeiro erro + executa `onSubmit(values)`

**Helper getFieldProps:**
```javascript
// Ao invés de:
<Input
  name="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={touched.email && errors.email}
/>

// Use:
<Input {...getFieldProps('email')} />
```

**Validação:**
```javascript
// Função validate (opcional)
const validate = (values) => {
  const errors = {};
  
  if (!values.email) {
    errors.email = 'Email obrigatório';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!values.password || values.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres';
  }
  
  return errors; // { fieldName: errorMessage }
};
```

**Focus Management:**
```javascript
// Após submit com erros, foca primeiro campo com erro
const firstErrorField = Object.keys(validationErrors)[0];
const fieldElement = document.querySelector(`[name="${firstErrorField}"]`);
if (fieldElement) fieldElement.focus();
```

---

### 2. **useAuth**

**Localização:** `src/hooks/useAuth.js`

**Responsabilidade:** Gerenciamento de autenticação e estado do usuário

**Assinatura:**
```javascript
const {
  user,            // Dados do usuário: { id, name, email }
  token,           // Token JWT
  isLoading,       // Carregando: boolean
  error,           // Erro: string
  isAuthenticated, // Autenticado: boolean
  
  login,           // async (credentials)
  logout,          // async ()
  register,        // async (userData)
  checkAuth,       // async () → verifica se token é válido
  updateProfile,   // async (updates)
  
  clearError       // () → limpa erro
} = useAuth(apiUrl);
```

**Storage de Token:**
```javascript
// Remember me = true → localStorage
// Remember me = false → sessionStorage

const saveToken = (token, remember) => {
  if (remember) {
    localStorage.setItem('authToken', token);
  } else {
    sessionStorage.setItem('authToken', token);
  }
};
```

**Exemplo de Uso:**
```javascript
const { login, isLoading, error } = useAuth();

const handleLogin = async (credentials) => {
  try {
    await login(credentials);
    navigate('/dashboard');
  } catch (err) {
    setAlert({ type: 'error', message: err.message });
  }
};
```

---

## 🔌 Services

### **apiService**

**Localização:** `src/services/apiService.js`

**Responsabilidade:** Wrapper HTTP client (fetch) com interceptors

**Configuração:**
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Headers padrão
const defaultConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Auto-injetado se token existir
  },
  credentials: 'include' // Envia cookies
};
```

**Métodos:**
```javascript
// GET
apiService.get('/users');

// POST
apiService.post('/auth/login', { email, password });

// PUT
apiService.put('/users/123', { name: 'Novo Nome' });

// DELETE
apiService.delete('/users/123');

// PATCH
apiService.patch('/users/123', { name: 'Novo Nome' });
```

**Endpoints de Autenticação:**
```javascript
import { authAPI } from './services/apiService';

// Login
await authAPI.login({ email, password });

// Registro
await authAPI.register({ name, email, password });

// Logout
await authAPI.logout();

// Verificar autenticação
await authAPI.checkAuth();

// Atualizar perfil
await authAPI.updateProfile({ name: 'Novo Nome' });

// Recuperar senha
await authAPI.forgotPassword('email@example.com');

// Resetar senha
await authAPI.resetPassword(token, newPassword);
```

**Tratamento de Erros:**
```javascript
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || data.message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
```

---

## ✅ Validadores

**Localização:** `src/utils/validators.js`

### Funções de Validação

```javascript
// Email
validateEmail(email) → boolean

// Senha (força)
validatePassword(password) → { isValid, errors[], strength: 0-5 }

// Nome
validateName(name) → boolean

// CPF
validateCPF(cpf) → boolean

// Telefone brasileiro
validatePhone(phone) → boolean

// URL
validateUrl(url) → boolean

// Data (DD/MM/YYYY)
validateDate(date) → boolean

// Idade mínima
validateMinAge(birthdate, minAge) → boolean
```

### Validadores de Formulário

```javascript
// Login
validateLoginForm(values) → { email?: string, password?: string }

// Registro
validateRegisterForm(values) → {
  name?: string,
  email?: string,
  password?: string,
  confirmPassword?: string
}
```

### Helpers de Formatação

```javascript
// Formatar CPF
formatCPF('12345678901') → '123.456.789-01'

// Formatar Telefone
formatPhone('11987654321') → '(11) 98765-4321'

// Sanitizar string (remove XSS)
sanitizeString(str) → string
```

---

## 🌊 Fluxo de Dados

### 1. **Fluxo de Login**

```
Usuário digita email/senha
         ↓
handleChange (useForm) → atualiza values.email/password
         ↓
handleBlur → marca touched.email/password → valida campo
         ↓
Usuário clica "Entrar"
         ↓
handleSubmit (useForm)
  ├─ validateForm() → retorna erros
  ├─ Se erros: foca primeiro campo + não submete
  └─ Se sem erros:
       ├─ setIsSubmitting(true)
       ├─ onSubmit(values) → handleLoginSubmit
       │    ├─ authAPI.login({ email, password })
       │    ├─ Sucesso:
       │    │    ├─ saveToken (localStorage/sessionStorage)
       │    │    ├─ setAlert({ type: 'success', ... })
       │    │    └─ navigate('/dashboard')
       │    └─ Erro:
       │         └─ setAlert({ type: 'error', ... })
       └─ setIsSubmitting(false)
```

### 2. **Diagrama de Componentes**

```
App.jsx
  └─ Router
       └─ Routes
            └─ Route /login
                 └─ Login.jsx
                      ├─ useForm (hook)
                      │    ├─ values { email, password, rememberMe }
                      │    ├─ errors { email?, password? }
                      │    ├─ touched { email, password }
                      │    └─ handlers { handleChange, handleBlur, handleSubmit }
                      │
                      ├─ useState (alert)
                      │
                      ├─ useNavigate (react-router)
                      │
                      └─ JSX
                           ├─ Alert (condicional)
                           ├─ Form
                           │    ├─ Input email (getFieldProps)
                           │    ├─ Input password (getFieldProps)
                           │    └─ Button submit (isLoading={isSubmitting})
                           └─ Social Buttons
```

---

## 🎯 Decisões de Design

### 1. **CSS Modules vs Styled-Components**

**Escolhido:** CSS Modules

**Razões:**
- ✅ **Zero runtime overhead** (CSS puro em produção)
- ✅ **Build-time optimization** (webpack/vite)
- ✅ **Familiar CSS syntax** (sem learning curve)
- ✅ **CSS Variables nativos** (tema global)
- ✅ **Tree shaking automático**

**Styled-Components:**
- ❌ Runtime overhead (parsing CSS-in-JS)
- ❌ Prop drilling complexo
- ❌ Bundle size maior

---

### 2. **forwardRef no Input**

**Razão:** Compatibilidade com bibliotecas externas

```javascript
const Input = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

**Benefícios:**
- ✅ Compatível com **react-hook-form** (`register`)
- ✅ Focus programático (`inputRef.current.focus()`)
- ✅ Refs externas (scroll to field, measure DOM)

---

### 3. **useCallback nos Handlers**

**Razão:** Otimização de performance

```javascript
const handleChange = useCallback((e) => {
  setValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
}, []);
```

**Benefícios:**
- ✅ **Evita re-renders** desnecessários (memo optimization)
- ✅ **Estabiliza referências** (useEffect dependencies)
- ✅ **Performance em listas** (map com callbacks)

---

### 4. **getFieldProps Helper**

**Razão:** DRY (Don't Repeat Yourself)

```javascript
// Sem helper (repetitivo):
<Input
  name="email"
  value={values.email}
  onChange={handleChange}
  onBlur={handleBlur}
  error={touched.email && errors.email}
/>

// Com helper (1 linha):
<Input {...getFieldProps('email')} />
```

**Benefícios:**
- ✅ **Consistência** (sempre mesma API)
- ✅ **Refactoring fácil** (mudar lógica em 1 lugar)
- ✅ **Pattern Formik** (biblioteca mais usada)

---

### 5. **Estado `touched` Separado**

**Razão:** UX de validação

```javascript
const [touched, setTouched] = useState({});

// Só mostra erro se campo foi tocado
error={touched.email && errors.email}
```

**Benefícios:**
- ✅ **Não mostra erro antes de interação** (UX positiva)
- ✅ **Validação on blur** vs **on input** (timing diferente)
- ✅ **Submit marca todos touched** de uma vez

---

## 🚀 Boas Práticas

### 1. **Controlled Components**

```javascript
// ✅ CERTO (Controlled)
const [value, setValue] = useState('');
<input value={value} onChange={(e) => setValue(e.target.value)} />

// ❌ ERRADO (Uncontrolled)
<input defaultValue="valor" />
```

**Razão:** Single source of truth (estado React controla DOM)

---

### 2. **Validação Client-Side + Server-Side**

```javascript
// Client-side (UX rápida)
const errors = validateLoginForm(values);

// Server-side (segurança)
try {
  await authAPI.login(values);
} catch (error) {
  setFieldError('email', 'Credenciais inválidas');
}
```

**Razão:** Never trust client (validação dupla)

---

### 3. **PropTypes ou TypeScript (futuro)**

```javascript
// Com PropTypes
Input.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

// Com TypeScript (recomendado)
interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}
```

---

### 4. **Error Boundaries**

```javascript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Algo deu errado.</h1>;
    }
    return this.props.children;
  }
}
```

---

### 5. **Code Splitting (futuro)**

```javascript
// Lazy loading de páginas
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

---

## 📦 Instalação e Uso

### Instalação

```bash
cd react-login
npm install
```

### Desenvolvimento

```bash
npm start
# Abre http://localhost:3000
```

### Build Produção

```bash
npm run build
# Cria pasta build/ otimizada
```

### Estrutura Build

```
build/
├── static/
│   ├── css/
│   │   └── main.[hash].css      # CSS minificado
│   └── js/
│       └── main.[hash].js       # JS minificado
└── index.html                   # HTML otimizado
```

---

## 🎓 Próximos Passos

### Fase 1: Páginas Adicionais
- [ ] Register (cadastro)
- [ ] ForgotPassword (recuperar senha)
- [ ] ResetPassword (resetar senha)
- [ ] Dashboard (área logada)

### Fase 2: Contexto Global
- [ ] AuthContext (Context API)
- [ ] ProtectedRoute (rotas privadas)
- [ ] Persistência de sessão

### Fase 3: Melhorias UX
- [ ] Toast notifications (react-hot-toast)
- [ ] Loading skeleton
- [ ] Animações (framer-motion)
- [ ] Infinite scroll

### Fase 4: Testes
- [ ] Jest + React Testing Library
- [ ] Testes unitários (componentes)
- [ ] Testes de integração (formulários)
- [ ] Cypress (E2E)

### Fase 5: Otimização
- [ ] Code splitting (React.lazy)
- [ ] Service Worker (PWA)
- [ ] React Query (cache API)
- [ ] Virtualization (listas grandes)

---

## 📚 Referências

- [React Docs](https://react.dev)
- [React Router](https://reactrouter.com)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)

---

**Documentação criada com ❤️ para facilitar manutenção e escalabilidade**
