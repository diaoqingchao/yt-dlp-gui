const SECRET = "ShadowPro_Offline_Secret_2026";

// 获取命令行参数：[天数] [生成数量]
const args = process.argv.slice(2);
const days = args.length > 0 ? parseInt(args[0], 10) : 90;
const count = args.length > 1 ? parseInt(args[1], 10) : 1;

if (isNaN(days) || days <= 0) {
  console.error("❌ 错误: 有效期天数必须是一个正整数。");
  process.exit(1);
}

if (isNaN(count) || count <= 0) {
  console.error("❌ 错误: 生成数量必须是一个正整数。");
  process.exit(1);
}

console.log('\n==================================================');
console.log(`🎉 ShadowPro 激活码生成成功！`);
console.log('==================================================');
console.log(`有效天数 : ${days} 天`);
console.log(`生成数量 : ${count} 个`);
console.log('==================================================\n');

// 基础过期时间戳
const baseExpDate = Date.now() + days * 24 * 60 * 60 * 1000;

for (let i = 0; i < count; i++) {
  // 巧妙的技巧：为了让同一批次生成的激活码不重复，我们在时间戳上加上 i 毫秒。
  // 这样每个激活码的 16 进制字符串都不同，生成的签名也完全不同，且不影响前端验证！
  const expDate = baseExpDate + i;
  const hexExp = expDate.toString(16); 

  // Node.js 中使用 Buffer 来进行 Base64 编码，等同于浏览器的 btoa()
  const signature = Buffer.from(hexExp + SECRET).toString('base64').substring(0, 8).toUpperCase();

  // 拼接最终的激活码
  const code = `SP-${hexExp.toUpperCase()}-${signature}`;

  // 打印结果，使用 ANSI 转义码让激活码显示为绿色加粗
  console.log(`[${String(i + 1).padStart(3, '0')}] \x1b[32m\x1b[1m${code}\x1b[0m`);
}

console.log('\n==================================================\n');
