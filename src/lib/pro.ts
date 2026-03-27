const SECRET = "ShadowPro_Offline_Secret_2026";

// 站长用来生成激活码的函数（可以在浏览器的控制台运行，或者单独写个 Node 脚本）
// 默认有效期 90 天（约 3 个月）
export function generateCode(days: number = 90): string {
  const expDate = Date.now() + days * 24 * 60 * 60 * 1000;
  const hexExp = expDate.toString(16); // 将时间戳转为 16 进制
  // 生成一个简单的签名：对 (时间戳 + 密钥) 进行 Base64 编码，截取前 8 位作为校验和
  const signature = btoa(hexExp + SECRET).substring(0, 8).toUpperCase();
  return `SP-${hexExp.toUpperCase()}-${signature}`;
}

// 客户端用来验证激活码的函数
export function verifyCode(code: string): { valid: boolean; error?: string; exp?: number } {
  try {
    const parts = code.trim().toUpperCase().split('-');
    if (parts.length !== 3 || parts[0] !== 'SP') {
      return { valid: false, error: 'invalid_format' };
    }
    
    const hexExp = parts[1];
    const signature = parts[2];
    
    // 重新计算签名进行比对
    const expectedSig = btoa(hexExp.toLowerCase() + SECRET).substring(0, 8).toUpperCase();
    
    if (signature !== expectedSig) {
      return { valid: false, error: 'invalid_signature' };
    }

    const expDate = parseInt(hexExp, 16);
    if (Date.now() > expDate) {
      return { valid: false, error: 'expired' };
    }

    return { valid: true, exp: expDate };
  } catch (e) {
    return { valid: false, error: 'invalid_format' };
  }
}
