// 内容脚本 - 监听用户输入行为

// 检查元素是否为密码输入框或与密码相关的输入框
function isPasswordField(element) {
  try {
    // 直接检查type="password"
    if (element.type === 'password') {
      return true;
    }
    
    // 检查元素的name、id、class、placeholder等属性是否包含password相关关键词
    const passwordKeywords = ['password', 'pwd', 'passwd', 'passphrase', '密码', 'passwort', 'contraseña'];
    const attributesToCheck = [
      element.name?.toLowerCase() || '',
      element.id?.toLowerCase() || '',
      element.className?.toLowerCase() || '',
      element.placeholder?.toLowerCase() || '',
      element.getAttribute('aria-label')?.toLowerCase() || ''
    ];
    
    // 检查任一属性是否包含密码关键词
    for (const attr of attributesToCheck) {
      for (const keyword of passwordKeywords) {
        if (attr.includes(keyword)) {
          return true;
        }
      }
    }
    
    // 检查父元素是否有密码相关标签
    const parentLabels = element.closest('form')?.querySelectorAll('label');
    if (parentLabels) {
      for (const label of parentLabels) {
        if (label.htmlFor === element.id) {
          const labelText = label.textContent?.toLowerCase() || '';
          for (const keyword of passwordKeywords) {
            if (labelText.includes(keyword)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.warn('检查密码字段时出错:', error);
    return false; // 出错时保守处理，不保存
  }
}

// 检查元素是否为表单输入字段（非搜索相关）
function isFormInputField(element) {
  try {
    // 检查是否在表单中
    const form = element.closest('form');
    if (!form) return false;
    
    // 检查表单的action、id、class等属性，判断是否为创建/编辑类表单
    const formAttributes = [
      form.action?.toLowerCase() || '',
      form.id?.toLowerCase() || '',
      form.className?.toLowerCase() || '',
      form.getAttribute('data-turbo')?.toLowerCase() || '',
      form.getAttribute('aria-label')?.toLowerCase() || ''
    ];
    
    // 表单关键词：创建、新建、编辑、注册、提交等
    const formKeywords = [
      'create', 'new', 'edit', 'register', 'signup', 'submit', 'form',
      'repository', 'repo', 'project', 'profile', 'account', 'settings',
      '创建', '新建', '编辑', '注册', '提交', '表单'
    ];
    
    // 检查表单属性是否包含关键词
    for (const attr of formAttributes) {
      for (const keyword of formKeywords) {
        if (attr.includes(keyword)) {
          return true;
        }
      }
    }
    
    // 检查输入字段的属性
    const inputAttributes = [
      element.name?.toLowerCase() || '',
      element.id?.toLowerCase() || '',
      element.className?.toLowerCase() || '',
      element.placeholder?.toLowerCase() || '',
      element.getAttribute('aria-label')?.toLowerCase() || ''
    ];
    
    // 表单输入字段关键词：名称、描述、标题等
    const inputKeywords = [
      'name', 'title', 'description', 'content', 'body', 'summary',
      'address', 'phone', 'email', 'username', 'firstname', 'lastname',
      'repository', 'repo', 'project', 'profile', 'bio', 'about',
      '名称', '标题', '描述', '内容', '正文', '摘要', '地址', '电话', '邮箱', '用户名'
    ];
    
    // 检查输入字段属性是否包含关键词
    for (const attr of inputAttributes) {
      for (const keyword of inputKeywords) {
        if (attr.includes(keyword)) {
          return true;
        }
      }
    }
    
    // 特殊网站处理
    // GitHub仓库创建表单
    if (window.location.hostname.includes('github.com')) {
      // 检查是否在创建仓库页面
      if (window.location.pathname.includes('/new') || 
          window.location.pathname.includes('/create') ||
          document.querySelector('.js-repo-form')) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('检查表单输入字段时出错:', error);
    return false; // 出错时保守处理，继续保存
  }
}

// 监听表单提交事件
document.addEventListener('submit', function(event) {
  try {
    const form = event.target;
    if (form.tagName === 'FORM') {
      // 检查表单是否包含密码字段，如果包含则不记录任何输入
      const hasPasswordField = form.querySelector('input[type="password"]') !== null;
      if (hasPasswordField) {
        console.log('表单包含密码字段，不记录任何输入');
        return;
      }
      
      // 查找表单中的输入框
      const inputs = form.querySelectorAll('input[type="text"], input[type="search"], textarea');
      inputs.forEach(input => {
        // 检查是否是密码相关字段
        if (isPasswordField(input)) {
          console.log('检测到密码相关字段，不记录输入');
          return;
        }
        
        // 检查是否是表单输入字段（非搜索相关）
        if (isFormInputField(input)) {
          console.log('检测到表单输入字段，不记录输入:', input.value);
          return;
        }
        
        if (input.value.trim()) {
          console.log('表单提交捕获到输入:', input.value);
          saveInput(input.value, '表单提交');
        }
      });
    }
  } catch (error) {
    console.error('表单提交事件处理出错:', error);
  }
});

// 监听常见搜索引擎的输入框
function setupSearchEngineListeners() {
  // 常见搜索引擎的输入框选择器
  const searchSelectors = [
    // Google - 增强Google搜索选择器
    'input[name="q"]',
    'input[title="搜索"]',
    'input[title="Search"]',
    'input[aria-label="搜索"]',
    'input[aria-label="Search"]',
    // Google特定选择器
    '.gLFyf',
    '.gNO89b',
    '.RNNXgb input',
    '.a4bIc input',
    // Baidu
    'input[id="kw"]',
    'input[name="word"]',
    // Bing
    'input[name="q"]',
    // Yahoo
    'input[name="p"]',
    // 知乎
    'input[type="text"][placeholder*="搜索"]',
    
    // AI网站特定选择器
    // ChatGPT
    '#prompt-textarea',
    'textarea[placeholder*="发送消息"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[data-id="root"]',
    'textarea[class*="chat"]',
    // 百度文心一言
    '.chat-input textarea',
    '.chat-input-wrapper textarea',
    'textarea[placeholder*="请输入问题"]',
    // 讯飞星火
    '.spark-input',
    'textarea.textarea-input',
    'textarea[placeholder*="请输入"]',
    // Claude
    '.claude-input textarea',
    'textarea[placeholder*="Message Claude"]',
    'textarea[class*="claude"]',
    // 通义千问/元宝
    '.qianwen-input',
    'textarea[placeholder*="有问题尽管问"]',
    'textarea[class*="tongyi"]',
    'textarea[class*="qianwen"]',
    // New Bing
    '#searchbox textarea',
    'textarea[placeholder*="有问题尽管问"]',
    'textarea[aria-label*="提问"]',
    'textarea[class*="bing"]',
    // Deepseek
    '.chat-input-box textarea',
    '.chat-input-panel textarea',
    'textarea[placeholder*="发送信息"]',
    'textarea[placeholder*="Send a message"]',
    'textarea[class*="deepseek"]',
    'textarea[class*="chat-input"]',
    'div[role="textbox"]',
    'div[contenteditable="true"]',
    // 增强Deepseek选择器
    '.deepseek-chat-textarea',
    '.deepseek-chat-input',
    '.deepseek-input',
    '.chat-input-area textarea',
    '.chat-input-area div[contenteditable]',
    '.chat-input-container textarea',
    '.chat-input-container div[contenteditable]',
    '.message-input textarea',
    '.message-input div[contenteditable]',
    'div[data-slate-editor="true"]',
    'div[aria-label*="消息"]',
    'div[aria-label*="message"]',
    'div[class*="editor"]',
    // Gemini
    'textarea[class*="gemini"]',
    'div[class*="gemini"]',
    'textarea[aria-label*="Gemini"]',
    'div[aria-label*="Gemini"]',
    // Grok
    'textarea[class*="grok"]',
    'div[class*="grok"]',
    'textarea[aria-label*="Grok"]',
    // Perplexity
    'textarea[class*="perplexity"]',
    'div[class*="perplexity"]',
    'textarea[placeholder*="Ask anything"]',
    'textarea[placeholder*="Ask follow-up"]',
    // 豆包
    'textarea[class*="doubao"]',
    'div[class*="doubao"]',
    'textarea[placeholder*="和豆包对话"]',
    // 通用AI聊天输入框
    'textarea[placeholder*="chat"]',
    'textarea[placeholder*="聊天"]',
    'textarea[placeholder*="对话"]',
    'textarea[placeholder*="提问"]',
    'textarea[placeholder*="问题"]',
    'textarea[placeholder*="ask"]',
    'textarea[placeholder*="question"]',
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="prompt"]',
    'div[class*="chat-input"]',
    'div[class*="message-input"]',
    'div[class*="prompt-input"]',
    'div[class*="ai-input"]',
    'div[class*="bot-input"]',
    'div[class*="assistant-input"]',
    
    // 通用搜索框
    'input[type="search"]',
    'input[placeholder*="搜索"]',
    'input[placeholder*="Search"]',
    // 添加更多通用选择器
    'input[aria-label*="搜索"]',
    'input[aria-label*="Search"]',
    'input[class*="search"]',
    'input[class*="query"]',
    // 新增更多通用选择器
    'input[role="search"]',
    'input[type="text"][name*="search"]',
    'input[type="text"][name*="query"]',
    'input[type="text"][class*="search"]',
    'input[type="text"][id*="search"]',
    'input[type="text"][id*="query"]',
    // 搜索引擎特定选择器
    'input.s',
    '#search-box input',
    '.search-box input',
    '.searchbox input',
    '.search-input',
    '#searchInput',
    '.searchInput'
  ];

  // 合并所有选择器
  const allSelectors = searchSelectors.join(', ');
  const searchInputs = document.querySelectorAll(allSelectors);
  
  console.log('找到搜索框数量:', searchInputs.length);
  if (searchInputs.length > 0) {
    console.log('搜索框选择器:', allSelectors);
    // 输出找到的搜索框详细信息，帮助调试
    searchInputs.forEach((input, index) => {
      console.log(`搜索框 #${index}:`, {
        type: input.type,
        name: input.name,
        id: input.id,
        class: input.className,
        placeholder: input.placeholder,
        title: input.title,
        ariaLabel: input.getAttribute('aria-label'),
        role: input.getAttribute('role'),
        contentEditable: input.getAttribute('contenteditable'),
        parentNode: input.parentNode ? input.parentNode.tagName : 'none',
        parentClass: input.parentNode ? input.parentNode.className : 'none'
      });
    });
  } else {
    // 如果没找到搜索框，记录页面上所有input元素，帮助分析
    console.log('未找到搜索框，记录所有input元素:');
    const allInputs = document.querySelectorAll('input');
    console.log('页面上所有input元素数量:', allInputs.length);
    allInputs.forEach((input, index) => {
      if (index < 20) { // 增加记录数量，以便更全面分析
        console.log(`Input #${index}:`, {
          type: input.type,
          name: input.name,
          id: input.id,
          class: input.className,
          placeholder: input.placeholder,
          title: input.title,
          ariaLabel: input.getAttribute('aria-label'),
          parentNode: input.parentNode ? input.parentNode.tagName : 'none',
          parentClass: input.parentNode ? input.parentNode.className : 'none'
        });
      }
    });
  }

  // 直接监听所有input元素的输入和提交事件
  const allInputs = document.querySelectorAll('input');
  allInputs.forEach(input => {
    // 已经添加过监听器的输入框不再添加
    if (input.dataset.monitored) return;
    
    // 检查是否是密码字段，如果是则不添加监听器
    if (input.type === 'password' || isPasswordField(input)) {
      console.log('检测到密码字段，不添加监听器');
      return;
    }
    
    // 检查是否是表单输入字段（非搜索相关）
    if (isFormInputField(input)) {
      console.log('检测到表单输入字段，不添加监听器');
      return;
    }
    
    // 标记为已监听
    input.dataset.monitored = 'true';
    
    // 监听键盘事件，捕获回车键提交
    input.addEventListener('keydown', function(e) {
      // 再次检查是否是密码字段（可能是动态变化的）
      if (this.type === 'password' || isPasswordField(this)) {
        console.log('检测到密码字段，不记录输入');
        return;
      }
      
      // 再次检查是否是表单输入字段（可能是动态变化的）
      if (isFormInputField(this)) {
        console.log('检测到表单输入字段，不记录输入');
        return;
      }
      
      console.log('键盘事件触发:', e.key, '输入值:', this.value);
      if (e.key === 'Enter' && this.value.trim()) {
        console.log('回车键提交捕获到输入:', this.value);
        saveInput(this.value, '搜索框回车');
      }
    });
    
    // 监听失去焦点事件，可能表示用户完成了输入
    input.addEventListener('blur', function() {
      // 再次检查是否是密码字段
      if (this.type === 'password' || isPasswordField(this)) {
        console.log('检测到密码字段，不记录输入');
        return;
      }
      
      // 再次检查是否是表单输入字段
      if (isFormInputField(this)) {
        console.log('检测到表单输入字段，不记录输入');
        return;
      }
      
      if (this.value.trim()) { // 移除长度限制，记录所有有价值的输入
        console.log('失焦事件捕获到输入:', this.value);
        saveInput(this.value, '搜索框失焦');
      }
    });
  });

  // 监听contenteditable和div[role="textbox"]元素 - 增强版
  const specialInputs = document.querySelectorAll('div[contenteditable="true"], div[role="textbox"], div[data-slate-editor="true"], div[class*="editor"], div[aria-label*="消息"], div[aria-label*="message"], div[class*="chat-input"], div[class*="message-input"], div[class*="prompt-input"], div[class*="ai-input"], div[class*="bot-input"], div[class*="assistant-input"], div[class*="gemini"], div[class*="grok"], div[class*="perplexity"], div[class*="doubao"], div[class*="tongyi"], div[class*="qianwen"], div[class*="deepseek"], div[class*="claude"]');
  specialInputs.forEach(input => {
    // 已经添加过监听器的输入框不再添加
    if (input.dataset.monitored) return;
    
    // 标记为已监听
    input.dataset.monitored = 'true';
    console.log('为特殊输入框添加监听器:', input);
    
    // 监听键盘事件，捕获各种提交组合键
    input.addEventListener('keydown', function(e) {
      console.log('特殊输入框键盘事件:', e.key, '输入值:', this.textContent || this.innerText);
      
      // 获取输入内容，优先使用textContent，如果为空则尝试innerText
      const inputContent = (this.textContent || this.innerText || '').trim();
      
      // 捕获常见的提交快捷键组合
      const isEnterSubmit = e.key === 'Enter' && !e.shiftKey;
      const isCtrlEnterSubmit = e.key === 'Enter' && e.ctrlKey;
      const isMetaEnterSubmit = e.key === 'Enter' && e.metaKey; // Mac上的Command+Enter
      
      if ((isEnterSubmit || isCtrlEnterSubmit || isMetaEnterSubmit) && inputContent) {
        console.log('特殊输入框提交捕获到输入:', inputContent);
        saveInput(inputContent, 'AI输入框提交');
      }
    });
    
    // 监听失去焦点事件，可能表示用户完成了输入
    input.addEventListener('blur', function() {
      const inputContent = (this.textContent || this.innerText || '').trim();
      if (inputContent) {
        console.log('特殊输入框失焦捕获到输入:', inputContent);
        saveInput(inputContent, 'AI输入框失焦');
      }
    });
    
    // 监听点击事件，可能是通过按钮提交
    // 扩大父容器选择器范围
    const parentContainer = input.closest('.chat-input-container, .message-input, .chat-input-area, .chat-input-box, .chat-input-panel, .input-area, .input-box, .input-container, .message-container, .chat-container, [class*="chat-"], [class*="input-"], [class*="message-"]');
    if (parentContainer) {
      // 扩大按钮选择器范围
      const submitButtons = parentContainer.querySelectorAll('button, div[role="button"], span[role="button"], [class*="send"], [class*="submit"], [class*="button"], svg, [aria-label*="发送"], [aria-label*="Send"], [aria-label*="提交"], [aria-label*="Submit"]');
      submitButtons.forEach(button => {
        if (!button.dataset.monitored) {
          button.dataset.monitored = 'true';
          button.addEventListener('click', function() {
            const inputContent = (input.textContent || input.innerText || '').trim();
            if (inputContent) {
              console.log('点击提交按钮捕获到输入:', inputContent);
              saveInput(inputContent, 'AI点击提交按钮');
            }
          });
        }
      });
    }
  });
  
  // 全局监听提交按钮点击事件，用于捕获可能的AI网站提交
  document.querySelectorAll('button, div[role="button"], span[role="button"], [class*="send"], [class*="submit"], [class*="button"], svg[class*="send"], svg[class*="submit"]').forEach(button => {
    if (!button.dataset.globalMonitored) {
      button.dataset.globalMonitored = 'true';
      button.addEventListener('click', function() {
        // 尝试查找附近的输入框
        const parent = this.closest('[class*="chat"], [class*="message"], [class*="input"], [class*="prompt"], form');
        if (parent) {
          const inputs = parent.querySelectorAll('textarea, div[contenteditable="true"], div[role="textbox"], [class*="input"]');
          inputs.forEach(input => {
            let inputContent = '';
            if (input.tagName.toLowerCase() === 'textarea') {
              inputContent = input.value.trim();
            } else {
              inputContent = (input.textContent || input.innerText || '').trim();
            }
            
            if (inputContent) {
              console.log('全局按钮点击捕获到输入:', inputContent);
              saveInput(inputContent, 'AI全局按钮点击');
            }
          });
        }
      });
    }
  });
  // 为找到的搜索框添加特定监听器
  searchInputs.forEach(input => {
    // 已经添加过监听器的输入框不再添加
    if (input.dataset.searchMonitored) return;
    
    // 标记为已监听
    input.dataset.searchMonitored = 'true';
    console.log('为搜索框添加监听器:', input);
    
    // 监听键盘事件，捕获回车键提交
    input.addEventListener('keydown', function(e) {
      console.log('搜索框键盘事件:', e.key, '输入值:', this.value);
      if (e.key === 'Enter' && this.value.trim()) {
        console.log('搜索框回车提交捕获到输入:', this.value);
        saveInput(this.value, '搜索框回车');
      }
    });
    
    // 监听失去焦点事件，可能表示用户完成了输入
    input.addEventListener('blur', function() {
      if (this.value.trim()) { // 移除长度限制，记录所有有价值的输入
        console.log('搜索框失焦捕获到输入:', this.value);
        saveInput(this.value, '搜索框失焦');
      }
    });
    
    // 添加点击搜索按钮的监听
    const form = input.closest('form');
    if (form) {
      const searchButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button, input[type="button"]');
      searchButtons.forEach(button => {
        if (!button.dataset.monitored) {
          button.dataset.monitored = 'true';
          button.addEventListener('click', function() {
            if (input.value.trim()) {
              console.log('点击搜索按钮捕获到输入:', input.value);
              saveInput(input.value, '点击搜索按钮');
            }
          });
        }
      });
    }
  });
}

// 本地缓存，用于前端去重
let lastSavedInputs = [];

// 记录已保存的Google搜索词，避免URL参数和搜索框回车重复
let savedGoogleSearches = {};

// 保存输入内容到背景脚本
function saveInput(text, source) {
  try {
    // 参数验证
    if (!text || typeof text !== 'string') {
      console.warn('无效的输入文本:', text);
      return;
    }
    
    if (text.length < 2) {
      console.log('输入文本太短，已忽略');
      return;
    }
    
    // 检查文本是否包含密码相关关键词，作为最后一道防线
    const passwordKeywords = ['password', 'pwd', 'passwd', 'passphrase', '密码', 'passwort', 'contraseña'];
    const lowerText = text.toLowerCase();
    for (const keyword of passwordKeywords) {
      if (lowerText.includes(keyword)) {
        console.log('检测到可能的密码内容，已阻止保存');
        return;
      }
    }
    
    // 确保source参数有效
    source = source || '未知来源';
    if (typeof source !== 'string') {
      console.warn('无效的来源类型，使用默认值');
      source = '未知来源';
    }
    
    // 安全检查：确保window.location可用
    if (!window || !window.location) {
      console.warn('无法获取页面位置信息');
      return;
    }
    // 生成唯一标识，用于本地去重
    let inputKey;
    try {
      inputKey = `${text}|${window.location.href}`;
    } catch (error) {
      console.warn('生成输入标识时出错:', error);
      inputKey = `${text}|unknown-url-${Date.now()}`;
    }
    
    // 检查是否在短时间内重复提交
    const now = Date.now();
    const recentInput = lastSavedInputs.find(item => item.key === inputKey);
    
    if (recentInput && now - recentInput.timestamp < 5000) { // 5秒内的重复提交将被忽略
      console.log('本地检测到重复输入，已忽略:', text);
      return;
    }
    
  
    try {
      if (window.location.hostname && window.location.hostname.includes('google') && 
          (source === 'Google URL参数' || source === '搜索框回车')) {
        // 检查是否已经保存过相同的搜索词
        if (savedGoogleSearches[text] && now - savedGoogleSearches[text] < 10000) { // 10秒内的重复提交将被忽略
          console.log('Google搜索重复，已忽略:', text, '来源:', source);
          return;
        }
        // 记录此搜索词已被保存
        savedGoogleSearches[text] = now;
      }
      
      // 特殊处理AI网站输入，增加更长的去重时间窗口
      const isAIWebsite = (
        window.location.hostname.includes('chat.openai.com') || // ChatGPT
        window.location.hostname.includes('yiyan.baidu.com') || // 文心一言
        window.location.hostname.includes('xinghuo.xfyun.cn') || // 讯飞星火
        window.location.hostname.includes('claude.ai') || // Claude
        window.location.hostname.includes('qianwen.aliyun.com') || // 通义千问
        window.location.hostname.includes('bing.com/chat') || // New Bing
        window.location.hostname.includes('deepseek.com') || // Deepseek
        window.location.hostname.includes('deepseek.ai') || // Deepseek AI
        window.location.hostname.includes('gemini.google.com') || // Gemini
        window.location.hostname.includes('grok.x.ai') || // Grok
        window.location.hostname.includes('x.ai') || // X.AI
        window.location.hostname.includes('perplexity.ai') || // Perplexity
        window.location.hostname.includes('doubao.com') || // 豆包
        window.location.hostname.includes('yiyan.baidu.com') || // 文心一言
        window.location.hostname.includes('tongyi.aliyun.com') // 通义千问/元宝
      );
      
      if (isAIWebsite) {
        // 对于AI网站，使用更长的去重时间窗口（30秒）
        if (savedGoogleSearches[text] && now - savedGoogleSearches[text] < 30000) {
          console.log('AI网站输入重复，已忽略:', text, '来源:', source);
          return;
        }
        // 记录此AI输入已被保存
        savedGoogleSearches[text] = now;
      }
    } catch (error) {
      console.warn('处理Google搜索去重时出错:', error);
      // 继续执行，不阻止保存
    }
    
    // 更新本地缓存
    lastSavedInputs.push({
      key: inputKey,
      timestamp: now
    });
    
    // 只保留最近的10条记录
    if (lastSavedInputs.length > 10) {
      lastSavedInputs.shift();
    }
    
    console.log('尝试保存输入:', text, '来源:', source);
    
    try {
      // 安全获取URL和标题
      let currentUrl = '';
      let currentTitle = '';
      
      try {
        currentUrl = window.location.href || '';
      } catch (urlError) {
        console.warn('获取当前URL时出错:', urlError);
        currentUrl = '';
      }
      
      try {
        currentTitle = document.title || '';
      } catch (titleError) {
        console.warn('获取页面标题时出错:', titleError);
        currentTitle = '';
      }
      
      // 安全检查：确保chrome.runtime存在
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          // 发送消息到背景脚本
          chrome.runtime.sendMessage({
            action: 'saveInput',
            data: {
              text: text,
              url: currentUrl,
              title: currentTitle,
              source: source,
              timestamp: Date.now()
            }
          }, function(response) {
            if (response && response.success) {
              console.log('输入已成功保存');
            } else {
              console.warn('保存输入失败:', response ? response.error : '未知错误');
            }
          });
        } catch (sendError) {
          console.error('发送消息时发生错误:', sendError);
        }
      } else {
        console.error('发送消息时发生错误: chrome.runtime 未定义或不可用');
      }
    } catch (error) {
      console.error('发送消息时发生错误:', error);
    }
  } catch (error) {
    console.error('保存输入时发生错误:', error);
  }
}

// 监听Google搜索结果页面的特殊处理
function setupGoogleSearchListener() {
  try {
    // 检查是否是Google搜索页面
    if (!window || !window.location || !window.location.hostname) {
      console.warn('无法获取当前页面的hostname');
      return;
    }
    
    // 声明lastUrl变量在函数作用域内，而不是在if块内
    let lastUrl = '';
    
    if (window.location.hostname.includes('google')) {
      console.log('检测到Google搜索页面，设置特殊监听');
      
      // 初始化lastUrl变量
      try {
        lastUrl = location.href || '';
      } catch (error) {
        console.warn('获取初始URL时出错:', error);
        lastUrl = '';
      }
      // 删除这里的return语句，允许函数继续执行
    }
    
    try {
      new MutationObserver(() => {
        let url;
        try {
          url = location.href || '';
        } catch (urlError) {
          console.warn('MutationObserver中获取URL时出错:', urlError);
          return;
        }
        
        if (url !== lastUrl) {
          lastUrl = url;
          console.log('Google页面URL变化，可能是新搜索:', url);
          
          // 尝试从URL中提取搜索词
          try {
            // 检查URL是否有效
            let searchString;
            try {
              searchString = location.search;
              if (!searchString) {
                console.log('URL没有搜索参数');
                return;
              }
            } catch (searchError) {
              console.warn('获取URL搜索参数时出错:', searchError);
              return;
            }
            
            const searchParams = new URLSearchParams(location.search);
            const searchQuery = searchParams.get('q');
            
            if (searchQuery) {
              console.log('从URL提取到搜索词:', searchQuery);
              // 使用try-catch包装saveInput调用
              try {
                saveInput(searchQuery, 'Google URL参数');
              } catch (saveError) {
                console.error('保存Google搜索词时发生错误:', saveError);
              }
            } else {
              console.log('URL中没有找到搜索词参数');
            }
          } catch (error) {
            console.error('提取搜索词时发生错误:', error);
          }
        }
      }).observe(document, {subtree: true, childList: true});
    } catch (error) {
      console.error('设置MutationObserver时发生错误:', error);
    }
    
    // 初始检查URL中是否有搜索词
    try {
      const searchParams = new URLSearchParams(location.search);
      const searchQuery = searchParams.get('q');
      
      if (searchQuery) {
        console.log('初始加载页面，从URL提取到搜索词:', searchQuery);
        saveInput(searchQuery, 'Google URL参数');
      }
    } catch (error) {
      console.error('初始检查URL搜索词时发生错误:', error);
    }
  }
  catch (error) {
    console.error('setupGoogleSearchListener函数执行出错:', error);
  }
}

// 初始设置监听器
setupSearchEngineListeners();
setupGoogleSearchListener();

// 由于页面可能是动态加载的，定期检查并设置监听器
setInterval(() => {
  setupSearchEngineListeners();
  setupGoogleSearchListener();
}, 3000);

// 监听DOM变化，为新添加的搜索框设置监听器
const observer = new MutationObserver(function(mutations) {
  setupSearchEngineListeners();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});