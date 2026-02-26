/**
 * Remove caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF
 * Verifica formato e dígitos verificadores
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = removeNonNumeric(cpf);
  
  // CPF deve ter 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder: number;
  
  // Valida primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return false;
  }
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return false;
  }
  
  return true;
}

/**
 * Valida CNPJ
 * Verifica formato e dígitos verificadores
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = removeNonNumeric(cnpj);
  
  // CNPJ deve ter 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Valida primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) {
    return false;
  }
  
  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) {
    return false;
  }
  
  return true;
}

/**
 * Valida CPF ou CNPJ
 */
export function validateDocument(document: string): boolean {
  if (!document || document.trim() === "") {
    return true;
  }
  
  const cleanDoc = removeNonNumeric(document);
  
  if (cleanDoc.length === 11) {
    return validateCPF(document);
  } else if (cleanDoc.length === 14) {
    return validateCNPJ(document);
  }
  
  return false;
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = removeNonNumeric(cpf);
  if (cleanCPF.length <= 11) {
    return cleanCPF
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return cpf;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = removeNonNumeric(cnpj);
  if (cleanCNPJ.length <= 14) {
    return cleanCNPJ
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  return cnpj;
}

/**
 * Formata documento (CPF ou CNPJ) automaticamente
 */
export function formatDocument(document: string): string {
  if (!document) return "";
  const cleanDoc = removeNonNumeric(document);
  
  if (cleanDoc.length <= 11) {
    return formatCPF(document);
  } else {
    return formatCNPJ(document);
  }
}

/**
 * Valida telefone brasileiro
 * Aceita formatos: (00) 0000-0000, (00) 00000-0000, 00 0000-0000, etc.
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === "") {
    return true; // Telefone é opcional
  }
  
  const cleanPhone = removeNonNumeric(phone);
  
  // Telefone deve ter 10 ou 11 dígitos (com ou sem DDD)
  // 10 dígitos: telefone fixo (DDD + 8 dígitos)
  // 11 dígitos: celular (DDD + 9 dígitos)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return false;
  }
  
  // Verifica se começa com 0 (não é válido)
  if (cleanPhone.startsWith("0")) {
    return false;
  }
  
  return true;
}

/**
 * Formata telefone: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(phone: string): string {
  const cleanPhone = removeNonNumeric(phone);
  
  if (cleanPhone.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return cleanPhone
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    // Celular: (00) 00000-0000
    return cleanPhone
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === "") {
    return true; // Email é opcional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

