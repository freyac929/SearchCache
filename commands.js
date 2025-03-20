// 处理快捷键设置的脚本

// 监听存储变化，当快捷键设置改变时更新
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.shortcut) {
    const newShortcut = changes.shortcut.newValue;
    console.log('快捷键设置已更改:', newShortcut);
    updateCommandShortcut(newShortcut);
  }
});

// 初始化时检查是否有自定义快捷键
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['shortcut'], function(result) {
    if (result.shortcut) {
      console.log('加载自定义快捷键:', result.shortcut);
      updateCommandShortcut(result.shortcut);
    }
  });
});

// 更新命令快捷键
function updateCommandShortcut(shortcut) {
  // 检查快捷键格式是否正确
  if (!isValidShortcut(shortcut)) {
    console.error('无效的快捷键格式:', shortcut);
    return;
  }
  
  // 尝试使用chrome.commands.update API更新快捷键
  // 注意：此API在Manifest V3中可能受到限制，用户可能需要手动在chrome://extensions/shortcuts设置
  try {
    if (chrome.commands && chrome.commands.update) {
      chrome.commands.update({
        name: '_execute_action',
        shortcut: shortcut
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('更新快捷键失败:', chrome.runtime.lastError);
          showShortcutUpdateNotification(false, shortcut);
        } else {
          console.log('快捷键更新成功:', shortcut);
          showShortcutUpdateNotification(true, shortcut);
        }
      });
    } else {
      console.warn('chrome.commands.update API不可用，无法动态更新快捷键');
      showManualShortcutInstructions(shortcut);
    }
  } catch (error) {
    console.error('尝试更新快捷键时出错:', error);
    showManualShortcutInstructions(shortcut);
  }
}

// 验证快捷键格式
function isValidShortcut(shortcut) {
  // 基本格式检查：至少包含一个修饰键(Ctrl, Alt, Shift)和一个普通键
  const modifiers = ['Ctrl+', 'Alt+', 'Shift+'];
  let hasModifier = false;
  
  for (const modifier of modifiers) {
    if (shortcut.includes(modifier)) {
      hasModifier = true;
      break;
    }
  }
  
  // 快捷键必须包含修饰键和至少一个其他键
  return hasModifier && shortcut.length > 6;
}

// 显示快捷键更新通知
function showShortcutUpdateNotification(success, shortcut) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const message = success 
      ? `快捷键已更新为 ${shortcut}` 
      : `无法自动更新快捷键。请前往 chrome://extensions/shortcuts 手动设置为 ${shortcut}`;
      
    // 使用徽章通知用户
    chrome.action.setBadgeText({text: success ? "✓" : "!"});
    chrome.action.setBadgeBackgroundColor({color: success ? "#4CAF50" : "#F44336"});
    
    // 3秒后清除徽章
    setTimeout(() => {
      chrome.action.setBadgeText({text: ""});
    }, 3000);
    
    // 如果更新失败，显示如何手动设置的说明
    if (!success) {
      showManualShortcutInstructions(shortcut);
    }
  });
}

// 显示手动设置快捷键的说明
function showManualShortcutInstructions(shortcut) {
  console.log('需要手动设置快捷键:', shortcut);
  
  // 存储一个标志，表示需要显示快捷键设置说明
  chrome.storage.local.set({showShortcutInstructions: true, pendingShortcut: shortcut});
  
  // 创建一个通知，告诉用户如何手动设置快捷键
  try {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: '快捷键需要手动设置',
        message: '请前往 chrome://extensions/shortcuts 页面，找到"搜迹SearchCache"扩展，手动设置快捷键为 ' + shortcut,
        priority: 2
      }, function(notificationId) {
        if (chrome.runtime.lastError) {
          console.error('创建通知失败:', chrome.runtime.lastError);
        } else {
          console.log('已显示快捷键设置通知:', notificationId);
        }
      });
    }
  } catch (error) {
    console.error('创建通知时出错:', error);
  }
}

// 初始化时检查是否需要显示快捷键设置说明
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['showShortcutInstructions', 'pendingShortcut'], function(result) {
    if (result.showShortcutInstructions && result.pendingShortcut) {
      // 在这里可以实现显示说明的逻辑
      console.log('需要向用户显示如何设置快捷键:', result.pendingShortcut);
    }
  });
});