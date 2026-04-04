#!/usr/bin/env node

/**
 * 飞书交互式卡片技能测试脚本
 * 验证所有核心功能是否正常工作
 */

const fs = require('fs');
const path = require('path');
const CardTemplates = require('./card-templates');

console.log('🧪 开始测试飞书交互式卡片技能...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   错误: ${error.message}`);
    failed++;
  }
}

// 测试 1: 验证文件结构
test('验证文件结构', () => {
  const requiredFiles = [
    '../SKILL.md',
    '../README.md',
    './card-callback-server.js',
    './send-card.js',
    './card-templates.js',
    './package.json',
    '../examples/confirmation-card.json',
    '../examples/todo-card.json',
    '../examples/poll-card.json',
    '../examples/form-card.json'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`缺少文件: ${file}`);
    }
  });
});

// 测试 2: 验证卡片模板函数
test('验证确认卡片模板', () => {
  const card = CardTemplates.createConfirmationCard('测试消息');
  if (!card.config || !card.header || !card.elements) {
    throw new Error('卡片结构不完整');
  }
  if (card.elements.length < 3) {
    throw new Error('卡片元素数量不足');
  }
});

test('验证投票卡片模板', () => {
  const card = CardTemplates.createPollCard('测试投票', ['选项1', '选项2', '选项3']);
  if (!card.config || !card.header || !card.elements) {
    throw new Error('卡片结构不完整');
  }
});

test('验证 TODO 卡片模板', () => {
  const todos = [
    { id: 'todo1', text: '任务1', completed: false, priority: 'high' },
    { id: 'todo2', text: '任务2', completed: true, priority: 'medium' }
  ];
  const card = CardTemplates.createTodoCard(todos);
  if (!card.config || !card.header || !card.elements) {
    throw new Error('卡片结构不完整');
  }
});

test('验证通知卡片模板', () => {
  const card = CardTemplates.createNotificationCard('测试通知', { type: 'success' });
  if (!card.config || !card.header || !card.elements) {
    throw new Error('卡片结构不完整');
  }
});

test('验证选择卡片模板', () => {
  const card = CardTemplates.createChoiceCard('测试问题', ['选项A', '选项B']);
  if (!card.config || !card.header || !card.elements) {
    throw new Error('卡片结构不完整');
  }
});

// 测试 3: 验证示例卡片 JSON
test('验证示例卡片 JSON 格式', () => {
  const examples = [
    '../examples/confirmation-card.json',
    '../examples/todo-card.json',
    '../examples/poll-card.json',
    '../examples/form-card.json'
  ];
  
  examples.forEach(file => {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const card = JSON.parse(content);
    
    if (!card.config || !card.header || !card.elements) {
      throw new Error(`${file} 结构不完整`);
    }
  });
});

// 测试 4: 验证 package.json
test('验证 package.json', () => {
  const packagePath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!pkg.dependencies || !pkg.dependencies.axios || !pkg.dependencies['@larksuiteoapi/node-sdk']) {
    throw new Error('缺少必要的依赖');
  }
});

// 测试 5: 验证 SKILL.md 格式
test('验证 SKILL.md 格式', () => {
  const skillPath = path.join(__dirname, '..', 'SKILL.md');
  const content = fs.readFileSync(skillPath, 'utf8');
  
  // 检查 YAML frontmatter
  if (!content.startsWith('---')) {
    throw new Error('缺少 YAML frontmatter');
  }
  
  // 检查必要字段
  const requiredFields = ['name:', 'description:', 'when:', 'examples:', 'metadata:'];
  requiredFields.forEach(field => {
    if (!content.includes(field)) {
      throw new Error(`缺少必要字段: ${field}`);
    }
  });
});

// 输出测试结果
console.log('\n' + '='.repeat(50));
console.log(`测试完成: ${passed} 通过, ${failed} 失败`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n⚠️  部分测试失败，请检查错误信息');
  process.exit(1);
} else {
  console.log('\n🎉 所有测试通过！技能已准备就绪！');
  console.log('\n下一步:');
  console.log('1. 启动回调服务器: node card-callback-server.js');
  console.log('2. 发送测试卡片: node send-card.js confirmation "测试" --chat-id oc_xxx');
  console.log('3. 推送到 ClawHub: openclaw skill publish');
  process.exit(0);
}
